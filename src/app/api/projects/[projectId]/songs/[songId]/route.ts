import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

type RouteParams = { params: Promise<{ projectId: string; songId: string }> };

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
            select: { id: true, displayName: true },
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
            select: { id: true, displayName: true },
          },
        },
        orderBy: { versionNumber: "desc" },
      },
      tabFiles: {
        include: {
          uploadedBy: {
            select: { id: true, displayName: true },
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.description === "string") data.description = body.description.trim() || null;
  if (typeof body.featuredArtists === "string") data.featuredArtists = body.featuredArtists.trim() || null;
  if (typeof body.songwriters === "string") data.songwriters = body.songwriters.trim() || null;
  if (typeof body.isrc === "string") data.isrc = body.isrc.trim() || null;
  if (typeof body.isExplicit === "boolean") data.isExplicit = body.isExplicit;
  if (typeof body.language === "string") data.language = body.language.trim();
  if (typeof body.trackNumber === "number") data.trackNumber = body.trackNumber;
  if (body.trackNumber === null) data.trackNumber = null;

  if (body.albumId === null) {
    data.albumId = null;
    data.trackNumber = null;
  } else if (typeof body.albumId === "string") {
    const album = await prisma.album.findUnique({
      where: { id: body.albumId, projectId },
      select: { id: true },
    });
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 400 });
    }
    data.albumId = body.albumId;
  }

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

  const [versions, song] = await Promise.all([
    prisma.songVersion.findMany({
      where: { songId },
      select: { filePath: true, compressedFilePath: true },
    }),
    prisma.song.findUnique({
      where: { id: songId, projectId },
      select: { coverArtPath: true },
    }),
  ]);

  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const storage = getStorage();
  const fileDeletes = versions.flatMap((v) => {
    const keys = [v.filePath];
    if (v.compressedFilePath) keys.push(v.compressedFilePath);
    return keys;
  });
  if (song.coverArtPath) fileDeletes.push(song.coverArtPath);

  await Promise.allSettled(fileDeletes.map((key) => storage.delete(key)));

  await prisma.song.delete({ where: { id: songId, projectId } });

  return NextResponse.json({ success: true });
}
