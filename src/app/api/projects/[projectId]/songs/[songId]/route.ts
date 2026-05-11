import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

type RouteParams = { params: Promise<{ projectId: string; songId: string }> };

async function verifyMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

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

  const song = await prisma.song.findUnique({
    where: { id: songId, projectId },
    include: {
      versions: {
        include: {
          uploadedBy: {
            select: { id: true, username: true, displayName: true },
          },
          parentVersion: {
            select: { id: true, title: true, versionNumber: true },
          },
        },
        orderBy: { versionNumber: "desc" },
      },
      lyricVersions: {
        include: {
          editedBy: {
            select: { id: true, username: true, displayName: true },
          },
        },
        orderBy: { versionNumber: "desc" },
      },
      tabFiles: {
        include: {
          uploadedBy: {
            select: { id: true, username: true, displayName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  return NextResponse.json(song);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  let body: { title?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, string | null> = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.description !== undefined)
    data.description = body.description?.trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const song = await prisma.song.update({
    where: { id: songId, projectId },
    data,
  });

  return NextResponse.json(song);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only project owners can delete songs" },
      { status: 403 }
    );
  }

  const versions = await prisma.songVersion.findMany({
    where: { songId },
    select: { filePath: true },
  });

  const storage = getStorage();
  await Promise.allSettled(
    versions.map((v) => storage.delete(v.filePath))
  );

  await prisma.song.delete({ where: { id: songId, projectId } });

  return NextResponse.json({ success: true });
}
