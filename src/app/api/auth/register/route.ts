import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, "register", {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (rateLimited) return rateLimited;

  try {
    const { email, password, displayName, username } = await request.json();

    if (!email || !password || !displayName || !username) {
      return NextResponse.json(
        { error: "Email, password, display name, and username are required" },
        { status: 400 },
      );
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    if (
      typeof displayName !== "string" ||
      displayName.trim().length < 1 ||
      displayName.trim().length > 100
    ) {
      return NextResponse.json(
        { error: "Display name must be between 1 and 100 characters" },
        { status: 400 },
      );
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-30 characters (letters, numbers, underscore)",
        },
        { status: 400 },
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters" },
        { status: 400 },
      );
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 },
      );
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const supabase = await createSupabaseAdminClient();
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName, username },
      });

    if (authError || !authData.user) {
      console.error("[register] Supabase auth error:", authError);
      return NextResponse.json(
        { error: "Something went wrong creating your account. Try again." },
        { status: 500 },
      );
    }

    const user = await prisma.user.create({
      data: {
        supabaseId: authData.user.id,
        email: email.toLowerCase(),
        displayName: displayName.trim(),
        username,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong on our end. Try again in a moment." },
      { status: 500 },
    );
  }
}
