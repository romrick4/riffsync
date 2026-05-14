import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";

type RouteParams = {
  params: Promise<{ token: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteParams,
) {
  const { token } = await params;

  const link = await prisma.demoLink.findUnique({
    where: { token },
    include: {
      songVersion: {
        select: {
          id: true,
          title: true,
          versionNumber: true,
          fileFormat: true,
          compressedFilePath: true,
          filePath: true,
          waveformPeaks: true,
          durationSec: true,
        },
      },
      song: {
        select: { id: true, title: true },
      },
      project: {
        select: { id: true, name: true },
      },
    },
  });

  if (!link) {
    return NextResponse.json(
      { error: "not_found", message: "We couldn't find that link." },
      { status: 404 },
    );
  }

  if (link.isRevoked) {
    return NextResponse.json(
      { error: "revoked", message: "This link is no longer active." },
      { status: 410 },
    );
  }

  if (link.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "expired", message: "This link has expired." },
      { status: 410 },
    );
  }

  const storage = getStorage();
  const audioKey = link.songVersion.compressedFilePath ?? link.songVersion.filePath;
  const audioUrl = await storage.getUrl(audioKey);

  return NextResponse.json({
    songTitle: link.song.title,
    versionTitle: link.songVersion.title,
    versionNumber: link.songVersion.versionNumber,
    bandName: link.project.name,
    fileFormat: link.songVersion.fileFormat,
    audioUrl,
    waveformPeaks: link.songVersion.waveformPeaks,
    durationSec: link.songVersion.durationSec,
    expiresAt: link.expiresAt.toISOString(),
  });
}
