"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ClockIcon,
  SendIcon,
  UserIcon,
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  timestampSec: number;
  createdAt: string;
  user: { id: string; displayName: string };
}

export interface AudioCommentsProps {
  comments: Comment[];
  onAddComment: (content: string, timestampSec: number) => Promise<void>;
  currentTimestamp: number;
  onSeekTo: (timestampSec: number) => void;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function relativeTime(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US");
}

const PROXIMITY_SEC = 3;

export function AudioComments({
  comments,
  onAddComment,
  currentTimestamp,
  onSeekTo,
}: AudioCommentsProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const sorted = [...comments].sort(
    (a, b) => a.timestampSec - b.timestampSec
  );

  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentTimestamp]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAddComment(content.trim(), currentTimestamp);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border bg-card p-4">
      <h3 className="text-base font-medium">Comments</h3>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto"
      >
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No comments yet. Click on the waveform and leave a comment.
          </p>
        ) : (
          sorted.map((c) => {
            const isNear =
              Math.abs(c.timestampSec - currentTimestamp) < PROXIMITY_SEC;
            return (
              <div
                key={c.id}
                data-active={isNear}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isNear
                    ? "bg-primary/10 ring-1 ring-primary/20"
                    : "hover:bg-muted/50"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSeekTo(c.timestampSec)}
                  className="mt-0.5 shrink-0 rounded bg-muted px-2 py-1 font-mono text-xs tabular-nums text-primary hover:bg-primary/20 transition-colors"
                >
                  {formatTime(c.timestampSec)}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="size-3 text-muted-foreground" />
                    <span className="font-medium text-card-foreground">
                      {c.user.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-card-foreground/80">{c.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex shrink-0 items-center gap-1.5 rounded bg-muted px-2 py-1.5 text-xs font-mono tabular-nums text-muted-foreground">
          <ClockIcon className="size-3" />
          {formatTime(currentTimestamp)}
        </div>
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          disabled={submitting}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || submitting}
        >
          <SendIcon className="size-4" />
        </Button>
      </form>
    </div>
  );
}
