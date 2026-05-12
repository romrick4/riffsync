"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
export function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const inviteCode = searchParams.get("invite");

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;

    setError("");
    setLoading(true);

    try {
      const { createSupabaseBrowserClient } = await import(
        "@/lib/supabase/client"
      );
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "magiclink",
      });

      if (verifyError) {
        setError("That code didn't work. Check your email and try again.");
        return;
      }

      if (inviteCode) {
        router.push(`/invite/${inviteCode}`);
      } else {
        router.push("/projects");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    setError("");

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError("We couldn't send a new code right now. Try again shortly.");
        return;
      }

      setResent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    router.push("/register");
    return null;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>
          <Logo size="lg" className="justify-center" />
        </CardTitle>
        <CardDescription>
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to
          finish setting up your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} className="size-11 text-lg" />
              <InputOTPSlot index={1} className="size-11 text-lg" />
              <InputOTPSlot index={2} className="size-11 text-lg" />
              <InputOTPSlot index={3} className="size-11 text-lg" />
              <InputOTPSlot index={4} className="size-11 text-lg" />
              <InputOTPSlot index={5} className="size-11 text-lg" />
            </InputOTPGroup>
          </InputOTP>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {resent && (
            <p className="text-sm text-muted-foreground">
              New code sent. Check your inbox.
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full"
          >
            {loading ? "Verifying…" : "Verify and sign in"}
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
          >
            {resending ? "Sending…" : "Didn't get a code? Send again"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
