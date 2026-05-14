import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ projectId: string }>;
};

const MAX_RESULTS = 10;

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const q = searchParams.get("q")?.trim() ?? "";
  const songId = searchParams.get("songId");

  const filter = q ? { contains: q, mode: "insensitive" as const } : undefined;

  switch (type) {
    case "member": {
      const members = await prisma.projectMember.findMany({
        where: {
          projectId,
          ...(filter ? { user: { displayName: filter } } : {}),
        },
        include: { user: { select: { id: true, displayName: true } } },
        take: MAX_RESULTS,
      });
      return NextResponse.json(
        members.map((m) => ({
          id: m.user.id,
          label: m.user.displayName,
        })),
      );
    }

    case "song": {
      const songs = await prisma.song.findMany({
        where: {
          projectId,
          ...(filter ? { title: filter } : {}),
        },
        select: { id: true, title: true },
        orderBy: { updatedAt: "desc" },
        take: MAX_RESULTS,
      });
      return NextResponse.json(
        songs.map((s) => ({ id: s.id, label: s.title })),
      );
    }

    case "version": {
      if (!songId) {
        return NextResponse.json(
          { error: "songId is required for version search" },
          { status: 400 },
        );
      }
      const versions = await prisma.songVersion.findMany({
        where: {
          songId,
          song: { projectId },
          ...(filter ? { title: filter } : {}),
        },
        select: {
          id: true,
          title: true,
          versionNumber: true,
          song: { select: { id: true, title: true } },
        },
        orderBy: { versionNumber: "desc" },
        take: MAX_RESULTS,
      });
      return NextResponse.json(
        versions.map((v) => ({
          id: v.id,
          label: v.title,
          versionNumber: v.versionNumber,
          songId: v.song.id,
          songTitle: v.song.title,
        })),
      );
    }

    case "poll": {
      const polls = await prisma.poll.findMany({
        where: {
          projectId,
          ...(filter ? { question: filter } : {}),
        },
        select: { id: true, question: true, isActive: true },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        take: MAX_RESULTS,
      });
      return NextResponse.json(
        polls.map((p) => ({ id: p.id, label: p.question })),
      );
    }

    case "event": {
      const events = await prisma.calendarEvent.findMany({
        where: {
          projectId,
          ...(filter ? { title: filter } : {}),
        },
        select: { id: true, title: true, startTime: true },
        orderBy: { startTime: "desc" },
        take: MAX_RESULTS,
      });
      return NextResponse.json(
        events.map((e) => ({ id: e.id, label: e.title })),
      );
    }

    default:
      return NextResponse.json(
        { error: "Invalid type. Use member, song, version, poll, or event." },
        { status: 400 },
      );
  }
}
