"use client";

import { StarIcon, UserIcon, CalendarIcon } from "lucide-react";

interface DemoNode {
  id: string;
  title: string;
  author: string;
  date: string;
  format: string;
  isFinal?: boolean;
  parentId: string | null;
}

const DEMO_VERSIONS: DemoNode[] = [
  {
    id: "v1",
    title: "Rough demo",
    author: "Alex",
    date: "Apr 2",
    format: "WAV",
    parentId: null,
  },
  {
    id: "v2",
    title: "Added bass line",
    author: "Maya",
    date: "Apr 5",
    format: "WAV",
    parentId: "v1",
  },
  {
    id: "v3",
    title: "New bridge idea",
    author: "Alex",
    date: "Apr 7",
    format: "WAV",
    parentId: "v1",
  },
  {
    id: "v4",
    title: "Final mix",
    author: "Jake",
    date: "Apr 10",
    format: "MP3",
    isFinal: true,
    parentId: "v2",
  },
];

const NODE_W = 192;
const NODE_H = 76;
const H_GAP = 48;
const V_GAP = 24;

interface LayoutNode {
  node: DemoNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

function buildAndLayout(nodes: DemoNode[]) {
  const byId = new Map<string, DemoNode>();
  for (const n of nodes) byId.set(n.id, n);

  const childrenMap = new Map<string, DemoNode[]>();
  const roots: DemoNode[] = [];

  for (const n of nodes) {
    if (!n.parentId) {
      roots.push(n);
    } else {
      const siblings = childrenMap.get(n.parentId) ?? [];
      siblings.push(n);
      childrenMap.set(n.parentId, siblings);
    }
  }

  function buildNode(n: DemoNode): LayoutNode {
    const kids = (childrenMap.get(n.id) ?? []).map(buildNode);
    return { node: n, x: 0, y: 0, children: kids };
  }

  const layoutRoots = roots.map(buildNode);

  let nextY = 0;
  function assign(ln: LayoutNode, depth: number) {
    ln.x = depth * (NODE_W + H_GAP);
    if (ln.children.length === 0) {
      ln.y = nextY;
      nextY += NODE_H + V_GAP;
    } else {
      for (const c of ln.children) assign(c, depth + 1);
      const first = ln.children[0].y;
      const last = ln.children[ln.children.length - 1].y;
      ln.y = (first + last) / 2;
    }
  }
  for (const r of layoutRoots) assign(r, 0);

  const all: LayoutNode[] = [];
  function collect(ln: LayoutNode) {
    all.push(ln);
    for (const c of ln.children) collect(c);
  }
  for (const r of layoutRoots) collect(r);

  let maxX = 0;
  for (const ln of all) {
    if (ln.x + NODE_W > maxX) maxX = ln.x + NODE_W;
  }

  const edges: { from: LayoutNode; to: LayoutNode }[] = [];
  function findEdges(ln: LayoutNode) {
    for (const c of ln.children) {
      edges.push({ from: ln, to: c });
      findEdges(c);
    }
  }
  for (const r of layoutRoots) findEdges(r);

  return {
    all,
    edges,
    width: maxX,
    height: nextY > 0 ? nextY - V_GAP + NODE_H : NODE_H,
  };
}

export function DemoVersionTree({ className }: { className?: string }) {
  const PAD = 16;
  const { all, edges, width, height } = buildAndLayout(DEMO_VERSIONS);

  return (
    <div
      className={`overflow-x-auto overflow-y-hidden ${className ?? ""}`}
      role="img"
      aria-label="A version tree showing four recordings branching from a rough demo to a final mix"
    >
      <div
        className="relative"
        style={{ width: width + PAD * 2, height: height + PAD * 2 }}
      >
        <svg
          className="pointer-events-none absolute inset-0"
          width={width + PAD * 2}
          height={height + PAD * 2}
        >
          {edges.map(({ from, to }) => {
            const x1 = from.x + NODE_W + PAD;
            const y1 = from.y + NODE_H / 2 + PAD;
            const x2 = to.x + PAD;
            const y2 = to.y + NODE_H / 2 + PAD;
            const cx = (x1 + x2) / 2;
            return (
              <path
                key={`${from.node.id}-${to.node.id}`}
                d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="oklch(0.556 0 0)"
                strokeWidth={2}
              />
            );
          })}
        </svg>

        {all.map((ln, i) => (
          <div
            key={ln.node.id}
            className="animate-fade-in-up absolute"
            style={{
              left: ln.x + PAD,
              top: ln.y + PAD,
              width: NODE_W,
              height: NODE_H,
              animationDelay: `${600 + i * 120}ms`,
            }}
          >
            <div
              className={`flex h-full flex-col gap-1 rounded-lg border p-3 text-sm transition-colors ${
                ln.node.isFinal
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/50 bg-card/60"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium text-card-foreground text-xs">
                  {ln.node.title}
                </span>
                {ln.node.isFinal && (
                  <StarIcon className="ml-auto size-3 shrink-0 fill-amber-400 text-amber-400" />
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <UserIcon className="size-2.5" />
                  {ln.node.author}
                </span>
                <span className="flex items-center gap-0.5">
                  <CalendarIcon className="size-2.5" />
                  {ln.node.date}
                </span>
              </div>
              <span className="mt-auto inline-flex w-fit rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {ln.node.format}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
