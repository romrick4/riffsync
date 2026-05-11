import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership, verifySongInProject } from "@/lib/auth";
import { getStorage, sanitizeFilename } from "@/lib/storage";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type RouteParams = { params: Promise<{ projectId: string; songId: string }> };

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

  const existing = await verifySongInProject(songId, projectId);
  if (!existing) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image format. Accepted: JPG, PNG, WebP" },
      { status: 400 },
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "File size exceeds 20MB limit" }, { status: 400 });
  }

  const storage = getStorage();

  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { coverArtPath: true },
  });
  if (song?.coverArtPath) {
    await storage.delete(song.coverArtPath).catch(() => {});
  }

  const fileName = sanitizeFilename(file.name);
  const storageKey = `projects/${projectId}/songs/${songId}/cover/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await storage.save(storageKey, buffer, file.type);

  const updated = await prisma.song.update({
    where: { id: songId },
    data: { coverArtPath: storageKey },
  });

  return NextResponse.json({ coverArtPath: updated.coverArtPath });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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
    select: { coverArtPath: true },
  });

  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  if (song.coverArtPath) {
    const storage = getStorage();
    await storage.delete(song.coverArtPath).catch(() => {});
  }

  await prisma.song.update({
    where: { id: songId },
    data: { coverArtPath: null },
  });

  return NextResponse.json({ success: true });
}
