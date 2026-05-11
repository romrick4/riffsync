import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notify, getProjectMemberIds } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { inviteCode } = await request.json();

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { inviteCode: inviteCode.trim() },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 },
      );
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: project.id, userId: session.userId },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this project" },
        { status: 409 },
      );
    }

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: session.userId,
        role: "MEMBER",
      },
    });

    const joiningUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { displayName: true },
    });

    const recipientIds = await getProjectMemberIds(project.id, session.userId);
    notify({
      type: "INVITE_RECEIVED",
      message: `${joiningUser?.displayName ?? "Someone"} joined ${project.name}`,
      linkUrl: `/projects/${project.id}`,
      recipientIds,
    }).catch(() => {});

    const updatedProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        _count: { select: { members: true, songs: true } },
      },
    });

    return NextResponse.json({ project: updatedProject });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
