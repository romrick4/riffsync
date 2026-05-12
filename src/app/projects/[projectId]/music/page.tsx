import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
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
import { NewAlbumDialog } from "@/components/new-album-dialog";
import { MusicIcon, DiscAlbumIcon, LayersIcon, ImageIcon } from "lucide-react";

export default async function MusicPage({
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

  const [albums, singles] = await Promise.all([
    prisma.album.findMany({
      where: { projectId },
      include: {
        songs: {
          select: {
            id: true,
            versions: {
              where: { isFinal: true },
              select: { id: true },
              take: 1,
            },
          },
        },
        _count: { select: { songs: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.song.findMany({
      where: { projectId, albumId: null },
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
    }),
  ]);

  const storage = getStorage();

  const albumsWithUrls = await Promise.all(
    albums.map(async (album) => ({
      ...album,
      coverArtUrl: album.coverArtPath
        ? await storage.getUrl(album.coverArtPath)
        : null,
    })),
  );

  const singlesWithUrls = await Promise.all(
    singles.map(async (song) => ({
      ...song,
      coverArtUrl: song.coverArtPath
        ? await storage.getUrl(song.coverArtPath)
        : null,
    })),
  );

  const hasContent = albums.length > 0 || singles.length > 0;

  return (
    <div className="flex flex-1 flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Music</h1>
          <p className="text-sm text-muted-foreground">
            Manage your albums, singles, and recordings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewAlbumDialog projectId={projectId} />
          <NewSongDialog projectId={projectId} />
        </div>
      </div>

      {!hasContent ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16">
          <MusicIcon className="size-10 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-medium">No music yet</p>
            <p className="text-sm text-muted-foreground">
              Create an album or add a single to get started.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Albums */}
          {albums.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold tracking-tight">Albums</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {albumsWithUrls.map((album) => {
                  const allFinal = album.songs.length > 0 && album.songs.every(
                    (s) => s.versions.length > 0,
                  );
                  const coverUrl = album.coverArtUrl;

                  return (
                    <Link
                      key={album.id}
                      href={`/projects/${projectId}/music/albums/${album.id}`}
                    >
                      <Card className="h-full transition-colors hover:bg-muted/30">
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={album.title}
                                className="size-12 rounded object-cover"
                              />
                            ) : (
                              <div className="flex size-12 items-center justify-center rounded bg-muted">
                                <DiscAlbumIcon className="size-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <CardTitle className="truncate">{album.title}</CardTitle>
                              {album.artistName && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {album.artistName}
                                </p>
                              )}
                            </div>
                          </div>
                          {allFinal && (
                            <CardAction>
                              <Badge variant="secondary">Ready</Badge>
                            </CardAction>
                          )}
                          {album.description && (
                            <CardDescription className="line-clamp-2">
                              {album.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MusicIcon className="size-3.5" />
                              {album._count.songs}{" "}
                              {album._count.songs === 1 ? "song" : "songs"}
                            </span>
                            {album.genre && (
                              <span>{album.genre}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Singles */}
          {singles.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold tracking-tight">Singles</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {singlesWithUrls.map((song) => {
                  const latestVersion = song.versions[0];
                  const hasFinal = song.versions.some((v) => v.isFinal);
                  const coverUrl = song.coverArtUrl;

                  return (
                    <Link
                      key={song.id}
                      href={`/projects/${projectId}/music/songs/${song.id}`}
                    >
                      <Card className="h-full transition-colors hover:bg-muted/30">
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={song.title}
                                className="size-10 rounded object-cover"
                              />
                            ) : (
                              <div className="flex size-10 items-center justify-center rounded bg-muted">
                                <MusicIcon className="size-5 text-muted-foreground" />
                              </div>
                            )}
                            <CardTitle className="flex-1 truncate">
                              {song.title}
                            </CardTitle>
                          </div>
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
                                {new Date(latestVersion.createdAt).toLocaleDateString("en-US")}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
