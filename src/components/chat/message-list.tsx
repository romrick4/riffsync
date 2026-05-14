"use client";

import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { MessageBubble, type ChatMessageData } from "./message-bubble";

interface MessageListProps {
  messages: ChatMessageData[];
  currentUserId: string;
  onReact: (messageId: string) => void;
  onRetry: (messageId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
}

export interface MessageListHandle {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  isNearBottom: () => boolean;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 86400000;

  if (diff < dayMs && now.getDate() === date.getDate()) return "Today";
  if (diff < 2 * dayMs) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function shouldShowDateSeparator(
  current: ChatMessageData,
  previous: ChatMessageData | undefined,
): boolean {
  if (!previous) return true;
  const a = new Date(previous.createdAt).toDateString();
  const b = new Date(current.createdAt).toDateString();
  return a !== b;
}

function shouldShowAuthor(
  current: ChatMessageData,
  previous: ChatMessageData | undefined,
): boolean {
  if (!previous) return true;
  if (previous.userId !== current.userId) return true;
  const diff =
    new Date(current.createdAt).getTime() -
    new Date(previous.createdAt).getTime();
  return diff > 120000;
}

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(
  function MessageList(
    {
      messages,
      currentUserId,
      onReact,
      onRetry,
      onLoadMore,
      hasMore,
      loadingMore,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const isRestoringScroll = useRef(false);
    const throttleRef = useRef(false);

    const isNearBottom = useCallback(() => {
      const el = containerRef.current;
      if (!el) return true;
      return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }, []);

    const scrollToBottom = useCallback(
      (behavior: ScrollBehavior = "smooth") => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior });
      },
      [],
    );

    useImperativeHandle(ref, () => ({ scrollToBottom, isNearBottom }), [
      scrollToBottom,
      isNearBottom,
    ]);

    useEffect(() => {
      if (isRestoringScroll.current) {
        const el = containerRef.current;
        if (el) {
          const newHeight = el.scrollHeight;
          el.scrollTop = newHeight - prevScrollHeightRef.current;
        }
        isRestoringScroll.current = false;
      }
    });

    const handleScroll = useCallback(() => {
      if (throttleRef.current) return;
      throttleRef.current = true;

      setTimeout(() => {
        throttleRef.current = false;
        const el = containerRef.current;
        if (!el) return;

        if (el.scrollTop < 80 && hasMore && !loadingMore) {
          prevScrollHeightRef.current = el.scrollHeight;
          isRestoringScroll.current = true;
          onLoadMore();
        }
      }, 100);
    }, [hasMore, loadingMore, onLoadMore]);

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-4 py-3"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          </div>
        )}

        {messages.map((msg, i) => {
          const prev = i > 0 ? messages[i - 1] : undefined;
          const showDate = shouldShowDateSeparator(msg, prev);
          const showAuthor = shouldShowAuthor(msg, prev);

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="my-3 flex items-center justify-center">
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    {formatDateSeparator(msg.createdAt)}
                  </span>
                </div>
              )}
              <div className={showAuthor && !showDate ? "mt-3" : "mt-0.5"}>
                <MessageBubble
                  message={msg}
                  isOwn={msg.userId === currentUserId}
                  showAuthor={showAuthor}
                  onReact={onReact}
                  onRetry={onRetry}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
