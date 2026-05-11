"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface PollData {
  id: string;
  question: string;
  isActive: boolean;
  createdBy: { id: string; displayName: string; username: string };
  createdAt: string;
  totalVotes: number;
  userVotedOptionId: string | null;
  options: PollOption[];
}

export function PollCard({
  poll: initialPoll,
  projectId,
}: {
  poll: PollData;
  projectId: string;
}) {
  const [poll, setPoll] = useState(initialPoll);
  const [submitting, setSubmitting] = useState(false);

  const hasVoted = poll.userVotedOptionId !== null;
  const showResults = hasVoted || !poll.isActive;

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

      if (res.ok) {
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
      }
    } finally {
      setSubmitting(false);
    }
  }

  const createdDate = new Intl.DateTimeFormat("default", {
    month: "short",
    day: "numeric",
  }).format(new Date(poll.createdAt));

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-medium">{poll.question}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              by {poll.createdBy.displayName} · {createdDate} ·{" "}
              {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
            </p>
          </div>
          {!poll.isActive && (
            <Badge variant="secondary" className="shrink-0">
              Closed
            </Badge>
          )}
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
                    "relative w-full overflow-hidden rounded-md border px-3 py-2 text-left text-sm transition-colors",
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
                className="w-full rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary/50 hover:bg-muted/50"
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
