"use client";

import { useRef } from "react";
import { LyricsEditor, type LyricsEditorHandle } from "@/components/lyrics-editor";
import { LyricsHistory } from "@/components/lyrics-history";

interface LyricsSectionProps {
  songId: string;
  projectId: string;
  versions: {
    id: string;
    content: string;
    changeNote: string | null;
    versionNumber: number;
    createdAt: string;
    editedBy: { id: string; displayName: string };
  }[];
}

export function LyricsSection({
  songId,
  projectId,
  versions,
}: LyricsSectionProps) {
  const editorRef = useRef<LyricsEditorHandle>(null);

  const latestVersion = versions.length > 0 ? versions[0] : null;
  const initialContent = latestVersion?.content ?? "";
  const currentVersionNumber = latestVersion?.versionNumber ?? 0;

  function handleRestore(content: string) {
    editorRef.current?.setContent(content);
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1 lg:w-[70%]">
        <LyricsEditor
          ref={editorRef}
          songId={songId}
          projectId={projectId}
          initialContent={initialContent}
          versions={versions}
        />
      </div>
      <div className="lg:w-[30%] lg:min-w-[280px]">
        <LyricsHistory
          versions={versions}
          currentVersionNumber={currentVersionNumber}
          onRestore={handleRestore}
        />
      </div>
    </div>
  );
}
