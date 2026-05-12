"use client";

import { useState, useCallback, useEffect } from "react";
import { VersionTree, type VersionNode } from "@/components/version-tree";
import { AudioPlayer } from "@/components/audio-player";
import { AudioComments } from "@/components/audio-comments";
import { ABComparison } from "@/components/ab-comparison";
import { UploadVersionDialog } from "@/components/upload-version-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DownloadIcon,
  LinkIcon,
  GitCompareArrowsIcon,
  XIcon,
  UserIcon,
  CalendarIcon,
  HardDriveIcon,
  CheckIcon,
  LightbulbIcon,
  GitBranchIcon,
  ArrowRightIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

interface CommentData {
  id: string;
  content: string;
  timestampSec: number;
  createdAt: string;
  user: { id: string; displayName: string };
}

interface SongDetailClientProps {
  projectId: string;
  songId: string;
  songTitle: string;
  versions: VersionNode[];
  existingVersions: { id: string; title: string; versionNumber: number }[];
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SongDetailClient({
  projectId,
  songId,
  versions,
  existingVersions,
}: SongDetailClientProps) {
  const [selectedVersion, setSelectedVersion] = useState<VersionNode | null>(
    () => {
      const final = versions.find((v) => v.isFinal);
      return final ?? versions[0] ?? null;
    }
  );
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [abMode, setAbMode] = useState(false);
  const [abVersionA, setAbVersionA] = useState<VersionNode | null>(null);
  const [abVersionB, setAbVersionB] = useState<VersionNode | null>(null);
  const [abPickStep, setAbPickStep] = useState<null | "A" | "B">(null);
  const [copied, setCopied] = useState(false);
  const [uploadFromVersion, setUploadFromVersion] = useState<VersionNode | null>(null);
  const [tipsDismissed, setTipsDismissed] = useState(true);
  const [finalVersionId, setFinalVersionId] = useState<string | null>(
    () => versions.find((v) => v.isFinal)?.id ?? null,
  );

  useEffect(() => {
    setTipsDismissed(localStorage.getItem("riffsync:version-tips-dismissed") === "true");
  }, []);

  const dismissTips = useCallback(() => {
    setTipsDismissed(true);
    localStorage.setItem("riffsync:version-tips-dismissed", "true");
  }, []);

  const fetchComments = useCallback(
    async (versionId: string) => {
      setCommentsLoading(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/songs/${songId}/versions/${versionId}/comments`
        );
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } finally {
        setCommentsLoading(false);
      }
    },
    [projectId, songId]
  );

  const handleSelectVersion = useCallback(
    (v: VersionNode) => {
      setSelectedVersion(v);
      setCurrentTimestamp(0);
      fetchComments(v.id);
    },
    [fetchComments]
  );

  const handleAddComment = useCallback(
    async (content: string, timestampSec: number) => {
      if (!selectedVersion) return;
      const res = await fetch(
        `/api/projects/${projectId}/songs/${songId}/versions/${selectedVersion.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, timestampSec }),
        }
      );
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
      }
    },
    [projectId, songId, selectedVersion]
  );

  const handleTimestampClick = useCallback((ts: number) => {
    setCurrentTimestamp(ts);
  }, []);

  const handleSeekTo = useCallback(
    (ts: number) => {
      setCurrentTimestamp(ts);
    },
    []
  );

  const [togglingFinal, setTogglingFinal] = useState(false);

  const handleToggleFinal = useCallback(
    async (version: VersionNode) => {
      setTogglingFinal(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/songs/${songId}/versions/${version.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isFinal: !version.isFinal }),
          },
        );
        if (res.ok) {
          const nowFinal = !version.isFinal;
          setSelectedVersion((prev) =>
            prev?.id === version.id ? { ...prev, isFinal: nowFinal } : prev,
          );
          setFinalVersionId(nowFinal ? version.id : null);
        }
      } finally {
        setTogglingFinal(false);
      }
    },
    [projectId, songId],
  );

  const handleDeleteVersion = useCallback(
    async (version: VersionNode) => {
      const res = await fetch(
        `/api/projects/${projectId}/songs/${songId}/versions/${version.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Something went wrong. Try again in a moment.");
        throw new Error("delete failed");
      }
      toast.success("Recording deleted");
      window.location.reload();
    },
    [projectId, songId],
  );

  const startAbComparison = useCallback(() => {
    if (versions.length < 2) return;
    setAbPickStep("A");
    setAbVersionA(null);
    setAbVersionB(null);
    setAbMode(false);
  }, [versions.length]);

  const handleAbPick = useCallback(
    (v: VersionNode) => {
      if (abPickStep === "A") {
        setAbVersionA(v);
        setAbPickStep("B");
      } else if (abPickStep === "B") {
        setAbVersionB(v);
        setAbPickStep(null);
        setAbMode(true);
      }
    },
    [abPickStep]
  );

  const exitAbMode = useCallback(() => {
    setAbMode(false);
    setAbVersionA(null);
    setAbVersionB(null);
    setAbPickStep(null);
  }, []);

  const copyVersionLink = useCallback(
    (versionId: string) => {
      const url = `${window.location.origin}/projects/${projectId}/music/songs/${songId}?version=${versionId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    [projectId, songId],
  );

  const fileUrl = selectedVersion
    ? `/api/projects/${projectId}/songs/${songId}/versions/${selectedVersion.id}/file`
    : null;

  const commentMarkers = comments.map((c) => ({
    id: c.id,
    timestampSec: c.timestampSec,
    content: c.content,
    user: { displayName: c.user.displayName },
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <UploadVersionDialog
          projectId={projectId}
          songId={songId}
          existingVersions={existingVersions}
        />
        <UploadVersionDialog
          projectId={projectId}
          songId={songId}
          existingVersions={existingVersions}
          defaultParentVersionId={uploadFromVersion?.id}
          open={uploadFromVersion !== null}
          onOpenChange={(open) => { if (!open) setUploadFromVersion(null); }}
        />
        {versions.length >= 2 && (
          <Button variant="outline" onClick={startAbComparison}>
            <GitCompareArrowsIcon data-icon="inline-start" />
            A/B Compare
          </Button>
        )}
        {finalVersionId && (
          <a
            href={`/api/projects/${projectId}/songs/${songId}/versions/${finalVersionId}/file`}
            download
          >
            <Button variant="outline">
              <DownloadIcon data-icon="inline-start" />
              Download Final
            </Button>
          </a>
        )}
      </div>

      {/* A/B pick prompt */}
      {abPickStep && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <span className="flex-1">
            Select version <strong>{abPickStep}</strong> from the tree below
            {abPickStep === "B" && abVersionA && (
              <span className="text-muted-foreground">
                {" "}
                (A = {abVersionA.title})
              </span>
            )}
          </span>
          <Button variant="ghost" size="icon-xs" className="shrink-0" onClick={exitAbMode}>
            <XIcon className="size-3" />
          </Button>
        </div>
      )}

      {/* Version tree */}
      {versions.length > 0 && (
        <VersionTree
          versions={versions}
          projectId={projectId}
          songId={songId}
          onSelectVersion={abPickStep ? handleAbPick : handleSelectVersion}
          selectedVersionId={
            abPickStep ? undefined : selectedVersion?.id
          }
          onUploadFromVersion={setUploadFromVersion}
        />
      )}

      {/* Versioning tips */}
      {!tipsDismissed && versions.length <= 3 && (
        <div className="rounded-lg border border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LightbulbIcon className="size-4 text-amber-500" />
              Getting the most out of versioning
            </div>
            <button
              type="button"
              onClick={dismissTips}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <XIcon className="size-4" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="flex gap-2.5 text-sm">
              <ArrowRightIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Iterate linearly</p>
                <p className="text-muted-foreground">
                  Each new upload continues from the last, keeping a clean revision trail.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 text-sm">
              <GitBranchIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Branch out</p>
                <p className="text-muted-foreground">
                  Start a new branch to explore an alternative direction without losing the original.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 text-sm">
              <PlusIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Revise any version</p>
                <p className="text-muted-foreground">
                  Hover over any version and click <strong>+</strong> to upload a revision based on it.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A/B Comparison */}
      {abMode && abVersionA && abVersionB && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Comparing Versions</h3>
            <Button variant="ghost" size="sm" onClick={exitAbMode}>
              <XIcon data-icon="inline-start" className="size-3.5" />
              Close
            </Button>
          </div>
          <ABComparison
            versionA={{
              id: abVersionA.id,
              title: abVersionA.title,
              src: `/api/projects/${projectId}/songs/${songId}/versions/${abVersionA.id}/file`,
              format: abVersionA.fileFormat,
            }}
            versionB={{
              id: abVersionB.id,
              title: abVersionB.title,
              src: `/api/projects/${projectId}/songs/${songId}/versions/${abVersionB.id}/file`,
              format: abVersionB.fileFormat,
            }}
          />
        </div>
      )}

      {/* Selected version detail */}
      {selectedVersion && !abMode && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            {/* Version metadata */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{selectedVersion.title}</span>
              {selectedVersion.isFinal && <Badge>Final</Badge>}
              <Badge variant="outline">{selectedVersion.fileFormat}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyVersionLink(selectedVersion.id)}
              >
                {copied ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <LinkIcon data-icon="inline-start" />
                )}
                {copied ? "Copied!" : "Share"}
              </Button>
              {fileUrl && (
                <a href={fileUrl} download>
                  <Button variant="ghost" size="sm">
                    <DownloadIcon data-icon="inline-start" />
                    Download
                  </Button>
                </a>
              )}
              <Button
                variant={selectedVersion.isFinal ? "outline" : "secondary"}
                size="sm"
                disabled={togglingFinal}
                onClick={() => handleToggleFinal(selectedVersion)}
              >
                <StarIcon
                  data-icon="inline-start"
                  className={selectedVersion.isFinal ? "fill-amber-400 text-amber-400" : ""}
                />
                {selectedVersion.isFinal ? "Unset Final" : "Set as Final"}
              </Button>
              <DeleteConfirmDialog
                title="Delete this recording?"
                description={`"${selectedVersion.title}" and all its comments will be permanently deleted. This can't be undone.`}
                confirmLabel="Delete Recording"
                trigger={
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                    <Trash2Icon data-icon="inline-start" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                }
                onConfirm={() => handleDeleteVersion(selectedVersion)}
              />
            </div>

            {selectedVersion.description && (
              <p className="text-sm text-muted-foreground">
                {selectedVersion.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <UserIcon className="size-3.5" />
                {selectedVersion.uploadedBy.displayName}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                {new Date(selectedVersion.createdAt).toLocaleDateString("en-US")}
              </span>
              <span className="flex items-center gap-1.5">
                <HardDriveIcon className="size-3.5" />
                {formatFileSize(selectedVersion.fileSizeBytes)}
              </span>
            </div>

            {/* Audio player */}
            <AudioPlayer
              src={`/api/projects/${projectId}/songs/${songId}/versions/${selectedVersion.id}/file`}
              title={selectedVersion.title}
              format={selectedVersion.fileFormat}
              comments={commentMarkers}
              onTimestampClick={handleTimestampClick}
            />
          </div>

          {/* Comments panel */}
          <div className="flex flex-col">
            {commentsLoading ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border bg-card">
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <AudioComments
                comments={comments}
                onAddComment={handleAddComment}
                currentTimestamp={currentTimestamp}
                onSeekTo={handleSeekTo}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
