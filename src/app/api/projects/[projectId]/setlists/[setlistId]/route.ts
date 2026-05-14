import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ projectId: string; setlistId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, setlistId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const setlist = await prisma.setlist.findUnique({
    where: { id: setlistId, projectId },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          song: {
            select: { id: true, title: true },
          },
          lockedVersion: {
            select: { id: true, title: true, versionNumber: true },
          },
        },
      },
    },
  });

  if (!setlist) {
    return NextResponse.json(
      { error: "Setlist not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(setlist);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, setlistId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const existing = await prisma.setlist.findUnique({
    where: { id: setlistId, projectId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Setlist not found" },
      { status: 404 },
    );
  }

  let body: { name?: string; description?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Could not read request." },
      { status: 400 },
    );
  }

  const data: { name?: string; description?: string | null } = {};

  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "A setlist needs a name." },
        { status: 400 },
      );
    }
    data.name = trimmed;
  }

  if (body.description !== undefined) {
    data.description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;
  }

  const updated = await prisma.setlist.update({
    where: { id: setlistId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, setlistId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const existing = await prisma.setlist.findUnique({
    where: { id: setlistId, projectId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Setlist not found" },
      { status: 404 },
    );
  }

  await prisma.setlist.delete({ where: { id: setlistId } });

  return NextResponse.json({ success: true });
}
