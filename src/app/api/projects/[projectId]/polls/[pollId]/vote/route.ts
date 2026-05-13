import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; pollId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, pollId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const poll = await prisma.poll.findUnique({
    where: { id: pollId, projectId },
    include: { options: { select: { id: true } } },
  });
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }
  if (!poll.isActive) {
    return NextResponse.json({ error: "This poll is closed. Votes are no longer accepted." }, { status: 400 });
  }

  let body: { optionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 400 });
  }

  if (!body.optionId) {
    return NextResponse.json(
      { error: "Pick an option to vote." },
      { status: 400 },
    );
  }

  const validOption = poll.options.some((o) => o.id === body.optionId);
  if (!validOption) {
    return NextResponse.json(
      { error: "That option doesn't exist on this poll." },
      { status: 400 },
    );
  }

  // Remove any existing vote on this poll, then create the new one
  const existingOptionIds = poll.options.map((o) => o.id);

  await prisma.$transaction(async (tx) => {
    await tx.pollResponse.deleteMany({
      where: {
        userId: user.id,
        optionId: { in: existingOptionIds },
      },
    });

    await tx.pollResponse.create({
      data: {
        optionId: body.optionId!,
        userId: user.id,
      },
    });
  });

  return NextResponse.json({ success: true });
}
