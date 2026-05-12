import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";
import { getStorage, sanitizeFilename } from "@/lib/storage";
import { FileFormat } from "@/generated/prisma/client";

const MAX_FILE_SIZE = 200 * 1024 * 1024;

const EXTENSION_TO_FORMAT: Record<string, FileFormat> = {
  ".wav": FileFormat.WAV,
  ".flac": FileFormat.FLAC,
  ".mp3": FileFormat.MP3,
  ".aiff": FileFormat.AIFF,
  ".aif": FileFormat.AIFF,
  ".m4a": FileFormat.M4A,
};

const FORMAT_TO_CONTENT_TYPE: Record<string, string> = {
  WAV: "audio/wav",
  FLAC: "audio/flac",
  MP3: "audio/mpeg",
  AIFF: "audio/aiff",
  M4A: "audio/mp4",
};

type RouteParams = {
  params: Promise<{ projectId: string; songId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
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

  const song = await prisma.song.findUnique({
    where: { id: songId, projectId },
  });
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  let body: {
    title?: string;
    description?: string;
    parentVersionId?: string;
    fileName?: string;
    fileSize?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { title, description, parentVersionId, fileName: rawFileName, fileSize } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!rawFileName || !fileSize) {
    return NextResponse.json(
      { error: "File name and size are required" },
      { status: 400 },
    );
  }

  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "That file is too large. The limit is 200 MB." },
      { status: 400 },
    );
  }

  const fileName = sanitizeFilename(rawFileName);
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  const fileFormat = EXTENSION_TO_FORMAT[ext];

  if (!fileFormat) {
    return NextResponse.json(
      {
        error:
          "Unsupported file format. Accepted: .wav, .flac, .mp3, .aiff, .m4a",
      },
      { status: 400 },
    );
  }

  if (parentVersionId) {
    const parent = await prisma.songVersion.findUnique({
      where: { id: parentVersionId, songId },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Parent version not found" },
        { status: 400 },
      );
    }
  }

  const maxVersion = await prisma.songVersion.aggregate({
    where: { songId },
    _max: { versionNumber: true },
  });
  const versionNumber = (maxVersion._max.versionNumber ?? 0) + 1;

  const versionId = crypto.randomUUID();
  const storageKey = `projects/${projectId}/songs/${songId}/versions/${versionId}/${fileName}`;
  const contentType =
    FORMAT_TO_CONTENT_TYPE[fileFormat] ?? "application/octet-stream";

  const version = await prisma.songVersion.create({
    data: {
      id: versionId,
      title: title.trim(),
      description: description?.trim() || null,
      filePath: storageKey,
      fileName,
      fileFormat,
      fileSizeBytes: fileSize,
      uploadStatus: "AWAITING_UPLOAD",
      versionNumber,
      songId,
      uploadedById: user.id,
      parentVersionId: parentVersionId || null,
    },
  });

  const storage = getStorage();
  const uploadUrl = await storage.getUploadUrl(storageKey, contentType);

  return NextResponse.json(
    { versionId: version.id, uploadUrl, versionNumber },
    { status: 201 },
  );
}
