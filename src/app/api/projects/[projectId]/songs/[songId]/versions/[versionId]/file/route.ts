import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifySongInProject } from "@/lib/auth";
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

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
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

  const version = await prisma.songVersion.findUnique({
    where: { id: versionId, songId },
    select: {
      filePath: true,
      compressedFilePath: true,
      uploadStatus: true,
    },
  });

  if (!version) {
    return NextResponse.json(
      { error: "Version not found" },
      { status: 404 },
    );
  }

  const storage = getStorage();
  const key = version.compressedFilePath ?? version.filePath;
  const url = await storage.getUrl(key);

  return NextResponse.redirect(url, 307);
}
