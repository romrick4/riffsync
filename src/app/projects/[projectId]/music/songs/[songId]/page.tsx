import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getProjectMembership } from "@/lib/project-data";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, PlayCircleIcon, DiscAlbumIcon } from "lucide-react";
import Link from "next/link";
import { SongDetailClient } from "./song-detail-client";
import { SongMetadataClient } from "./song-metadata-client";
import { DeleteSongButton } from "@/components/delete-song-button";
import { LyricsSection } from "@/components/lyrics-section";
import { TextTabEditor } from "@/components/text-tab-editor";
import { UploadVersionDialog } from "@/components/upload-version-dialog";
import type { VersionNode } from "@/components/version-tree";

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; songId: string }>;
}) {
  const { projectId, songId } = await params;

  const user = await getCurrentUser();

  const song = await prisma.song.findUnique({
    where: { id: songId, projectId },
    include: {
      album: { select: { id: true, title: true } },
      versions: {
        include: {
          uploadedBy: {
            select: { id: true, displayName: true },
          },
          parentVersion: {
            select: { id: true, title: true, versionNumber: true },
          },
          mergeParents: {
            select: { parentVersionId: true },
          },
        },
        orderBy: { versionNumber: "desc" },
      },
      lyricVersions: {
        include: {
          editedBy: {
            select: { id: true, displayName: true },
          },
        },
        orderBy: { versionNumber: "desc" },
      },
      tabFiles: {
        include: {
          uploadedBy: {
            select: { id: true, displayName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!song) redirect(`/projects/${projectId}/music`);

  const membership = user
    ? await getProjectMembership(projectId, user.id)
    : null;
  const isOwner = membership?.role === "OWNER";

  const versionNodes: VersionNode[] = song.versions.map((v: typeof song.versions[number]) => ({
    id: v.id,
    title: v.title,
    description: v.description ?? undefined,
    versionNumber: v.versionNumber,
    isFinal: v.isFinal,
    fileFormat: v.fileFormat,
    fileSizeBytes: v.fileSizeBytes,
    createdAt: v.createdAt.toISOString(),
    uploadedBy: {
      id: v.uploadedBy.id,
      displayName: v.uploadedBy.displayName,
    },
    parentVersionId: v.parentVersionId,
    mergeParentIds: v.mergeParents.map((mp: { parentVersionId: string }) => mp.parentVersionId),
    audioUrl: `/api/projects/${projectId}/songs/${songId}/versions/${v.id}/file`,
  }));

  const versionListForDialog = song.versions.map((v: typeof song.versions[number]) => ({
    id: v.id,
    title: v.title,
    versionNumber: v.versionNumber,
  }));

  const lyricVersionsForClient = song.lyricVersions.map((v) => ({
    id: v.id,
    content: v.content,
    changeNote: v.changeNote,
    versionNumber: v.versionNumber,
    createdAt: v.createdAt.toISOString(),
    editedBy: { id: v.editedBy.id, displayName: v.editedBy.displayName },
  }));

  const tabFilesForClient = song.tabFiles.map((t) => ({
    id: t.id,
    title: t.title,
    fileType: t.fileType,
    textContent: t.textContent,
    filePath: t.filePath,
    createdAt: t.createdAt.toISOString(),
    uploadedBy: { displayName: t.uploadedBy.displayName },
  }));

  const storage = (await import("@/lib/storage")).getStorage();
  const coverUrl = song.coverArtPath
    ? await storage.getUrl(song.coverArtPath)
    : null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-start gap-4">
        <Link href={`/projects/${projectId}/music`}>
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon />
          </Button>
        </Link>
        {coverUrl && (
          <img
            src={coverUrl}
            alt={song.title}
            className="size-14 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">
              {song.title}
            </h1>
            {song.trackNumber && (
              <Badge variant="outline" className="shrink-0 font-mono">
                Track {song.trackNumber}
              </Badge>
            )}
            {isOwner && (
              <div className="ml-auto shrink-0">
                <DeleteSongButton
                  projectId={projectId}
                  songId={songId}
                  albumId={song.album?.id}
                />
              </div>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            {song.album && (
              <Link
                href={`/projects/${projectId}/music/albums/${song.album.id}`}
                className="flex shrink-0 items-center gap-1 whitespace-nowrap hover:text-foreground transition-colors"
              >
                <DiscAlbumIcon className="size-3.5" />
                {song.album.title}
              </Link>
            )}
            {!song.album && <span>Single</span>}
            {song.description && (
              <>
                <span>&middot;</span>
                <span className="line-clamp-1">{song.description}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="versions">
        <TabsList>
          <TabsTrigger value="versions">
            Versions ({song.versions.length})
          </TabsTrigger>
          <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
          <TabsTrigger value="tabs">Tabs</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="versions">
          {song.versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16">
              <PlayCircleIcon className="size-10 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium">No versions yet</p>
                <p className="text-sm text-muted-foreground">
                  Upload your first recording to get started.
                </p>
              </div>
              <UploadVersionDialog
                projectId={projectId}
                songId={songId}
                existingVersions={[]}
              />
            </div>
          ) : (
            <SongDetailClient
              projectId={projectId}
              songId={songId}
              songTitle={song.title}
              versions={versionNodes}
              existingVersions={versionListForDialog}
            />
          )}
        </TabsContent>

        <TabsContent value="lyrics">
          <LyricsSection
            songId={songId}
            projectId={projectId}
            versions={lyricVersionsForClient}
          />
        </TabsContent>

        <TabsContent value="tabs">
          <TextTabEditor
            songId={songId}
            projectId={projectId}
            tabs={tabFilesForClient}
          />
        </TabsContent>

        <TabsContent value="details">
          <SongMetadataClient
            projectId={projectId}
            songId={songId}
            coverArtUrl={coverUrl}
            isExplicit={song.isExplicit}
            language={song.language}
            isrc={song.isrc}
            featuredArtists={song.featuredArtists}
            songwriters={song.songwriters}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
