import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ projectId: string; pollId: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, pollId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const poll = await prisma.poll.findUnique({
    where: { id: pollId, projectId },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      options: {
        include: {
          responses: {
            include: {
              user: {
                select: { id: true, displayName: true, username: true },
              },
            },
          },
        },
      },
    },
  });

  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  return NextResponse.json(poll);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, pollId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const poll = await prisma.poll.findUnique({
    where: { id: pollId, projectId },
  });
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  const isOwner = membership.role === "OWNER";
  const isCreator = poll.createdById === user.id;
  if (!isOwner && !isCreator) {
    return NextResponse.json(
      { error: "Only the poll creator or project owner can modify this poll" },
      { status: 403 },
    );
  }

  const updated = await prisma.poll.update({
    where: { id: pollId },
    data: { isActive: !poll.isActive },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, pollId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const poll = await prisma.poll.findUnique({
    where: { id: pollId, projectId },
  });
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  const isOwner = membership.role === "OWNER";
  const isCreator = poll.createdById === user.id;
  if (!isOwner && !isCreator) {
    return NextResponse.json(
      { error: "Only the poll creator or project owner can delete this poll" },
      { status: 403 },
    );
  }

  await prisma.poll.delete({ where: { id: pollId } });

  return NextResponse.json({ success: true });
}
