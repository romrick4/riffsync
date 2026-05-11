import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewSongDialog } from "@/components/new-song-dialog";
import { MusicIcon, LayersIcon } from "lucide-react";

export default async function SongsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) redirect("/");

  const songs = await prisma.song.findMany({
    where: { projectId },
    include: {
      versions: {
        select: {
          id: true,
          title: true,
          versionNumber: true,
          isFinal: true,
          createdAt: true,
        },
        orderBy: { versionNumber: "desc" },
      },
      _count: { select: { versions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Songs</h1>
          <p className="text-sm text-muted-foreground">
            Manage your band&apos;s songs, versions, and recordings.
          </p>
        </div>
        <NewSongDialog projectId={projectId} />
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16">
          <MusicIcon className="size-10 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-medium">No songs yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first song to start tracking versions.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {songs.map((song) => {
            const latestVersion = song.versions[0];
            const hasFinal = song.versions.some((v) => v.isFinal);

            return (
              <Link
                key={song.id}
                href={`/projects/${projectId}/songs/${song.id}`}
              >
                <Card className="h-full transition-colors hover:bg-muted/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {song.title}
                    </CardTitle>
                    {hasFinal && (
                      <CardAction>
                        <Badge variant="secondary">Final</Badge>
                      </CardAction>
                    )}
                    {song.description && (
                      <CardDescription className="line-clamp-2">
                        {song.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <LayersIcon className="size-3.5" />
                        {song._count.versions}{" "}
                        {song._count.versions === 1 ? "version" : "versions"}
                      </span>
                      {latestVersion && (
                        <span>
                          Updated{" "}
                          {new Date(
                            latestVersion.createdAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
