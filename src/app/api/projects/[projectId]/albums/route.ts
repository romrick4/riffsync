import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";
import { notify, getProjectMemberIds } from "@/lib/notifications";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const albums = await prisma.album.findMany({
    where: { projectId },
    include: {
      songs: {
        select: {
          id: true,
          title: true,
          trackNumber: true,
          coverArtPath: true,
          versions: {
            where: { isFinal: true },
            select: { id: true },
            take: 1,
          },
        },
        orderBy: { trackNumber: "asc" },
      },
      _count: { select: { songs: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = albums.map((album) => ({
    ...album,
    songCount: album._count.songs,
    allSongsHaveFinal: album.songs.every((s) => s.versions.length > 0),
    songs: album.songs.map((s) => ({
      ...s,
      hasFinalVersion: s.versions.length > 0,
      versions: undefined,
    })),
    _count: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  let body: {
    title?: string;
    description?: string;
    genre?: string;
    secondaryGenre?: string;
    artistName?: string;
    releaseDate?: string;
    language?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, genre, secondaryGenre, artistName, releaseDate, language } = body;
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const album = await prisma.album.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      genre: genre?.trim() || null,
      secondaryGenre: secondaryGenre?.trim() || null,
      artistName: artistName?.trim() || null,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      language: language?.trim() || "en",
      projectId,
    },
  });

  const recipientIds = await getProjectMemberIds(projectId, user.id);
  notify({
    type: "NEW_ALBUM",
    message: `${user.displayName} created album "${album.title}"`,
    linkUrl: `/projects/${projectId}/music/albums/${album.id}`,
    recipientIds,
  }).catch(() => {});

  return NextResponse.json(album, { status: 201 });
}
