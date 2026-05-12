import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getCurrentUser,
  verifyMembership,
  verifySongInProject,
} from "@/lib/auth";
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
    return NextResponse.json(
      { error: "Not a project member" },
      { status: 403 },
    );
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
      { status: 404 },
    );
  }

  const storage = getStorage();
  const url = await storage.getUrl(tab.filePath);

  return NextResponse.redirect(url, 307);
}
