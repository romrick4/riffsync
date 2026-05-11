import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership, verifyAlbumInProject } from "@/lib/auth";
import { getStorage, sanitizeFilename } from "@/lib/storage";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type RouteParams = { params: Promise<{ projectId: string; albumId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, albumId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const existing = await verifyAlbumInProject(albumId, projectId);
  if (!existing) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
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

  // Delete old cover art if exists
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: { coverArtPath: true },
  });
  if (album?.coverArtPath) {
    await storage.delete(album.coverArtPath).catch(() => {});
  }

  const fileName = sanitizeFilename(file.name);
  const storageKey = `projects/${projectId}/albums/${albumId}/cover/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await storage.save(storageKey, buffer, file.type);

  const updated = await prisma.album.update({
    where: { id: albumId },
    data: { coverArtPath: storageKey },
  });

  return NextResponse.json({ coverArtPath: updated.coverArtPath });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, albumId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const album = await prisma.album.findUnique({
    where: { id: albumId, projectId },
    select: { coverArtPath: true },
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  if (album.coverArtPath) {
    const storage = getStorage();
    await storage.delete(album.coverArtPath).catch(() => {});
  }

  await prisma.album.update({
    where: { id: albumId },
    data: { coverArtPath: null },
  });

  return NextResponse.json({ success: true });
}
