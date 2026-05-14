import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ projectId: string; linkId: string }>;
};

export async function DELETE(
  _request: Request,
  { params }: RouteParams,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, linkId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const link = await prisma.demoLink.findUnique({
    where: { id: linkId, projectId },
  });

  if (!link) {
    return NextResponse.json(
      { error: "Link not found" },
      { status: 404 },
    );
  }

  await prisma.demoLink.update({
    where: { id: linkId },
    data: { isRevoked: true },
  });

  return NextResponse.json({ success: true });
}
