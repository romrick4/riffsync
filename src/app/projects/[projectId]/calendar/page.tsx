export const unstable_instant = { prefetch: "static" };

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CalendarView } from "@/components/calendar-view";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { projectId } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Calendar</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted/50" />}>
        <CalendarContent projectId={projectId} userId={user.id} />
      </Suspense>
    </div>
  );
}

async function CalendarContent({ projectId, userId }: { projectId: string; userId: string }) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) redirect("/");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const [events, busyBlocks, projectMembers] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        projectId,
        startTime: { gte: monthStart, lte: monthEnd },
      },
      include: {
        createdBy: {
          select: { id: true, displayName: true },
        },
        rsvps: { select: { status: true, userId: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.busyBlock.findMany({
      where: {
        projectId,
        startTime: { lte: monthEnd },
        endTime: { gte: monthStart },
      },
      include: {
        user: { select: { id: true, displayName: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, displayName: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
  ]);

  const serializedEvents = events.map((event) => {
    const going = event.rsvps.filter((r) => r.status === "GOING").length;
    const maybe = event.rsvps.filter((r) => r.status === "MAYBE").length;
    const cant = event.rsvps.filter(
      (r) => r.status === "CANT_MAKE_IT",
    ).length;
    const userRsvp = event.rsvps.find((r) => r.userId === userId);

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      location: event.location,
      createdBy: event.createdBy,
      createdAt: event.createdAt.toISOString(),
      rsvpCounts: { going, maybe, cant },
      userRsvp:
        (userRsvp?.status as "GOING" | "MAYBE" | "CANT_MAKE_IT") ?? null,
    };
  });

  const serializedBusy = busyBlocks.map((block) => ({
    id: block.id,
    startTime: block.startTime.toISOString(),
    endTime: block.endTime.toISOString(),
    note: block.note,
    user: block.user,
  }));

  const members = projectMembers.map((pm) => ({
    userId: pm.user.id,
    displayName: pm.user.displayName,
  }));

  return (
    <CalendarView
      projectId={projectId}
      currentUserId={userId}
      isOwner={membership.role === "OWNER"}
      members={members}
      initialEvents={serializedEvents}
      initialBusyBlocks={serializedBusy}
      initialYear={year}
      initialMonth={month}
    />
  );
}
