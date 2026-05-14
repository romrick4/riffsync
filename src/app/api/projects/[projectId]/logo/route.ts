import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";
import { getStorage, sanitizeFilename } from "@/lib/storage";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type RouteParams = { params: Promise<{ projectId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
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
    return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
  }

  const storage = getStorage();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { logoPath: true },
  });
  if (project?.logoPath) {
    await storage.delete(project.logoPath).catch(() => {});
  }

  const fileName = sanitizeFilename(file.name);
  const storageKey = `projects/${projectId}/logo/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await storage.save(storageKey, buffer, file.type);

  await prisma.project.update({
    where: { id: projectId },
    data: { logoPath: storageKey },
  });

  const logoUrl = await storage.getUrl(storageKey);

  return NextResponse.json({ logoPath: storageKey, logoUrl });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { logoPath: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.logoPath) {
    const storage = getStorage();
    await storage.delete(project.logoPath).catch(() => {});
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { logoPath: null },
  });

  return NextResponse.json({ success: true });
}
