import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, displayName: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { songs: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { inviteCode, ...projectWithoutCode } = project;
  const responseProject =
    membership.role === "OWNER"
      ? project
      : projectWithoutCode;

  return NextResponse.json({ project: responseProject });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
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
      { error: "Only the project owner can update settings" },
      { status: 403 },
    );
  }

  try {
    const { name, description, slug, rotateInviteCode } = await request.json();

    const data: Record<string, string | null> = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (rotateInviteCode === true) {
      data.inviteCode = nanoid(12);
    }

    if (slug !== undefined) {
      const normalized = slugify(String(slug));
      if (normalized.length < 2) {
        return NextResponse.json(
          { error: "URL must be at least 2 characters." },
          { status: 400 },
        );
      }
      if (normalized.length > 48) {
        return NextResponse.json(
          { error: "URL must be 48 characters or fewer." },
          { status: 400 },
        );
      }
      const existing = await prisma.project.findUnique({
        where: { slug: normalized },
        select: { id: true },
      });
      if (existing && existing.id !== projectId) {
        return NextResponse.json(
          { error: "That URL is already taken. Try a different one." },
          { status: 409 },
        );
      }
      data.slug = normalized;
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        _count: { select: { members: true, songs: true } },
      },
    });

    return NextResponse.json({ project });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Try again in a moment." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
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
      { error: "Only the project owner can delete the project" },
      { status: 403 },
    );
  }

  await prisma.project.delete({ where: { id: projectId } });

  return NextResponse.json({ ok: true });
}
