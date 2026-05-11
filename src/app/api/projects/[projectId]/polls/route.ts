import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notify, getProjectMemberIds } from "@/lib/notifications";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const polls = await prisma.poll.findMany({
    where: { projectId },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      options: {
        include: {
          responses: { select: { userId: true } },
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const result = polls.map((poll) => {
    const totalVotes = poll.options.reduce(
      (sum, opt) => sum + opt.responses.length,
      0,
    );
    const userVotedOptionId = poll.options.find((opt) =>
      opt.responses.some((r) => r.userId === user.id),
    )?.id ?? null;

    return {
      id: poll.id,
      question: poll.question,
      isActive: poll.isActive,
      createdBy: poll.createdBy,
      createdAt: poll.createdAt,
      totalVotes,
      userVotedOptionId,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt.responses.length,
      })),
    };
  });

  return NextResponse.json(result);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  let body: { question?: string; options?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { question, options } = body;

  if (!question || !options || options.length < 2) {
    return NextResponse.json(
      { error: "question and at least 2 options are required" },
      { status: 400 },
    );
  }

  const poll = await prisma.poll.create({
    data: {
      question,
      projectId,
      createdById: user.id,
      options: {
        create: options.map((text) => ({ text })),
      },
    },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      options: true,
    },
  });

  const recipientIds = await getProjectMemberIds(projectId, user.id);
  notify({
    type: "POLL_CREATED",
    message: `${user.displayName} created a poll: "${question}"`,
    linkUrl: `/projects/${projectId}/polls`,
    recipientIds,
  }).catch(() => {});

  return NextResponse.json(poll, { status: 201 });
}
