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
