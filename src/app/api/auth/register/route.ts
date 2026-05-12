import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

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

    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: email.toLowerCase(),
      });

    if (linkError || !linkData.properties?.email_otp) {
      console.error("[register] Failed to generate verification code:", linkError);
      return NextResponse.json({ email: email.toLowerCase() });
    }

    const otp = linkData.properties.email_otp;
    const emailSent = await sendEmail(
      email.toLowerCase(),
      "Your RiffSync verification code",
      `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 28px; font-weight: 700; background: linear-gradient(to right, #818cf8, #a78bfa, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">RiffSync</h1>
        </div>
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="font-size: 16px; color: #111827; margin: 0 0 8px;">Here's your verification code</p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">Enter this code in RiffSync to finish creating your account.</p>
          <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111827; background-color: #f3f4f6; border-radius: 8px; padding: 16px 24px; display: inline-block; margin-bottom: 24px;">${otp}</div>
          <p style="font-size: 13px; color: #9ca3af; margin: 0;">This code expires in 10 minutes. If you didn't create an account, you can ignore this email.</p>
        </div>
        <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">RiffSync — Your band's creative hub</p>
      </div>`,
    );

    if (!emailSent) {
      console.error("[register] Failed to send verification email");
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
