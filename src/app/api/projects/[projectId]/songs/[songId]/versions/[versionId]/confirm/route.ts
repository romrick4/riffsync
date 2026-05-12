import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { notify, getProjectMemberIds } from "@/lib/notifications";

type RouteParams = {
  params: Promise<{ projectId: string; songId: string; versionId: string }>;
};

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId, versionId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json(
      { error: "Not a project member" },
      { status: 403 },
    );
  }

  const version = await prisma.songVersion.findUnique({
    where: { id: versionId, songId },
    include: { song: { select: { title: true, projectId: true } } },
  });

  if (!version) {
    return NextResponse.json(
      { error: "Version not found" },
      { status: 404 },
    );
  }

  if (version.uploadStatus !== "AWAITING_UPLOAD") {
    return NextResponse.json(
      { error: "This upload has already been confirmed" },
      { status: 409 },
    );
  }

  if (version.song.projectId !== projectId) {
    return NextResponse.json(
      { error: "Version not found" },
      { status: 404 },
    );
  }

  const storage = getStorage();
  const fileExists = await storage.exists(version.filePath);
  if (!fileExists) {
    return NextResponse.json(
      { error: "The file hasn\u2019t finished uploading yet. Try again." },
      { status: 400 },
    );
  }

  const updated = await prisma.songVersion.update({
    where: { id: versionId },
    data: { uploadStatus: "PROCESSING" },
    include: {
      uploadedBy: {
        select: { id: true, username: true, displayName: true },
      },
    },
  });

  await prisma.transcodeJob.create({
    data: { versionId },
  });

  if (process.env.FLY_WORKER_URL) {
    fetch(process.env.FLY_WORKER_URL, { method: "GET" }).catch(() => {});
  }

  const recipientIds = await getProjectMemberIds(projectId, user.id);
  notify({
    type: "NEW_VERSION",
    message: `${user.displayName} uploaded v${version.versionNumber} "${version.title}" for ${version.song.title}`,
    linkUrl: `/projects/${projectId}/music/songs/${songId}`,
    recipientIds,
  }).catch(() => {});

  return NextResponse.json(updated);
}
