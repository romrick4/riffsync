import { cache } from "react";
import { prisma } from "@/lib/db";

export const getProjectMembership = cache(
  async (projectId: string, userId: string) => {
    return prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
  },
);

export const getProjectWithMembers = cache(async (projectId: string) => {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, displayName: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { songs: true, albums: true, calendarEvents: true } },
    },
  });
});
