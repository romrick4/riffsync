"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

export async function getAudioUrl(
  projectId: string,
  songId: string,
  versionId: string,
): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.userId } },
    select: { id: true },
  });
  if (!membership) return null;

  const version = await prisma.songVersion.findUnique({
    where: { id: versionId, song: { id: songId, projectId } },
    select: { compressedFilePath: true, filePath: true },
  });
  if (!version) return null;

  const storage = getStorage();
  const key = version.compressedFilePath ?? version.filePath;
  return storage.getUrl(key);
}
