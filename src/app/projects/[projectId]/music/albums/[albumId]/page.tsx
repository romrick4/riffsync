import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { AlbumDetailClient } from "./album-detail-client";

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; albumId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { projectId, albumId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) redirect("/");

  const album = await prisma.album.findUnique({
    where: { id: albumId, projectId },
    include: {
      project: { select: { name: true } },
      songs: {
        include: {
          versions: {
            where: { isFinal: true },
            select: { id: true },
            take: 1,
          },
          _count: { select: { versions: true } },
        },
        orderBy: { trackNumber: "asc" },
      },
    },
  });

  if (!album) redirect(`/projects/${projectId}/music`);

  const unassignedSongs = await prisma.song.findMany({
    where: { projectId, albumId: null },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  const albumData = {
    ...album,
    releaseDate: album.releaseDate?.toISOString() ?? null,
    createdAt: album.createdAt.toISOString(),
    updatedAt: album.updatedAt.toISOString(),
    songs: album.songs.map((s) => ({
      id: s.id,
      title: s.title,
      trackNumber: s.trackNumber,
      hasFinalVersion: s.versions.length > 0,
      versionCount: s._count.versions,
    })),
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      <div className="flex items-start gap-4">
        <Link href={`/projects/${projectId}/music`}>
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {album.title}
          </h1>
          {album.artistName && (
            <p className="text-sm text-muted-foreground">
              {album.artistName}
            </p>
          )}
        </div>
      </div>

      <AlbumDetailClient
        album={albumData}
        projectId={projectId}
        projectName={album.project.name}
        unassignedSongs={unassignedSongs}
        isOwner={membership.role === "OWNER"}
      />
    </div>
  );
}
