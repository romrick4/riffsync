"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { MessageContent } from "./message-content";

export interface ChatMessageData {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: { id: string; displayName: string };
  reactions: { userId: string }[];
  _optimistic?: boolean;
  _failed?: boolean;
}

interface MessageBubbleProps {
  message: ChatMessageData;
  isOwn: boolean;
  showAuthor: boolean;
  onReact: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  currentUserId: string;
  projectId: string;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageBubbleInner({
  message,
  isOwn,
  showAuthor,
  onReact,
  onRetry,
  currentUserId,
  projectId,
}: MessageBubbleProps) {
  const hasReacted = message.reactions.some((r) => r.userId === currentUserId);
  const reactionCount = message.reactions.length;

  return (
    <div
      className={cn(
        "group flex flex-col gap-0.5 animate-chat-message-in",
        isOwn ? "items-end" : "items-start",
      )}
    >
      {showAuthor && !isOwn && (
        <span className="ml-1 text-xs font-medium text-muted-foreground">
          {message.user.displayName}
        </span>
      )}

      <div
        className={cn(
          "relative max-w-[85%] rounded-2xl px-3.5 py-2 text-sm sm:max-w-[70%]",
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
          message._optimistic && "opacity-70",
          message._failed && "opacity-50",
        )}
      >
        <MessageContent
          content={message.content}
          projectId={projectId}
          isOwnMessage={isOwn}
        />

        <div
          className={cn(
            "mt-1 flex items-center gap-2",
            isOwn ? "justify-end" : "justify-start",
          )}
        >
          <span className="text-[10px] opacity-60">
            {message._failed ? "Couldn't send" : formatTime(message.createdAt)}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-1",
          isOwn ? "flex-row-reverse" : "flex-row",
        )}
      >
        {message._failed && onRetry ? (
          <button
            type="button"
            onClick={() => onRetry(message.id)}
            className="text-xs text-destructive hover:underline"
          >
            Tap to retry
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onReact(message.id)}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all",
              hasReacted
                ? "bg-primary/10 text-primary animate-chat-reaction-pop"
                : "text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100",
            )}
          >
            <span className="text-sm">🤘</span>
            {reactionCount > 0 && (
              <span className="tabular-nums">{reactionCount}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export const MessageBubble = memo(
  MessageBubbleInner,
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.reactions.length === next.message.reactions.length &&
    prev.message._optimistic === next.message._optimistic &&
    prev.message._failed === next.message._failed &&
    prev.showAuthor === next.showAuthor &&
    prev.projectId === next.projectId,
);
