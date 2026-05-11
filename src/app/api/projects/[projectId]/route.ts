import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

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
            select: { id: true, username: true, displayName: true },
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
    const { name, description, rotateInviteCode } = await request.json();

    const data: Record<string, string | null> = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (rotateInviteCode === true) {
      data.inviteCode = nanoid(12);
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
      { error: "Internal server error" },
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
