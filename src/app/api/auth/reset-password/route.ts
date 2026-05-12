import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, "reset-password", {
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

    const supabase = await createSupabaseServerClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${appUrl}/reset-password/confirm`,
    });

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: "If an account exists with that email, we sent a reset link.",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong on our end. Try again in a moment." },
      { status: 500 },
    );
  }
}
