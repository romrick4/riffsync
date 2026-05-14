import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ projectId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteParams,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const links = await prisma.demoLink.findMany({
    where: { projectId, isRevoked: false },
    include: {
      songVersion: {
        select: { id: true, title: true, versionNumber: true },
      },
      song: {
        select: { id: true, title: true },
      },
      createdBy: {
        select: { id: true, displayName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const result = links.map((link) => ({
    id: link.id,
    token: link.token,
    url: `${appUrl}/demo/${link.token}`,
    expiresAt: link.expiresAt.toISOString(),
    isExpired: link.expiresAt < new Date(),
    createdAt: link.createdAt.toISOString(),
    songVersion: link.songVersion,
    song: link.song,
    createdBy: link.createdBy,
  }));

  return NextResponse.json(result);
}
