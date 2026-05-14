import { redirect, notFound } from "next/navigation";
import { getCurrentUser, verifyMembership } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChatRoom } from "@/components/chat/chat-room";

const PAGE_SIZE = 50;

export default async function ChatPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { projectId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) notFound();

  const messages = await prisma.chatMessage.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, displayName: true } },
      reactions: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
  });

  const hasMore = messages.length > PAGE_SIZE;
  const page = hasMore ? messages.slice(0, PAGE_SIZE) : messages;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  const serialized = page.reverse().map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    userId: m.userId,
    user: m.user,
    reactions: m.reactions,
  }));

  return (
    <ChatRoom
      projectId={projectId}
      currentUserId={user.id}
      initialMessages={serialized}
      initialNextCursor={nextCursor}
      initialHasMore={hasMore}
    />
  );
}
