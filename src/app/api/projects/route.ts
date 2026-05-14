import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

function generateInviteCode(): string {
  return nanoid(12);
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: session.userId } } },
    include: {
      _count: { select: { members: true, songs: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 },
      );
    }

    let slug = slugify(name.trim());
    if (!slug) slug = "project";

    const baseSlug = slug;
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await prisma.project.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${nanoid(6)}`;
    }

    const inviteCode = generateInviteCode();

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        inviteCode,
        members: {
          create: {
            userId: session.userId,
            role: "OWNER",
          },
        },
      },
      include: {
        _count: { select: { members: true, songs: true } },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
