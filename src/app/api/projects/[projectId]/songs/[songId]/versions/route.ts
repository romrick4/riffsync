import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership, verifySongInProject } from "@/lib/auth";
import { getStorage, sanitizeFilename } from "@/lib/storage";
import { FileFormat } from "@/generated/prisma/client";
import { notify, getProjectMemberIds } from "@/lib/notifications";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

const EXTENSION_TO_FORMAT: Record<string, FileFormat> = {
  ".wav": FileFormat.WAV,
  ".flac": FileFormat.FLAC,
  ".mp3": FileFormat.MP3,
};

const FORMAT_TO_CONTENT_TYPE: Record<string, string> = {
  WAV: "audio/wav",
  FLAC: "audio/flac",
  MP3: "audio/mpeg",
};

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
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const song = await prisma.song.findUnique({
    where: { id: songId, projectId },
  });
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const title = formData.get("title") as string | null;
  const description = (formData.get("description") as string | null) || null;
  const parentVersionId =
    (formData.get("parentVersionId") as string | null) || null;
  const file = formData.get("file") as File | null;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Audio file is required" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 200MB limit" },
      { status: 400 }
    );
  }

  const fileName = sanitizeFilename(file.name);
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  const fileFormat = EXTENSION_TO_FORMAT[ext];

  if (!fileFormat) {
    return NextResponse.json(
      { error: "Unsupported file format. Accepted: .wav, .flac, .mp3" },
      { status: 400 }
    );
  }

  if (parentVersionId) {
    const parent = await prisma.songVersion.findUnique({
      where: { id: parentVersionId, songId },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Parent version not found" },
        { status: 400 }
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = FORMAT_TO_CONTENT_TYPE[fileFormat] ?? "application/octet-stream";
  const storage = getStorage();
  await storage.save(storageKey, buffer, contentType);

  const version = await prisma.songVersion.create({
    data: {
      id: versionId,
      title: title.trim(),
      description: description?.trim() || null,
      filePath: storageKey,
      fileName,
      fileFormat,
      fileSizeBytes: file.size,
      versionNumber,
      songId,
      uploadedById: user.id,
      parentVersionId,
    },
    include: {
      uploadedBy: {
        select: { id: true, username: true, displayName: true },
      },
    },
  });

  const recipientIds = await getProjectMemberIds(projectId, user.id);
  notify({
    type: "NEW_VERSION",
    message: `${user.displayName} uploaded v${versionNumber} "${title.trim()}" for ${song.title}`,
    linkUrl: `/projects/${projectId}/songs/${songId}`,
    recipientIds,
  }).catch(() => {});

  return NextResponse.json(version, { status: 201 });
}
