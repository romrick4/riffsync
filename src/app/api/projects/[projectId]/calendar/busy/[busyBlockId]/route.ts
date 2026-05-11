import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ projectId: string; busyBlockId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, busyBlockId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const block = await prisma.busyBlock.findUnique({
    where: { id: busyBlockId, projectId },
  });
  if (!block) {
    return NextResponse.json(
      { error: "Busy block not found" },
      { status: 404 },
    );
  }

  if (block.userId !== user.id) {
    return NextResponse.json(
      { error: "You can only edit your own busy times" },
      { status: 403 },
    );
  }

  let body: { startTime?: string; endTime?: string; note?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const start = body.startTime ? new Date(body.startTime) : block.startTime;
  const end = body.endTime ? new Date(body.endTime) : block.endTime;

  if (end <= start) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 },
    );
  }

  const updated = await prisma.busyBlock.update({
    where: { id: busyBlockId },
    data: {
      ...(body.startTime !== undefined && { startTime: start }),
      ...(body.endTime !== undefined && { endTime: end }),
      ...(body.note !== undefined && { note: body.note }),
    },
    include: {
      user: { select: { id: true, displayName: true, username: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, busyBlockId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const block = await prisma.busyBlock.findUnique({
    where: { id: busyBlockId, projectId },
  });
  if (!block) {
    return NextResponse.json(
      { error: "Busy block not found" },
      { status: 404 },
    );
  }

  if (block.userId !== user.id) {
    return NextResponse.json(
      { error: "You can only remove your own busy times" },
      { status: 403 },
    );
  }

  await prisma.busyBlock.delete({ where: { id: busyBlockId } });

  return NextResponse.json({ success: true });
}
