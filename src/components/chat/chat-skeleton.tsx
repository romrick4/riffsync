"use client";

import { cn } from "@/lib/utils";

const BUBBLE_WIDTHS = ["w-48", "w-56", "w-40", "w-64", "w-44", "w-52", "w-36", "w-60"];

export function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-12rem)] flex-col overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        {BUBBLE_WIDTHS.map((width, i) => {
          const isRight = i % 3 === 0;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-1",
                isRight ? "items-end" : "items-start",
              )}
            >
              {!isRight && (
                <div className="ml-1 h-3 w-16 animate-chat-skeleton-shimmer rounded bg-muted" />
              )}
              <div
                className={cn(
                  "h-10 animate-chat-skeleton-shimmer rounded-2xl bg-muted",
                  width,
                )}
                style={{ animationDelay: `${i * 80}ms` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-end gap-2 border-t bg-background px-4 py-3">
        <div className="h-9 flex-1 animate-chat-skeleton-shimmer rounded-lg bg-muted" />
        <div className="size-9 animate-chat-skeleton-shimmer rounded-md bg-muted" />
      </div>
    </div>
  );
}
