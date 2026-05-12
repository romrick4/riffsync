import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PollsList } from "@/components/polls-list";

export default async function PollsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Polls</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted/50" />}>
        <PollsContent projectId={projectId} />
      </Suspense>
    </div>
  );
}

async function PollsContent({ projectId }: { projectId: string }) {
  const user = (await getCurrentUser())!;

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
        opt.responses.some((r) => r.userId === user.id),
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
