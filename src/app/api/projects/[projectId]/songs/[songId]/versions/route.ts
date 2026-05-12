import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getCurrentUser,
  verifyMembership,
  verifySongInProject,
} from "@/lib/auth";

type RouteParams = {
  params: Promise<{ projectId: string; songId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json(
      { error: "Not a project member" },
      { status: 403 },
    );
  }

  const song = await verifySongInProject(songId, projectId);
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const versions = await prisma.songVersion.findMany({
    where: { songId },
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
    },
    orderBy: { versionNumber: "desc" },
  });

  return NextResponse.json(versions);
}
