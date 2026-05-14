import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ projectId: string; setlistId: string }>;
};

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

  const setlist = await prisma.setlist.findUnique({
    where: { id: setlistId, projectId },
    select: { id: true },
  });

  if (!setlist) {
    return NextResponse.json(
      { error: "Setlist not found" },
      { status: 404 },
    );
  }

  let body: { itemIds?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Could not read request." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.itemIds) || body.itemIds.length === 0) {
    return NextResponse.json(
      { error: "Provide the list of items in order." },
      { status: 400 },
    );
  }

  const existingItems = await prisma.setlistItem.findMany({
    where: { setlistId },
    select: { id: true },
  });

  const existingIds = new Set(existingItems.map((i) => i.id));
  const allValid = body.itemIds.every((id) => existingIds.has(id));
  if (!allValid || body.itemIds.length !== existingIds.size) {
    return NextResponse.json(
      { error: "The item list doesn't match this setlist." },
      { status: 400 },
    );
  }

  await prisma.$transaction(
    body.itemIds.map((id, index) =>
      prisma.setlistItem.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  return NextResponse.json({ success: true });
}
