"use client";

import { useMemo } from "react";
import { diffLines } from "diff";

interface LyricsDiffProps {
  oldContent: string;
  newContent: string;
  oldLabel: string;
  newLabel: string;
}

function stripHtml(html: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function LyricsDiff({
  oldContent,
  newContent,
  oldLabel,
  newLabel,
}: LyricsDiffProps) {
  const diff = useMemo(() => {
    const oldText = stripHtml(oldContent);
    const newText = stripHtml(newContent);
    return diffLines(oldText, newText);
  }, [oldContent, newContent]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-400">
          {oldLabel}
        </span>
        <span>→</span>
        <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-green-400">
          {newLabel}
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card/30 font-mono text-sm">
        {diff.map((part, i) => {
          const lines = part.value.split("\n");
          // Remove trailing empty string from split
          if (lines[lines.length - 1] === "") lines.pop();

          return lines.map((line, j) => (
            <div
              key={`${i}-${j}`}
              className={
                part.added
                  ? "border-l-2 border-green-500 bg-green-500/10 px-3 py-0.5 text-green-300"
                  : part.removed
                    ? "border-l-2 border-red-500 bg-red-500/10 px-3 py-0.5 text-red-300 line-through"
                    : "px-3 py-0.5 text-muted-foreground"
              }
            >
              <span className="mr-2 inline-block w-4 text-right text-muted-foreground/50">
                {part.added ? "+" : part.removed ? "-" : " "}
              </span>
              {line || "\u00A0"}
            </div>
          ));
        })}
      </div>
    </div>
  );
}
