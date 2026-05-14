import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getStorage, sanitizeFilename } from "@/lib/storage";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type RouteParams = { params: Promise<{ projectId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.userId } },
  });
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only the band owner can manage the band page" },
      { status: 403 },
    );
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
      { error: "Unsupported image format. Use JPG, PNG, or WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "That image is too large. The limit is 10 MB." },
      { status: 400 },
    );
  }

  const storage = getStorage();

  const bandPage = await prisma.bandPage.findUnique({
    where: { projectId },
    select: { heroImagePath: true },
  });
  if (bandPage?.heroImagePath) {
    await storage.delete(bandPage.heroImagePath).catch(() => {});
  }

  const fileName = sanitizeFilename(file.name);
  const storageKey = `projects/${projectId}/band-page/hero/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await storage.save(storageKey, buffer, file.type);

  const updated = await prisma.bandPage.upsert({
    where: { projectId },
    create: { projectId, heroImagePath: storageKey },
    update: { heroImagePath: storageKey },
  });

  const heroImageUrl = await storage.getUrl(storageKey);

  return NextResponse.json({ heroImagePath: updated.heroImagePath, heroImageUrl });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.userId } },
  });
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only the band owner can manage the band page" },
      { status: 403 },
    );
  }

  const bandPage = await prisma.bandPage.findUnique({
    where: { projectId },
    select: { heroImagePath: true },
  });

  if (bandPage?.heroImagePath) {
    const storage = getStorage();
    await storage.delete(bandPage.heroImagePath).catch(() => {});
  }

  if (bandPage) {
    await prisma.bandPage.update({
      where: { projectId },
      data: { heroImagePath: null },
    });
  }

  return NextResponse.json({ success: true });
}
