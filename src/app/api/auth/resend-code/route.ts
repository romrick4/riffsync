import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, "resend-code", {
    windowMs: 60_000,
    maxRequests: 3,
  });
  if (rateLimited) return rateLimited;

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const adminClient = await createSupabaseAdminClient();
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: email.toLowerCase(),
      });

    if (linkError || !linkData.properties?.email_otp) {
      return NextResponse.json(
        { error: "We couldn't send a new code right now. Try again shortly." },
        { status: 500 },
      );
    }

    const otp = linkData.properties.email_otp;
    await sendEmail(
      email.toLowerCase(),
      "Your RiffSync verification code",
      `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 28px; font-weight: 700; background: linear-gradient(to right, #818cf8, #a78bfa, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">RiffSync</h1>
        </div>
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="font-size: 16px; color: #111827; margin: 0 0 8px;">Here's your verification code</p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">Enter this code in RiffSync to sign in.</p>
          <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111827; background-color: #f3f4f6; border-radius: 8px; padding: 16px 24px; display: inline-block; margin-bottom: 24px;">${otp}</div>
          <p style="font-size: 13px; color: #9ca3af; margin: 0;">This code expires in 10 minutes. If you didn't request this, you can safely ignore it.</p>
        </div>
        <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">RiffSync — Your band's creative hub</p>
      </div>`,
    );

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[resend-code] Unhandled error:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Try again in a moment." },
      { status: 500 },
    );
  }
}
