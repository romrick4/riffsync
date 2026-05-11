import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { displayName, username, password } = await request.json();

    if (!displayName || !username || !password) {
      return NextResponse.json(
        { error: "Display name, username, and password are required" },
        { status: 400 },
      );
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters (letters, numbers, underscore)" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
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
