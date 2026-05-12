import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership, verifySongInProject } from "@/lib/auth";
import { notify, getProjectMemberIds } from "@/lib/notifications";

type RouteParams = {
  params: Promise<{
    projectId: string;
    songId: string;
    versionId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId, versionId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const song = await verifySongInProject(songId, projectId);
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const comments = await prisma.audioComment.findMany({
    where: {
      songVersionId: versionId,
      songVersion: { songId },
    },
    include: {
      user: {
        select: { id: true, displayName: true },
      },
    },
    orderBy: { timestampSec: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId, versionId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const song = await verifySongInProject(songId, projectId);
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  let body: { content?: string; timestampSec?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, timestampSec } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }
  if (timestampSec === undefined || typeof timestampSec !== "number" || timestampSec < 0) {
    return NextResponse.json(
      { error: "Valid timestampSec is required" },
      { status: 400 }
    );
  }

  const version = await prisma.songVersion.findUnique({
    where: { id: versionId, songId },
    select: { id: true, title: true, uploadedById: true },
  });

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const comment = await prisma.audioComment.create({
    data: {
      content: content.trim(),
      timestampSec,
      songVersionId: versionId,
      userId: user.id,
    },
    include: {
      user: {
        select: { id: true, displayName: true },
      },
    },
  });

  const recipientIds = await getProjectMemberIds(projectId, user.id);
  notify({
    type: "AUDIO_COMMENT",
    message: `${user.displayName} commented on "${version.title}"`,
    linkUrl: `/projects/${projectId}/music/songs/${songId}`,
    recipientIds,
  }).catch(() => {});

  return NextResponse.json(comment, { status: 201 });
}
