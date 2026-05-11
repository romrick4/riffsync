import { NextRequest, NextResponse } from "next/server";
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

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, username: true, displayName: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ members });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const callerMembership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.userId } },
  });

  if (!callerMembership || callerMembership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only the project owner can remove members" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId query parameter is required" },
      { status: 400 },
    );
  }

  const targetMember = await prisma.projectMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMember || targetMember.projectId !== projectId) {
    return NextResponse.json(
      { error: "Member not found in this project" },
      { status: 404 },
    );
  }

  if (targetMember.userId === session.userId) {
    const ownerCount = await prisma.projectMember.count({
      where: { projectId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the only owner" },
        { status: 400 },
      );
    }
  }

  await prisma.projectMember.delete({ where: { id: memberId } });

  return NextResponse.json({ ok: true });
}
