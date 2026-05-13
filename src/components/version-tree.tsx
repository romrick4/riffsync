"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StarIcon, UserIcon, CalendarIcon, PlusIcon } from "lucide-react";

export interface VersionNode {
  id: string;
  title: string;
  description?: string;
  versionNumber: number;
  isFinal: boolean;
  fileFormat: string;
  fileSizeBytes: number;
  createdAt: string;
  uploadedBy: { id: string; displayName: string };
  parentVersionId: string | null;
  mergeParentIds: string[];
  audioUrl: string;
  waveformPeaks?: number[] | null;
  durationSec?: number | null;
}

interface VersionTreeProps {
  versions: VersionNode[];
  projectId: string;
  songId: string;
  onSelectVersion: (version: VersionNode) => void;
  selectedVersionId?: string;
  onUploadFromVersion?: (version: VersionNode) => void;
}

interface LayoutNode {
  version: VersionNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

const NODE_WIDTH = 224;
const NODE_HEIGHT = 88;
const H_GAP = 60;
const V_GAP = 28;

function buildTree(versions: VersionNode[]): LayoutNode[] {
  const byId = new Map<string, VersionNode>();
  for (const v of versions) byId.set(v.id, v);

  const childrenMap = new Map<string, VersionNode[]>();
  const roots: VersionNode[] = [];

  for (const v of versions) {
    if (!v.parentVersionId || !byId.has(v.parentVersionId)) {
      roots.push(v);
    } else {
      const siblings = childrenMap.get(v.parentVersionId) ?? [];
      siblings.push(v);
      childrenMap.set(v.parentVersionId, siblings);
    }
  }

  const sortByVersion = (a: VersionNode, b: VersionNode) =>
    a.versionNumber - b.versionNumber;

  roots.sort(sortByVersion);

  function buildNode(v: VersionNode, depth: number): LayoutNode {
    const kids = (childrenMap.get(v.id) ?? []).sort(sortByVersion);
    const childNodes = kids.map((c) => buildNode(c, depth + 1));
    return { version: v, x: 0, y: 0, children: childNodes };
  }

  return roots.map((r) => buildNode(r, 0));
}

function layoutTree(roots: LayoutNode[]): { width: number; height: number } {
  let nextY = 0;

  function assignPositions(node: LayoutNode, depth: number) {
    node.x = depth * (NODE_WIDTH + H_GAP);

    if (node.children.length === 0) {
      node.y = nextY;
      nextY += NODE_HEIGHT + V_GAP;
    } else {
      for (const child of node.children) {
        assignPositions(child, depth + 1);
      }
      const first = node.children[0].y;
      const last = node.children[node.children.length - 1].y;
      node.y = (first + last) / 2;
    }
  }

  for (const root of roots) {
    assignPositions(root, 0);
  }

  let maxX = 0;
  function findMax(node: LayoutNode) {
    if (node.x + NODE_WIDTH > maxX) maxX = node.x + NODE_WIDTH;
    for (const c of node.children) findMax(c);
  }
  for (const r of roots) findMax(r);

  return { width: maxX, height: nextY > 0 ? nextY - V_GAP + NODE_HEIGHT : NODE_HEIGHT };
}

function collectAllNodes(roots: LayoutNode[]): LayoutNode[] {
  const result: LayoutNode[] = [];
  function walk(n: LayoutNode) {
    result.push(n);
    for (const c of n.children) walk(c);
  }
  for (const r of roots) walk(r);
  return result;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function VersionTree({
  versions,
  onSelectVersion,
  selectedVersionId,
  onUploadFromVersion,
}: VersionTreeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const { roots, allNodes, edges, mergeEdges, treeWidth, treeHeight } =
    useMemo(() => {
      if (versions.length === 0) {
        return {
          roots: [],
          allNodes: [],
          edges: [],
          mergeEdges: [],
          treeWidth: 0,
          treeHeight: 0,
        };
      }

      const r = buildTree(versions);
      const { width, height } = layoutTree(r);
      const all = collectAllNodes(r);

      const nodeMap = new Map<string, LayoutNode>();
      for (const n of all) nodeMap.set(n.version.id, n);

      const parentEdges: { from: LayoutNode; to: LayoutNode }[] = [];
      for (const n of all) {
        for (const c of n.children) {
          parentEdges.push({ from: n, to: c });
        }
      }

      const mEdges: { from: LayoutNode; to: LayoutNode }[] = [];
      for (const n of all) {
        for (const mpId of n.version.mergeParentIds) {
          const mpNode = nodeMap.get(mpId);
          if (mpNode) {
            mEdges.push({ from: mpNode, to: n });
          }
        }
      }

      return {
        roots: r,
        allNodes: all,
        edges: parentEdges,
        mergeEdges: mEdges,
        treeWidth: width,
        treeHeight: height,
      };
    }, [versions]);

  const isLinear = useMemo(
    () =>
      versions.length <= 1 ||
      (versions.every((v) => v.mergeParentIds.length === 0) &&
        allNodes.every((n) => n.children.length <= 1)),
    [versions, allNodes]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!scrollRef.current) return;
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: scrollRef.current.scrollLeft,
        scrollTop: scrollRef.current.scrollTop,
      };
    },
    []
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!scrollRef.current || e.touches.length !== 1) return;
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        scrollLeft: scrollRef.current.scrollLeft,
        scrollTop: scrollRef.current.scrollTop,
      };
    },
    []
  );

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDragging || !scrollRef.current) return;
      e.preventDefault();
      scrollRef.current.scrollLeft =
        dragStart.current.scrollLeft - (e.clientX - dragStart.current.x);
      scrollRef.current.scrollTop =
        dragStart.current.scrollTop - (e.clientY - dragStart.current.y);
    }
    function handleMouseUp() {
      setIsDragging(false);
    }
    function handleTouchMove(e: TouchEvent) {
      if (!isDragging || !scrollRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      scrollRef.current.scrollLeft =
        dragStart.current.scrollLeft - (e.touches[0].clientX - dragStart.current.x);
      scrollRef.current.scrollTop =
        dragStart.current.scrollTop - (e.touches[0].clientY - dragStart.current.y);
    }
    function handleTouchEnd() {
      setIsDragging(false);
    }
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  if (versions.length === 0) return null;

  if (isLinear) {
    const sorted = [...versions].sort(
      (a, b) => a.versionNumber - b.versionNumber
    );
    return (
      <div className="overflow-x-auto">
        <div className="flex items-start gap-3 px-2 pt-3 pb-2">
          {sorted.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3">
              <VersionNodeCard
                version={v}
                isSelected={selectedVersionId === v.id}
                onClick={() => onSelectVersion(v)}
                onUpload={onUploadFromVersion ? () => onUploadFromVersion(v) : undefined}
              />
              {i < sorted.length - 1 && (
                <svg
                  viewBox="0 0 32 16"
                  fill="none"
                  className="w-8 shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                >
                  <line x1="0" y1="8" x2="26" y2="8" stroke="currentColor" strokeWidth="2" />
                  <path d="M22 4 L28 8 L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const padding = 24;

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={cn(
        "overflow-auto rounded-xl border bg-card/50 p-4 md:p-6 touch-none",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{ maxHeight: 460 }}
    >
      <div
        className="relative"
        style={{
          width: treeWidth + padding * 2,
          height: treeHeight + padding * 2,
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0"
          width={treeWidth + padding * 2}
          height={treeHeight + padding * 2}
        >
          {edges.map(({ from, to }) => {
            const x1 = from.x + NODE_WIDTH + padding;
            const y1 = from.y + NODE_HEIGHT / 2 + padding;
            const x2 = to.x + padding;
            const y2 = to.y + NODE_HEIGHT / 2 + padding;
            const cx = (x1 + x2) / 2;
            return (
              <path
                key={`${from.version.id}-${to.version.id}`}
                d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="oklch(0.556 0 0)"
                strokeWidth={2}
              />
            );
          })}
          {mergeEdges.map(({ from, to }) => {
            const x1 = from.x + NODE_WIDTH + padding;
            const y1 = from.y + NODE_HEIGHT / 2 + padding;
            const x2 = to.x + padding;
            const y2 = to.y + NODE_HEIGHT / 2 + padding;
            const cx = (x1 + x2) / 2;
            return (
              <path
                key={`merge-${from.version.id}-${to.version.id}`}
                d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="oklch(0.585 0.233 277)"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            );
          })}
        </svg>

        {allNodes.map((node) => (
          <div
            key={node.version.id}
            className="absolute"
            style={{
              left: node.x + padding,
              top: node.y + padding,
              width: NODE_WIDTH,
              height: NODE_HEIGHT,
            }}
          >
            <VersionNodeCard
              version={node.version}
              isSelected={selectedVersionId === node.version.id}
              onClick={() => onSelectVersion(node.version)}
              onUpload={onUploadFromVersion ? () => onUploadFromVersion(node.version) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function VersionNodeCard({
  version,
  isSelected,
  onClick,
  onUpload,
}: {
  version: VersionNode;
  isSelected: boolean;
  onClick: () => void;
  onUpload?: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-[224px] flex-col gap-1.5 rounded-lg border bg-card p-3.5 text-left text-sm transition-all hover:bg-accent/50",
          isSelected
            ? "border-primary ring-2 ring-primary/30"
            : "border-border hover:border-muted-foreground/40"
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium text-card-foreground">
            {version.title}
          </span>
          {version.isFinal && (
            <StarIcon className="ml-auto size-3.5 shrink-0 fill-amber-400 text-amber-400" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <UserIcon className="size-3" />
            {version.uploadedBy.displayName}
          </span>
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-3" />
            {formatDate(version.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-xs leading-none"
          >
            {version.fileFormat}
          </Badge>
        </div>
      </button>
      {onUpload && (
        <button
          type="button"
          title="Upload revision based on this version"
          onClick={(e) => {
            e.stopPropagation();
            onUpload();
          }}
          className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-opacity hover:bg-accent hover:text-accent-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 md:size-6"
        >
          <PlusIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
