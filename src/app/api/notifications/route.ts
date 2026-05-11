import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const where = {
    userId: session.userId,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({
      where: { userId: session.userId, isRead: false },
    }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({ unreadCount, notifications });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  const { notificationIds } = body;
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return NextResponse.json(
      { error: "notificationIds array or markAllRead required" },
      { status: 400 },
    );
  }

  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId: session.userId,
    },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
