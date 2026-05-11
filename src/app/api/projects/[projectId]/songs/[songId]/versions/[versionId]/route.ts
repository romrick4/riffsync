import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership, verifySongInProject } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

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

  const version = await prisma.songVersion.findUnique({
    where: { id: versionId, songId },
    include: {
      uploadedBy: {
        select: { id: true, username: true, displayName: true },
      },
      parentVersion: {
        select: { id: true, title: true, versionNumber: true },
      },
      childVersions: {
        select: { id: true, title: true, versionNumber: true },
      },
      audioComments: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true },
          },
        },
        orderBy: { timestampSec: "asc" },
      },
    },
  });

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json(version);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  let body: { title?: string; description?: string; isFinal?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.description !== undefined)
    data.description = body.description?.trim() || null;

  if (body.isFinal === true) {
    await prisma.songVersion.updateMany({
      where: { songId, isFinal: true },
      data: { isFinal: false },
    });
    data.isFinal = true;
  } else if (body.isFinal === false) {
    data.isFinal = false;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const version = await prisma.songVersion.update({
    where: { id: versionId, songId },
    data,
  });

  return NextResponse.json(version);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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

  const version = await prisma.songVersion.findUnique({
    where: { id: versionId, songId },
    select: { filePath: true },
  });

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const storage = getStorage();
  try {
    await storage.delete(version.filePath);
  } catch {
    // File may already be gone; continue with DB deletion
  }

  await prisma.songVersion.delete({ where: { id: versionId } });

  return NextResponse.json({ success: true });
}
