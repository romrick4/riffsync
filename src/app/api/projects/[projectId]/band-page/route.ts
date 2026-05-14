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

    const fields = {
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : undefined,
      bio: body.bio !== undefined ? (body.bio?.trim() || null) : undefined,
      contactEmail: body.contactEmail !== undefined ? (body.contactEmail?.trim() || null) : undefined,
      socialLinks: body.socialLinks !== undefined ? body.socialLinks : undefined,
    };

    const setFields = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined),
    );

    const bandPage = await prisma.bandPage.upsert({
      where: { projectId },
      create: {
        project: { connect: { id: projectId } },
        isPublished: fields.isPublished ?? false,
        bio: fields.bio ?? null,
        contactEmail: fields.contactEmail ?? null,
        socialLinks: fields.socialLinks ?? undefined,
      },
      update: setFields,
    });

    return NextResponse.json({ bandPage });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Try again in a moment." },
      { status: 500 },
    );
  }
}
