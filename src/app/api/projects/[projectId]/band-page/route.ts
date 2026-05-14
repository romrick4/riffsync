import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.userId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const bandPage = await prisma.bandPage.findUnique({
    where: { projectId },
    include: {
      tracks: {
        orderBy: { position: "asc" },
        include: {
          song: { select: { id: true, title: true } },
          version: { select: { id: true, title: true, versionNumber: true } },
        },
      },
    },
  });

  return NextResponse.json({ bandPage });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

  try {
    const body = await request.json();
    const { isPublished, bio, contactEmail, socialLinks } = body;

    const data: Record<string, unknown> = {};
    if (isPublished !== undefined) data.isPublished = Boolean(isPublished);
    if (bio !== undefined) data.bio = bio?.trim() || null;
    if (contactEmail !== undefined) data.contactEmail = contactEmail?.trim() || null;
    if (socialLinks !== undefined) data.socialLinks = socialLinks;

    const bandPage = await prisma.bandPage.upsert({
      where: { projectId },
      create: { projectId, ...data },
      update: data,
    });

    return NextResponse.json({ bandPage });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Try again in a moment." },
      { status: 500 },
    );
  }
}
