import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getCurrentUser,
  verifyMembership,
  verifySongInProject,
} from "@/lib/auth";

type RouteParams = {
  params: Promise<{ projectId: string; setlistId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, setlistId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const setlist = await prisma.setlist.findUnique({
    where: { id: setlistId, projectId },
    select: { id: true },
  });

  if (!setlist) {
    return NextResponse.json(
      { error: "Setlist not found" },
      { status: 404 },
    );
  }

  let body: { songId?: string; lockedVersionId?: string; notes?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Could not read request." },
      { status: 400 },
    );
  }

  if (!body.songId || typeof body.songId !== "string") {
    return NextResponse.json(
      { error: "Pick a song to add." },
      { status: 400 },
    );
  }

  const song = await verifySongInProject(body.songId, projectId);
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  if (body.lockedVersionId && typeof body.lockedVersionId === "string") {
    const version = await prisma.songVersion.findUnique({
      where: { id: body.lockedVersionId, songId: body.songId },
      select: { id: true },
    });
    if (!version) {
      return NextResponse.json(
        { error: "That recording doesn't exist for this song." },
        { status: 400 },
      );
    }
  }

  const maxPosition = await prisma.setlistItem.aggregate({
    where: { setlistId },
    _max: { position: true },
  });
  const nextPosition = (maxPosition._max.position ?? -1) + 1;

  const item = await prisma.setlistItem.create({
    data: {
      setlistId,
      songId: body.songId,
      position: nextPosition,
      lockedVersionId: body.lockedVersionId || null,
      notes:
        body.notes && typeof body.notes === "string"
          ? body.notes.trim() || null
          : null,
    },
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

  return NextResponse.json(item, { status: 201 });
}
