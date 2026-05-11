import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

const FORMAT_TO_CONTENT_TYPE: Record<string, string> = {
  WAV: "audio/wav",
  FLAC: "audio/flac",
  MP3: "audio/mpeg",
};

type RouteParams = {
  params: Promise<{
    projectId: string;
    songId: string;
    versionId: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId, versionId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const version = await prisma.songVersion.findUnique({
    where: { id: versionId, songId },
    select: { filePath: true, fileFormat: true, fileSizeBytes: true, fileName: true },
  });

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const storage = getStorage();
  const fileBuffer = await storage.get(version.filePath);
  const contentType = FORMAT_TO_CONTENT_TYPE[version.fileFormat] ?? "application/octet-stream";
  const totalSize = fileBuffer.length;

  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${totalSize}`,
          },
        });
      }

      const chunk = new Uint8Array(fileBuffer.subarray(start, end + 1));

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Content-Length": String(chunk.length),
          "Accept-Ranges": "bytes",
        },
      });
    }
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(totalSize),
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="${version.fileName}"`,
    },
  });
}
