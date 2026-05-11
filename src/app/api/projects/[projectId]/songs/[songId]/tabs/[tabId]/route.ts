import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership, verifySongInProject } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

type RouteParams = {
  params: Promise<{ projectId: string; songId: string; tabId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId, tabId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const song = await verifySongInProject(songId, projectId);
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const tab = await prisma.tabFile.findUnique({
    where: { id: tabId, songId },
    include: {
      uploadedBy: { select: { id: true, displayName: true } },
    },
  });

  if (!tab) {
    return NextResponse.json({ error: "Tab not found" }, { status: 404 });
  }

  return NextResponse.json(tab);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId, tabId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const song = await verifySongInProject(songId, projectId);
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const tab = await prisma.tabFile.findUnique({
    where: { id: tabId, songId },
  });

  if (!tab) {
    return NextResponse.json({ error: "Tab not found" }, { status: 404 });
  }

  if (tab.fileType !== "TEXT_TAB") {
    return NextResponse.json(
      { error: "Only TEXT_TAB files can be edited" },
      { status: 400 }
    );
  }

  let body: { textContent?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updated = await prisma.tabFile.update({
    where: { id: tabId },
    data: {
      ...(body.textContent !== undefined && { textContent: body.textContent }),
      ...(body.title?.trim() && { title: body.title.trim() }),
    },
    include: {
      uploadedBy: { select: { id: true, displayName: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId, tabId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const song = await verifySongInProject(songId, projectId);
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const tab = await prisma.tabFile.findUnique({
    where: { id: tabId, songId },
  });

  if (!tab) {
    return NextResponse.json({ error: "Tab not found" }, { status: 404 });
  }

  if (tab.filePath) {
    try {
      const storage = getStorage();
      await storage.delete(tab.filePath);
    } catch {
      // Storage deletion failures shouldn't block DB cleanup
    }
  }

  await prisma.tabFile.delete({ where: { id: tabId } });

  return NextResponse.json({ success: true });
}
