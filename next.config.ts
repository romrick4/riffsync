import type { NextConfig } from "next";

const r2Domain = process.env.S3_ENDPOINT
  ? new URL(process.env.S3_ENDPOINT).hostname
  : "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "archiver"],
  async headers() {
    const storageOrigins = r2Domain ? `https://${r2Domain}` : "";
    const supabaseOrigin = supabaseUrl || "";

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: blob: ${storageOrigins}`.trim(),
              `media-src 'self' blob: ${storageOrigins}`.trim(),
              "font-src 'self'",
              `connect-src 'self' ${storageOrigins} ${supabaseOrigin}`.trim(),
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
