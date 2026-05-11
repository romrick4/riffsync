import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const DUMMY_HASH = "$2a$12$000000000000000000000uGByMaIOmttFQHem7sCKYGLtob1JvXW";

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, "login", { windowMs: 60_000, maxRequests: 10 });
  if (rateLimited) return rateLimited;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    // Always run bcrypt to prevent timing-based user enumeration
    const passwordValid = await verifyPassword(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !passwordValid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

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
