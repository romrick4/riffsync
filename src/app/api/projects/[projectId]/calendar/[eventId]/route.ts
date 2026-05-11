import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NotificationType } from "@/generated/prisma/client";
import type { EventType } from "@/generated/prisma/client";

type RouteParams = { params: Promise<{ projectId: string; eventId: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, eventId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId, projectId },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      rsvps: {
        include: {
          user: { select: { id: true, displayName: true, username: true } },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

const VALID_EVENT_TYPES = ["REHEARSAL", "SHOW", "RECORDING_SESSION", "OTHER"];

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, eventId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId, projectId },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  let body: {
    title?: string;
    description?: string | null;
    eventType?: string;
    startTime?: string;
    endTime?: string;
    location?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.eventType && !VALID_EVENT_TYPES.includes(body.eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const updated = await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.eventType !== undefined && {
        eventType: body.eventType as EventType,
      }),
      ...(body.startTime !== undefined && {
        startTime: new Date(body.startTime),
      }),
      ...(body.endTime !== undefined && { endTime: new Date(body.endTime) }),
      ...(body.location !== undefined && { location: body.location }),
    },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
    },
  });

  const members = await prisma.projectMember.findMany({
    where: { projectId, userId: { not: user.id } },
    select: { userId: true },
  });

  if (members.length > 0) {
    await prisma.notification.createMany({
      data: members.map((m) => ({
        type: NotificationType.EVENT_UPDATED,
        message: `${user.displayName} updated event "${updated.title}"`,
        linkUrl: `/projects/${projectId}/calendar`,
        userId: m.userId,
      })),
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, eventId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId, projectId },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const isOwner = membership.role === "OWNER";
  const isCreator = event.createdById === user.id;
  if (!isOwner && !isCreator) {
    return NextResponse.json(
      { error: "Only the event creator or project owner can delete events" },
      { status: 403 },
    );
  }

  await prisma.calendarEvent.delete({ where: { id: eventId } });

  return NextResponse.json({ success: true });
}
