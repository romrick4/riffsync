import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

type RouteParams = {
  params: Promise<{ projectId: string; songId: string }>;
};

async function verifyMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

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

  const tabs = await prisma.tabFile.findMany({
    where: { songId },
    include: {
      uploadedBy: {
        select: { id: true, displayName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tabs);
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
    select: { id: true },
  });
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    let body: { title?: string; fileType?: string; textContent?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { title, fileType, textContent } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (fileType !== "TEXT_TAB") {
      return NextResponse.json(
        { error: "JSON body only supports TEXT_TAB fileType" },
        { status: 400 }
      );
    }
    if (!textContent?.trim()) {
      return NextResponse.json(
        { error: "textContent is required for TEXT_TAB" },
        { status: 400 }
      );
    }

    const tab = await prisma.tabFile.create({
      data: {
        title: title.trim(),
        fileType: "TEXT_TAB",
        textContent: textContent,
        songId,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: { select: { id: true, displayName: true } },
      },
    });

    return NextResponse.json(tab, { status: 201 });
  }

  // Multipart form data for file uploads
  const formData = await request.formData();
  const title = formData.get("title") as string | null;
  const fileType = formData.get("fileType") as string | null;
  const file = formData.get("file") as File | null;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!fileType || !["GUITAR_PRO", "IMAGE"].includes(fileType)) {
    return NextResponse.json(
      { error: "fileType must be GUITAR_PRO or IMAGE" },
      { status: 400 }
    );
  }
  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const tabId = crypto.randomUUID();
  const storageKey = `projects/${projectId}/songs/${songId}/tabs/${tabId}/${file.name}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = getStorage();
  await storage.save(storageKey, buffer, file.type);

  const tab = await prisma.tabFile.create({
    data: {
      id: tabId,
      title: title.trim(),
      fileType: fileType as "GUITAR_PRO" | "IMAGE",
      filePath: storageKey,
      songId,
      uploadedById: user.id,
    },
    include: {
      uploadedBy: { select: { id: true, displayName: true } },
    },
  });

  return NextResponse.json(tab, { status: 201 });
}
