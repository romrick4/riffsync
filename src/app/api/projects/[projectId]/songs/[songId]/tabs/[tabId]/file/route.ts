import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership, verifySongInProject } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

type RouteParams = {
  params: Promise<{ projectId: string; songId: string; tabId: string }>;
};

const CONTENT_TYPE_MAP: Record<string, string> = {
  ".gp": "application/x-guitar-pro",
  ".gp5": "application/x-guitar-pro",
  ".gpx": "application/x-guitar-pro",
  ".gp7": "application/x-guitar-pro",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
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
  });

  if (!tab) {
    return NextResponse.json({ error: "Tab not found" }, { status: 404 });
  }

  if (!tab.filePath) {
    return NextResponse.json(
      { error: "No file associated with this tab" },
      { status: 404 }
    );
  }

  const storage = getStorage();
  const buffer = await storage.get(tab.filePath);

  const ext = tab.filePath.substring(tab.filePath.lastIndexOf(".")).toLowerCase();
  const contentType = CONTENT_TYPE_MAP[ext] || "application/octet-stream";

  const fileName = tab.filePath.split("/").pop() || "file";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
