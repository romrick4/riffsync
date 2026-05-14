import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ projectId: string; setlistId: string; itemId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, setlistId, itemId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const item = await prisma.setlistItem.findUnique({
    where: { id: itemId },
    include: { setlist: { select: { projectId: true } } },
  });

  if (!item || item.setlist.projectId !== projectId || item.setlistId !== setlistId) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  let body: { lockedVersionId?: string | null; notes?: string | null } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Could not read request." },
      { status: 400 },
    );
  }

  const data: { lockedVersionId?: string | null; notes?: string | null } = {};

  if (body.lockedVersionId !== undefined) {
    if (body.lockedVersionId === null || body.lockedVersionId === "") {
      data.lockedVersionId = null;
    } else if (typeof body.lockedVersionId === "string") {
      const version = await prisma.songVersion.findUnique({
        where: { id: body.lockedVersionId, songId: item.songId },
        select: { id: true },
      });
      if (!version) {
        return NextResponse.json(
          { error: "That recording doesn't exist for this song." },
          { status: 400 },
        );
      }
      data.lockedVersionId = body.lockedVersionId;
    }
  }

  if (body.notes !== undefined) {
    data.notes =
      typeof body.notes === "string" ? body.notes.trim() || null : null;
  }

  const updated = await prisma.setlistItem.update({
    where: { id: itemId },
    data,
    include: {
      song: { select: { id: true, title: true } },
      lockedVersion: {
        select: { id: true, title: true, versionNumber: true },
      },
    },
  });

  await prisma.setlist.update({
    where: { id: setlistId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, setlistId, itemId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const item = await prisma.setlistItem.findUnique({
    where: { id: itemId },
    include: { setlist: { select: { projectId: true } } },
  });

  if (!item || item.setlist.projectId !== projectId || item.setlistId !== setlistId) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.setlistItem.delete({ where: { id: itemId } });

    const remaining = await tx.setlistItem.findMany({
      where: { setlistId },
      orderBy: { position: "asc" },
      select: { id: true },
    });

    await Promise.all(
      remaining.map((r, i) =>
        tx.setlistItem.update({
          where: { id: r.id },
          data: { position: i },
        }),
      ),
    );

    await tx.setlist.update({
      where: { id: setlistId },
      data: { updatedAt: new Date() },
    });
  });

  return NextResponse.json({ success: true });
}
