import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { EventType } from "@/generated/prisma/client";
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

  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let dateFilter: { gte?: Date; lte?: Date } = {};

  if (month) {
    const [year, m] = month.split("-").map(Number);
    dateFilter = {
      gte: new Date(year, m - 1, 1),
      lte: new Date(year, m, 0, 23, 59, 59, 999),
    };
  } else if (from || to) {
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
  }

  const events = await prisma.calendarEvent.findMany({
    where: {
      projectId,
      ...(dateFilter.gte || dateFilter.lte
        ? { startTime: dateFilter }
        : {}),
    },
    include: {
      createdBy: { select: { id: true, displayName: true } },
      rsvps: {
        select: { status: true, userId: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const result = events.map((event) => {
    const going = event.rsvps.filter((r) => r.status === "GOING").length;
    const maybe = event.rsvps.filter((r) => r.status === "MAYBE").length;
    const cant = event.rsvps.filter((r) => r.status === "CANT_MAKE_IT").length;
    const userRsvp = event.rsvps.find((r) => r.userId === user.id);

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      createdBy: event.createdBy,
      createdAt: event.createdAt,
      rsvpCounts: { going, maybe, cant },
      userRsvp: userRsvp?.status ?? null,
    };
  });

  return NextResponse.json(result);
}

const VALID_EVENT_TYPES = ["REHEARSAL", "SHOW", "RECORDING_SESSION", "OTHER"];

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

  let body: {
    title?: string;
    description?: string;
    eventType?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, eventType, startTime, endTime, location } = body;

  if (!title || !eventType || !startTime || !endTime) {
    return NextResponse.json(
      { error: "title, eventType, startTime, and endTime are required" },
      { status: 400 },
    );
  }

  if (!VALID_EVENT_TYPES.includes(eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      description: description ?? null,
      eventType: eventType as EventType,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location: location ?? null,
      projectId,
      createdById: user.id,
    },
    include: {
      createdBy: { select: { id: true, displayName: true } },
    },
  });

  const recipientIds = await getProjectMemberIds(projectId, user.id);
  notify({
    type: "EVENT_CREATED",
    message: `${user.displayName} created event "${title}"`,
    linkUrl: `/projects/${projectId}/calendar`,
    recipientIds,
  }).catch(() => {});

  return NextResponse.json(event, { status: 201 });
}
