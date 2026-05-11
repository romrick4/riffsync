import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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

  let overlapFilter: { startTime?: { lte: Date }; endTime?: { gte: Date } } = {};

  if (month) {
    const [year, m] = month.split("-").map(Number);
    const monthStart = new Date(year, m - 1, 1);
    const monthEnd = new Date(year, m, 0, 23, 59, 59, 999);
    overlapFilter = {
      startTime: { lte: monthEnd },
      endTime: { gte: monthStart },
    };
  } else if (from || to) {
    if (to) overlapFilter.startTime = { lte: new Date(to) };
    if (from) overlapFilter.endTime = { gte: new Date(from) };
  }

  const busyBlocks = await prisma.busyBlock.findMany({
    where: {
      projectId,
      ...overlapFilter,
    },
    include: {
      user: { select: { id: true, displayName: true, username: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(busyBlocks);
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

  let body: { startTime?: string; endTime?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { startTime, endTime, note } = body;

  if (!startTime || !endTime) {
    return NextResponse.json(
      { error: "Start and end times are required" },
      { status: 400 },
    );
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 },
    );
  }

  const busyBlock = await prisma.busyBlock.create({
    data: {
      startTime: start,
      endTime: end,
      note: note ?? null,
      projectId,
      userId: user.id,
    },
    include: {
      user: { select: { id: true, displayName: true, username: true } },
    },
  });

  return NextResponse.json(busyBlock, { status: 201 });
}
