import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, "register", { windowMs: 60_000, maxRequests: 5 });
  if (rateLimited) return rateLimited;

  try {
    const { displayName, username, password } = await request.json();

    if (!displayName || !username || !password) {
      return NextResponse.json(
        { error: "Display name, username, and password are required" },
        { status: 400 },
      );
    }

    if (typeof displayName !== "string" || displayName.trim().length < 1 || displayName.trim().length > 100) {
      return NextResponse.json(
        { error: "Display name must be between 1 and 100 characters" },
        { status: 400 },
      );
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters (letters, numbers, underscore)" },
        { status: 400 },
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { displayName, username, passwordHash },
    });

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
