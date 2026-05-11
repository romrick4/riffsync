import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership, verifySongInProject } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ projectId: string; songId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const song = await verifySongInProject(songId, projectId);
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const lyrics = await prisma.lyricVersion.findMany({
    where: { songId },
    include: {
      editedBy: {
        select: { id: true, username: true, displayName: true },
      },
    },
    orderBy: { versionNumber: "desc" },
  });

  return NextResponse.json(lyrics);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const song = await prisma.song.findUnique({
    where: { id: songId, projectId },
    select: { id: true, title: true },
  });
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  let body: { content?: string; changeNote?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, changeNote } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const maxVersion = await prisma.lyricVersion.aggregate({
    where: { songId },
    _max: { versionNumber: true },
  });
  const versionNumber = (maxVersion._max.versionNumber ?? 0) + 1;

  const lyricVersion = await prisma.lyricVersion.create({
    data: {
      content: content.trim(),
      changeNote: changeNote?.trim() || null,
      versionNumber,
      songId,
      editedById: user.id,
    },
    include: {
      editedBy: {
        select: { id: true, username: true, displayName: true },
      },
    },
  });

  const members = await prisma.projectMember.findMany({
    where: { projectId, userId: { not: user.id } },
    select: { userId: true },
  });

  if (members.length > 0) {
    await prisma.notification.createMany({
      data: members.map((m) => ({
        type: "LYRICS_EDITED" as const,
        message: `${user.displayName} updated lyrics for ${song.title}`,
        linkUrl: `/projects/${projectId}/songs/${songId}`,
        userId: m.userId,
      })),
    });
  }

  return NextResponse.json(lyricVersion, { status: 201 });
}
