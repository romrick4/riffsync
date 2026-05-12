"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Check } from "lucide-react";

export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const inviteLink = origin ? `${origin}/invite/${code}` : `/invite/${code}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="min-w-0 truncate rounded-md bg-muted px-3 py-1.5 font-mono text-sm">
        {inviteLink}
      </code>
      <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={handleCopy}>
        {copied ? <Check className="size-3.5" /> : <LinkIcon className="size-3.5" />}
      </Button>
    </div>
  );
}
