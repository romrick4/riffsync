import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PollsList } from "@/components/polls-list";

export default async function PollsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { projectId } = await params;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Polls</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted/50" />}>
        <PollsContent projectId={projectId} userId={user.id} />
      </Suspense>
    </div>
  );
}

async function PollsContent({ projectId, userId }: { projectId: string; userId: string }) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) redirect("/");

  const polls = await prisma.poll.findMany({
    where: { projectId },
    include: {
      createdBy: { select: { id: true, displayName: true } },
      options: {
        include: {
          responses: { select: { userId: true } },
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const serialized = polls.map((poll) => {
    const totalVotes = poll.options.reduce(
      (sum, opt) => sum + opt.responses.length,
      0,
    );
    const userVotedOptionId =
      poll.options.find((opt) =>
        opt.responses.some((r) => r.userId === userId),
      )?.id ?? null;

    return {
      id: poll.id,
      question: poll.question,
      isActive: poll.isActive,
      createdBy: poll.createdBy,
      createdAt: poll.createdAt.toISOString(),
      totalVotes,
      userVotedOptionId,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt.responses.length,
      })),
    };
  });

  return <PollsList projectId={projectId} initialPolls={serialized} />;
}
