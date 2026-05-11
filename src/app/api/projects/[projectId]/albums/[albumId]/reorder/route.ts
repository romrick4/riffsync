import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership, verifyAlbumInProject } from "@/lib/auth";

type RouteParams = { params: Promise<{ projectId: string; albumId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, albumId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const album = await verifyAlbumInProject(albumId, projectId);
  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  let body: { songIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { songIds } = body;
  if (!Array.isArray(songIds) || songIds.length === 0) {
    return NextResponse.json(
      { error: "songIds array is required" },
      { status: 400 },
    );
  }

  // Verify all songs belong to this album
  const songs = await prisma.song.findMany({
    where: { albumId, projectId },
    select: { id: true },
  });
  const albumSongIds = new Set(songs.map((s) => s.id));

  for (const id of songIds) {
    if (!albumSongIds.has(id)) {
      return NextResponse.json(
        { error: `Song ${id} is not in this album` },
        { status: 400 },
      );
    }
  }

  // Update track numbers in a transaction
  await prisma.$transaction(
    songIds.map((id, index) =>
      prisma.song.update({
        where: { id },
        data: { trackNumber: index + 1 },
      }),
    ),
  );

  return NextResponse.json({ success: true });
}
