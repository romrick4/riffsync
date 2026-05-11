import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership, verifyAlbumInProject } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

type RouteParams = { params: Promise<{ projectId: string; albumId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, albumId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const album = await prisma.album.findUnique({
    where: { id: albumId, projectId },
    include: {
      songs: {
        include: {
          versions: {
            where: { isFinal: true },
            select: {
              id: true,
              title: true,
              fileFormat: true,
              fileSizeBytes: true,
            },
            take: 1,
          },
          _count: { select: { versions: true } },
        },
        orderBy: { trackNumber: "asc" },
      },
    },
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  return NextResponse.json(album);
}

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

  const existing = await verifyAlbumInProject(albumId, projectId);
  if (!existing) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
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
  if (typeof body.genre === "string") data.genre = body.genre.trim() || null;
  if (typeof body.secondaryGenre === "string") data.secondaryGenre = body.secondaryGenre.trim() || null;
  if (typeof body.artistName === "string") data.artistName = body.artistName.trim() || null;
  if (typeof body.upc === "string") data.upc = body.upc.trim() || null;
  if (typeof body.isExplicit === "boolean") data.isExplicit = body.isExplicit;
  if (typeof body.language === "string") data.language = body.language.trim();
  if (body.releaseDate === null) {
    data.releaseDate = null;
  } else if (typeof body.releaseDate === "string") {
    data.releaseDate = new Date(body.releaseDate);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const album = await prisma.album.update({
    where: { id: albumId, projectId },
    data,
  });

  return NextResponse.json(album);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, albumId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only project owners can delete albums" },
      { status: 403 },
    );
  }

  const album = await prisma.album.findUnique({
    where: { id: albumId, projectId },
    select: { coverArtPath: true },
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  // Detach songs (don't delete them)
  await prisma.song.updateMany({
    where: { albumId },
    data: { albumId: null, trackNumber: null },
  });

  if (album.coverArtPath) {
    const storage = getStorage();
    await storage.delete(album.coverArtPath).catch(() => {});
  }

  await prisma.album.delete({ where: { id: albumId } });

  return NextResponse.json({ success: true });
}
