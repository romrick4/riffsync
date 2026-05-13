"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { MoreHorizontalIcon, LockIcon, UnlockIcon, TrashIcon, LinkIcon } from "lucide-react";
import { getPollUrl } from "@/lib/share";

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface PollData {
  id: string;
  question: string;
  isActive: boolean;
  createdBy: { id: string; displayName: string };
  createdById: string;
  createdAt: string;
  totalVotes: number;
  userVotedOptionId: string | null;
  options: PollOption[];
}

export function PollCard({
  poll: initialPoll,
  projectId,
  currentUserId,
  isOwner,
  highlight,
  onPollChanged,
}: {
  poll: PollData;
  projectId: string;
  currentUserId: string;
  isOwner: boolean;
  highlight?: boolean;
  onPollChanged: () => void;
}) {
  const [poll, setPoll] = useState(initialPoll);
  const [submitting, setSubmitting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState(highlight);

  useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);

  useEffect(() => {
    if (highlight && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const timeout = setTimeout(() => setHighlighted(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [highlight]);

  const hasVoted = poll.userVotedOptionId !== null;
  const showResults = hasVoted || !poll.isActive;
  const canManage = isOwner || poll.createdById === currentUserId;

  async function handleVote(optionId: string) {
    if (!poll.isActive || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/polls/${poll.id}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Something went wrong. Try again.");
        return;
      }

      const oldVotedOption = poll.userVotedOptionId;
      const newTotal =
        oldVotedOption === null ? poll.totalVotes + 1 : poll.totalVotes;

      setPoll({
        ...poll,
        userVotedOptionId: optionId,
        totalVotes: newTotal,
        options: poll.options.map((opt) => ({
          ...opt,
          voteCount:
            opt.id === optionId
              ? opt.voteCount + 1
              : opt.id === oldVotedOption
                ? opt.voteCount - 1
                : opt.voteCount,
        })),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive() {
    const res = await fetch(
      `/api/projects/${projectId}/polls/${poll.id}`,
      { method: "PATCH" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Something went wrong. Try again.");
      return;
    }
    toast.success(poll.isActive ? "Poll closed" : "Poll reopened");
    onPollChanged();
  }

  async function handleDelete() {
    const res = await fetch(
      `/api/projects/${projectId}/polls/${poll.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Something went wrong. Try again.");
      throw new Error("delete failed");
    }
    toast.success("Poll deleted");
    onPollChanged();
  }

  const createdDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(poll.createdAt));

  return (
    <Card
      ref={cardRef}
      className={cn(
        "transition-all duration-500",
        highlighted && "ring-2 ring-primary/60 shadow-lg shadow-primary/10",
      )}
    >
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-medium">{poll.question}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              by {poll.createdBy.displayName} · {createdDate} ·{" "}
              {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!poll.isActive && (
              <Badge variant="secondary" className="shrink-0">
                Closed
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                const url = `${window.location.origin}${getPollUrl(projectId, poll.id)}`;
                navigator.clipboard.writeText(url);
                toast.success("Link copied!");
              }}
            >
              <LinkIcon className="size-3.5" />
            </Button>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" />
                  }
                >
                  <MoreHorizontalIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleToggleActive}>
                    {poll.isActive ? (
                      <>
                        <LockIcon className="size-4" />
                        Close poll
                      </>
                    ) : (
                      <>
                        <UnlockIcon className="size-4" />
                        Reopen poll
                      </>
                    )}
                  </DropdownMenuItem>
                  <DeleteConfirmDialog
                    title="Delete this poll?"
                    description="All votes will be permanently removed. This can't be undone."
                    confirmLabel="Delete Poll"
                    trigger={
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <TrashIcon className="size-4" />
                        Delete poll
                      </DropdownMenuItem>
                    }
                    onConfirm={handleDelete}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {poll.options.map((option) => {
            const pct =
              poll.totalVotes > 0
                ? Math.round((option.voteCount / poll.totalVotes) * 100)
                : 0;
            const isUserVote = option.id === poll.userVotedOptionId;

            if (showResults) {
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={!poll.isActive || submitting}
                  onClick={() => poll.isActive && handleVote(option.id)}
                  className={cn(
                    "relative w-full overflow-hidden rounded-md border px-3 py-3 text-left text-sm transition-colors",
                    isUserVote
                      ? "border-primary/50 bg-primary/5"
                      : "border-border",
                    poll.isActive && "cursor-pointer hover:border-primary/30",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all",
                      isUserVote ? "bg-primary/15" : "bg-muted",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between gap-2">
                    <span className={cn(isUserVote && "font-medium")}>
                      {option.text}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={option.id}
                type="button"
                disabled={submitting}
                onClick={() => handleVote(option.id)}
                className="w-full rounded-md border border-border px-3 py-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                {option.text}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
