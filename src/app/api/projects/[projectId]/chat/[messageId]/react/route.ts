import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";
import { broadcastReactionUpdate } from "@/lib/chat";

type RouteParams = {
  params: Promise<{ projectId: string; messageId: string }>;
};

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, messageId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId, projectId },
    select: { id: true },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const existing = await prisma.chatReaction.findUnique({
    where: { messageId_userId: { messageId, userId: user.id } },
  });

  if (existing) {
    await prisma.chatReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.chatReaction.create({
      data: { messageId, userId: user.id },
    });
  }

  const reactions = await prisma.chatReaction.findMany({
    where: { messageId },
    select: { userId: true },
  });

  broadcastReactionUpdate(projectId, {
    messageId,
    reactions,
  }).catch(() => {});

  return NextResponse.json({
    reacted: !existing,
    reactionCount: reactions.length,
    reactions,
  });
}
