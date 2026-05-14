import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type RouteParams = { params: Promise<{ projectId: string }> };

interface TrackInput {
  songId: string;
  versionId?: string | null;
  position: number;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.userId } },
  });
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only the band owner can manage the band page" },
      { status: 403 },
    );
  }

  try {
    const { tracks } = (await request.json()) as { tracks: TrackInput[] };

    if (!Array.isArray(tracks) || tracks.length > 20) {
      return NextResponse.json(
        { error: "You can feature up to 20 songs." },
        { status: 400 },
      );
    }

    const songIds = tracks.map((t) => t.songId);
    const projectSongs = await prisma.song.findMany({
      where: { id: { in: songIds }, projectId },
      select: { id: true },
    });
    const validSongIds = new Set(projectSongs.map((s) => s.id));

    const validTracks = tracks.filter((t) => validSongIds.has(t.songId));

    let bandPage = await prisma.bandPage.findUnique({
      where: { projectId },
      select: { id: true },
    });

    if (!bandPage) {
      bandPage = await prisma.bandPage.create({
        data: { projectId },
        select: { id: true },
      });
    }

    await prisma.$transaction([
      prisma.bandPageTrack.deleteMany({
        where: { bandPageId: bandPage.id },
      }),
      ...validTracks.map((track, index) =>
        prisma.bandPageTrack.create({
          data: {
            bandPageId: bandPage.id,
            songId: track.songId,
            versionId: track.versionId || null,
            position: index,
          },
        }),
      ),
    ]);

    const updatedTracks = await prisma.bandPageTrack.findMany({
      where: { bandPageId: bandPage.id },
      orderBy: { position: "asc" },
      include: {
        song: { select: { id: true, title: true } },
        version: { select: { id: true, title: true, versionNumber: true } },
      },
    });

    return NextResponse.json({ tracks: updatedTracks });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Try again in a moment." },
      { status: 500 },
    );
  }
}
