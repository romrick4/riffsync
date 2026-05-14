import { createSupabaseAdminClient } from "@/lib/supabase/server";

const CHANNEL_PREFIX = "chat:";

export function chatChannelName(projectId: string) {
  return `${CHANNEL_PREFIX}${projectId}`;
}

export interface BroadcastMessage {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  projectId: string;
  user: { id: string; displayName: string };
  reactions: { userId: string }[];
}

export interface BroadcastReactionUpdate {
  messageId: string;
  reactions: { userId: string }[];
}

export async function broadcastNewMessage(
  projectId: string,
  message: BroadcastMessage,
) {
  const supabase = await createSupabaseAdminClient();
  const channel = supabase.channel(chatChannelName(projectId));

  await channel.send({
    type: "broadcast",
    event: "new_message",
    payload: message,
  });

  await supabase.removeChannel(channel);
}

export async function broadcastReactionUpdate(
  projectId: string,
  update: BroadcastReactionUpdate,
) {
  const supabase = await createSupabaseAdminClient();
  const channel = supabase.channel(chatChannelName(projectId));

  await channel.send({
    type: "broadcast",
    event: "reaction_update",
    payload: update,
  });

  await supabase.removeChannel(channel);
}
