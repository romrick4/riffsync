import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";
import { broadcastNewMessage } from "@/lib/chat-broadcast";

type RouteParams = {
  params: Promise<{ projectId: string }>;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor");
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "", 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const messages = await prisma.chatMessage.findMany({
    where: {
      projectId,
      ...(cursor
        ? {
            createdAt: {
              lt: (
                await prisma.chatMessage.findUnique({
                  where: { id: cursor },
                  select: { createdAt: true },
                })
              )?.createdAt,
            },
          }
        : {}),
    },
    include: {
      user: { select: { id: true, displayName: true } },
      reactions: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json({
    messages: page,
    nextCursor,
    hasMore,
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content } = body;
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json(
      { error: "Message is too long. Keep it under 2000 characters." },
      { status: 400 },
    );
  }

  const message = await prisma.chatMessage.create({
    data: {
      content: content.trim(),
      projectId,
      userId: user.id,
    },
    include: {
      user: { select: { id: true, displayName: true } },
      reactions: { select: { userId: true } },
    },
  });

  broadcastNewMessage(projectId, {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    userId: message.userId,
    projectId: message.projectId,
    user: message.user,
    reactions: message.reactions,
  }).catch(() => {});

  return NextResponse.json(message, { status: 201 });
}
