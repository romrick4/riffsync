import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSession(): Promise<{ userId: string } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!profile) return null;

  return { userId: profile.id };
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return profile;
}

export async function verifyMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

export async function verifySongInProject(songId: string, projectId: string) {
  return prisma.song.findUnique({
    where: { id: songId, projectId },
    select: { id: true },
  });
}

export async function verifyAlbumInProject(albumId: string, projectId: string) {
  return prisma.album.findUnique({
    where: { id: albumId, projectId },
    select: { id: true },
  });
}
