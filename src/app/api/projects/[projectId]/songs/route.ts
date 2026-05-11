import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const songs = await prisma.song.findMany({
    where: { projectId },
    include: {
      versions: {
        select: {
          id: true,
          title: true,
          versionNumber: true,
          isFinal: true,
          createdAt: true,
          fileFormat: true,
        },
        orderBy: { versionNumber: "desc" },
      },
      _count: { select: { versions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = songs.map((song) => ({
    ...song,
    versionCount: song._count.versions,
    latestVersion: song.versions[0] ?? null,
    hasFinalVersion: song.versions.some((v) => v.isFinal),
    versions: undefined,
    _count: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

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

  const { title, description } = body;
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const song = await prisma.song.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      projectId,
    },
  });

  return NextResponse.json(song, { status: 201 });
}
