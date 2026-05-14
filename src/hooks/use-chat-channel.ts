"use client";

import { useEffect, useRef, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { chatChannelName } from "@/lib/chat";
import type { BroadcastMessage, BroadcastReactionUpdate } from "@/lib/chat";

interface UseChatChannelOptions {
  projectId: string;
  onNewMessage: (message: BroadcastMessage) => void;
  onReactionUpdate: (update: BroadcastReactionUpdate) => void;
}

export function useChatChannel({
  projectId,
  onNewMessage,
  onReactionUpdate,
}: UseChatChannelOptions) {
  const onNewMessageRef = useRef(onNewMessage);
  const onReactionUpdateRef = useRef(onReactionUpdate);

  onNewMessageRef.current = onNewMessage;
  onReactionUpdateRef.current = onReactionUpdate;

  const subscribe = useCallback(() => {
    const supabase = createSupabaseBrowserClient();
    const channelName = chatChannelName(projectId);

    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "new_message" }, (payload) => {
        onNewMessageRef.current(payload.payload as BroadcastMessage);
      })
      .on("broadcast", { event: "reaction_update" }, (payload) => {
        onReactionUpdateRef.current(
          payload.payload as BroadcastReactionUpdate,
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  }, [subscribe]);
}
