"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

export function InviteLanding({
  projectName,
  inviteCode,
}: {
  projectName: string;
  inviteCode: string;
}) {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("riffsync_invite_code", inviteCode);
  }, [inviteCode]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Music className="size-6 text-primary" />
          </div>
          <CardTitle className="mt-4">
            You&apos;ve been invited to join
          </CardTitle>
          <CardDescription className="text-base font-medium text-foreground">
            {projectName}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={() => router.push(`/register?invite=${inviteCode}`)}>
            Create an account
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/login?invite=${inviteCode}`)}
          >
            I already have an account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
