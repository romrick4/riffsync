import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership, verifySongInProject } from "@/lib/auth";

const MAX_EXPIRY_DAYS = 30;
const DEFAULT_EXPIRY_DAYS = 7;

type RouteParams = {
  params: Promise<{ projectId: string; songId: string; versionId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, songId, versionId } = await params;

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

  const version = await prisma.songVersion.findUnique({
    where: { id: versionId, songId },
    select: { id: true, uploadStatus: true },
  });
  if (!version) {
    return NextResponse.json(
      { error: "Recording not found" },
      { status: 404 },
    );
  }

  if (version.uploadStatus !== "READY" && version.uploadStatus !== "PROCESSING") {
    return NextResponse.json(
      { error: "This recording isn't ready to share yet." },
      { status: 400 },
    );
  }

  let body: { expiresInDays?: number } = {};
  try {
    body = await request.json();
  } catch {
    // Default expiry is fine
  }

  const expiresInDays = Math.min(
    Math.max(1, body.expiresInDays ?? DEFAULT_EXPIRY_DAYS),
    MAX_EXPIRY_DAYS,
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const demoLink = await prisma.demoLink.create({
    data: {
      expiresAt,
      songVersionId: versionId,
      songId,
      projectId,
      createdById: user.id,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json(
    {
      id: demoLink.id,
      token: demoLink.token,
      url: `${appUrl}/demo/${demoLink.token}`,
      expiresAt: demoLink.expiresAt.toISOString(),
    },
    { status: 201 },
  );
}
