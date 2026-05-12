import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store; sufficient for single-instance deployments.
// For multi-instance, replace with Redis or similar.
const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

// Set TRUSTED_PROXY_IPS (comma-separated) to only trust forwarded headers
// from known reverse proxies (e.g. "127.0.0.1,::1,10.0.0.1").
// When unset, forwarded headers are ignored entirely for safety.
const trustedProxies = new Set(
  (process.env.TRUSTED_PROXY_IPS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

function getClientIp(request: NextRequest): string {
  const socketIp = request.headers.get("x-real-ip") ?? "unknown";

  if (trustedProxies.size > 0 && trustedProxies.has(socketIp)) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const chain = forwarded.split(",").map((s) => s.trim());
      for (let i = chain.length - 1; i >= 0; i--) {
        if (!trustedProxies.has(chain[i])) return chain[i];
      }
    }
  }

  return socketIp;
}

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export function rateLimit(
  request: NextRequest,
  keyPrefix: string,
  { windowMs, maxRequests }: RateLimitOptions,
): NextResponse | null {
  cleanup();

  const ip = getClientIp(request);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests, please try again later" },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      },
    );
  }

  return null;
}
