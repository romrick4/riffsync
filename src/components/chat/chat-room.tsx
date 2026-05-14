"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useChatChannel } from "@/hooks/use-chat-channel";
import { ChatInput } from "./chat-input";
import { MessageList, type MessageListHandle } from "./message-list";
import type { ChatMessageData } from "./message-bubble";
import type { BroadcastMessage, BroadcastReactionUpdate } from "@/lib/chat";
import { cn } from "@/lib/utils";

interface ChatRoomProps {
  projectId: string;
  currentUserId: string;
  initialMessages: ChatMessageData[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
}

const MAX_MESSAGES_IN_STATE = 200;

export function ChatRoom({
  projectId,
  currentUserId,
  initialMessages,
  initialNextCursor,
  initialHasMore,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNewPill, setShowNewPill] = useState(false);
  const listRef = useRef<MessageListHandle>(null);
  const optimisticIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    listRef.current?.scrollToBottom("instant");
  }, []);

  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  const handleNewMessage = useCallback(
    (incoming: BroadcastMessage) => {
      if (incoming.userId === currentUserId) {
        setMessages((prev) => {
          const match = prev.find(
            (m) =>
              m._optimistic &&
              m.userId === incoming.userId &&
              m.content === incoming.content,
          );
          if (match) {
            optimisticIdsRef.current.delete(match.id);
            return prev.map((m) =>
              m.id === match.id
                ? { ...incoming, _optimistic: false, _failed: false }
                : m,
            );
          }
          return prev;
        });
        return;
      }

      const newMsg: ChatMessageData = {
        id: incoming.id,
        content: incoming.content,
        createdAt: incoming.createdAt,
        userId: incoming.userId,
        user: incoming.user,
        reactions: incoming.reactions,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const updated = [...prev, newMsg];
        if (updated.length > MAX_MESSAGES_IN_STATE) {
          return updated.slice(updated.length - MAX_MESSAGES_IN_STATE);
        }
        return updated;
      });

      if (listRef.current?.isNearBottom()) {
        requestAnimationFrame(() => {
          listRef.current?.scrollToBottom("smooth");
        });
      } else {
        setShowNewPill(true);
      }
    },
    [currentUserId],
  );

  const handleReactionUpdate = useCallback(
    (update: BroadcastReactionUpdate) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === update.messageId ? { ...m, reactions: update.reactions } : m,
        ),
      );
    },
    [],
  );

  useChatChannel({
    projectId,
    onNewMessage: handleNewMessage,
    onReactionUpdate: handleReactionUpdate,
  });

  const handleSend = useCallback(
    (content: string) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      optimisticIdsRef.current.add(tempId);

      const optimisticMsg: ChatMessageData = {
        id: tempId,
        content,
        createdAt: new Date().toISOString(),
        userId: currentUserId,
        user: { id: currentUserId, displayName: "" },
        reactions: [],
        _optimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      requestAnimationFrame(() => {
        listRef.current?.scrollToBottom("smooth");
      });

      fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Send failed");
          const saved = await res.json();
          optimisticIdsRef.current.delete(tempId);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? { ...saved, _optimistic: false, _failed: false }
                : m,
            ),
          );
        })
        .catch(() => {
          optimisticIdsRef.current.delete(tempId);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...m, _optimistic: false, _failed: true } : m,
            ),
          );
        });
    },
    [projectId, currentUserId],
  );

  const handleRetry = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      handleSend(msg.content);
    },
    [messages, handleSend],
  );

  const handleReact = useCallback(
    (messageId: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const hasReacted = m.reactions.some(
            (r) => r.userId === currentUserId,
          );
          return {
            ...m,
            reactions: hasReacted
              ? m.reactions.filter((r) => r.userId !== currentUserId)
              : [...m.reactions, { userId: currentUserId }],
          };
        }),
      );

      fetch(`/api/projects/${projectId}/chat/${messageId}/react`, {
        method: "POST",
      }).catch(() => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const hasReacted = m.reactions.some(
              (r) => r.userId === currentUserId,
            );
            return {
              ...m,
              reactions: hasReacted
                ? m.reactions.filter((r) => r.userId !== currentUserId)
                : [...m.reactions, { userId: currentUserId }],
            };
          }),
        );
      });
    },
    [projectId, currentUserId],
  );

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return;
    setLoadingMore(true);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/chat?cursor=${nextCursor}&limit=50`,
      );
      if (!res.ok) return;
      const data = await res.json();

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = (data.messages as ChatMessageData[]).filter(
          (m) => !existingIds.has(m.id),
        );
        return [...newMsgs.reverse(), ...prev];
      });
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [projectId, hasMore, loadingMore, nextCursor]);

  const handleNewPillClick = useCallback(() => {
    setShowNewPill(false);
    listRef.current?.scrollToBottom("smooth");
  }, []);

  return (
    <div className="relative flex h-[calc(100dvh-12rem)] flex-col overflow-hidden rounded-xl border bg-card">
      {messages.length === 0 && !loadingMore ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-sm text-muted-foreground">
            No messages yet. Say something to your band.
          </p>
        </div>
      ) : (
        <MessageList
          ref={listRef}
          messages={messages}
          currentUserId={currentUserId}
          onReact={handleReact}
          onRetry={handleRetry}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />
      )}

      {showNewPill && (
        <button
          type="button"
          onClick={handleNewPillClick}
          className={cn(
            "absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-lg transition-transform",
            "animate-chat-message-in",
          )}
        >
          New messages ↓
        </button>
      )}

      <ChatInput onSend={handleSend} />
    </div>
  );
}
