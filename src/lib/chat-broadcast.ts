import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { chatChannelName } from "@/lib/chat";
import type { BroadcastMessage, BroadcastReactionUpdate } from "@/lib/chat";

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
