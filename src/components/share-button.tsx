"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

interface ShareButtonProps {
  url?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "xs" | "icon" | "icon-sm" | "icon-xs";
  className?: string;
}

export function ShareButton({
  url,
  variant = "ghost",
  size = "icon-sm",
  className,
}: ShareButtonProps) {
  async function handleShare() {
    const shareUrl = url
      ? `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`
      : window.location.href;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleShare} className={className}>
      <ShareIcon className="size-3.5" />
    </Button>
  );
}
