import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, PlayCircleIcon } from "lucide-react";
import Link from "next/link";
import { SongDetailClient } from "./song-detail-client";
import { LyricsSection } from "@/components/lyrics-section";
import { TextTabEditor } from "@/components/text-tab-editor";
import { UploadVersionDialog } from "@/components/upload-version-dialog";
import type { VersionNode } from "@/components/version-tree";

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; songId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { projectId, songId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) redirect("/");

  const song = await prisma.song.findUnique({
    where: { id: songId, projectId },
    include: {
      versions: {
        include: {
          uploadedBy: {
            select: { id: true, username: true, displayName: true },
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
            select: { id: true, username: true, displayName: true },
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

  if (!song) redirect(`/projects/${projectId}/songs`);

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

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      <div className="flex items-start gap-4">
        <Link href={`/projects/${projectId}/songs`}>
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {song.title}
          </h1>
          {song.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {song.description}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="versions">
        <TabsList>
          <TabsTrigger value="versions">
            Versions ({song.versions.length})
          </TabsTrigger>
          <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
          <TabsTrigger value="tabs">Tabs</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
