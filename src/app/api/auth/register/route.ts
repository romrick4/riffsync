import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, "register", {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (rateLimited) return rateLimited;

  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "Email, password, and display name are required" },
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

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters" },
        { status: 400 },
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

    const adminClient = await createSupabaseAdminClient();
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: false,
        user_metadata: { display_name: displayName },
      });

    if (authError || !authData.user) {
      console.error("[register] Supabase auth error:", authError);
      return NextResponse.json(
        { error: "Something went wrong creating your account. Try again." },
        { status: 500 },
      );
    }

    await prisma.user.create({
      data: {
        supabaseId: authData.user.id,
        email: email.toLowerCase(),
        displayName: displayName.trim(),
      },
    });

    const supabase = await createSupabaseServerClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
    });

    if (otpError) {
      console.error("[register] Failed to send verification code:", otpError);
    }

    return NextResponse.json({ email: email.toLowerCase() });
  } catch (err) {
    console.error("[register] Unhandled error:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Try again in a moment." },
      { status: 500 },
    );
  }
}
