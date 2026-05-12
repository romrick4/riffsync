import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, "login", {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (rateLimited) return rateLimited;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Wrong email or password. Try again." },
        { status: 401 },
      );
    }

    const profile = await prisma.user.findUnique({
      where: { supabaseId: data.user.id },
      select: {
        id: true,
        displayName: true,
        email: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Something went wrong on our end. Try again in a moment." },
        { status: 500 },
      );
    }

    return NextResponse.json({ user: profile });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong on our end. Try again in a moment." },
      { status: 500 },
    );
  }
}
