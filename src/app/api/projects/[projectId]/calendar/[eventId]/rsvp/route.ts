import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { RsvpStatus } from "@/generated/prisma/client";

const VALID_STATUSES = ["GOING", "MAYBE", "CANT_MAKE_IT"];

export async function POST(
  request: Request,
  {
    params,
  }: { params: Promise<{ projectId: string; eventId: string }> },
) {
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

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: "status must be GOING, MAYBE, or CANT_MAKE_IT" },
      { status: 400 },
    );
  }

  const rsvp = await prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    update: { status: body.status as RsvpStatus, respondedAt: new Date() },
    create: {
      eventId,
      userId: user.id,
      status: body.status as RsvpStatus,
    },
  });

  return NextResponse.json(rsvp);
}
