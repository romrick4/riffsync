"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LyricsDiff } from "@/components/lyrics-diff";
import {
  HistoryIcon,
  RotateCcwIcon,
  UserIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GitCompareIcon,
} from "lucide-react";

interface LyricsVersion {
  id: string;
  content: string;
  changeNote: string | null;
  versionNumber: number;
  createdAt: string;
  editedBy: { id: string; displayName: string };
}

interface LyricsHistoryProps {
  versions: LyricsVersion[];
  currentVersionNumber: number;
  onRestore: (content: string) => void;
}

export function LyricsHistory({
  versions,
  currentVersionNumber,
  onRestore,
}: LyricsHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [diffPair, setDiffPair] = useState<{
    oldVersion: LyricsVersion;
    newVersion: LyricsVersion;
  } | null>(null);

  const sortedVersions = [...versions].sort(
    (a, b) => b.versionNumber - a.versionNumber
  );

  function handleToggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
    setDiffPair(null);
  }

  function handleShowDiff(oldVersion: LyricsVersion, newVersion: LyricsVersion) {
    setDiffPair({ oldVersion, newVersion });
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12">
        <HistoryIcon className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No versions saved yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <HistoryIcon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">
          Version History ({versions.length})
        </h3>
      </div>

      <ScrollArea className="max-h-[600px]">
        <div className="flex flex-col gap-2 pr-2">
          {sortedVersions.map((version, index) => {
            const isExpanded = expandedId === version.id;
            const isCurrent = version.versionNumber === currentVersionNumber;
            const prevVersion = sortedVersions[index + 1];

            return (
              <div
                key={version.id}
                className={`rounded-lg border transition-colors ${
                  isCurrent
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card/30 hover:bg-card/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleExpand(version.id)}
                  className="flex w-full items-start gap-3 p-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-primary">
                        v{version.versionNumber}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          Current
                        </span>
                      )}
                    </div>
                    {version.changeNote && (
                      <p className="mt-0.5 text-xs text-foreground/80 truncate">
                        {version.changeNote}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserIcon className="size-2.5" />
                        {version.editedBy.displayName}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="size-2.5" />
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUpIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDownIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-3 pb-3 pt-2">
                    <div className="mb-2 flex items-center gap-2">
                      {!isCurrent && (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => onRestore(version.content)}
                        >
                          <RotateCcwIcon data-icon="inline-start" />
                          Restore
                        </Button>
                      )}
                      {prevVersion && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => handleShowDiff(prevVersion, version)}
                        >
                          <GitCompareIcon data-icon="inline-start" />
                          Compare with v{prevVersion.versionNumber}
                        </Button>
                      )}
                    </div>

                    {diffPair &&
                    (diffPair.newVersion.id === version.id ||
                      diffPair.oldVersion.id === version.id) ? (
                      <LyricsDiff
                        oldContent={diffPair.oldVersion.content}
                        newContent={diffPair.newVersion.content}
                        oldLabel={`v${diffPair.oldVersion.versionNumber}`}
                        newLabel={`v${diffPair.newVersion.versionNumber}`}
                      />
                    ) : (
                      <div
                        className="prose prose-invert prose-sm max-w-none rounded-md bg-muted/20 px-3 py-2 text-xs"
                        dangerouslySetInnerHTML={{ __html: version.content }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
