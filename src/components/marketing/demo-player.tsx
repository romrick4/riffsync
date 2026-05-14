"use client";

import { ClockIcon, UserIcon } from "lucide-react";

interface DemoComment {
  id: string;
  time: string;
  timeSec: number;
  author: string;
  text: string;
  isActive?: boolean;
}

const DEMO_COMMENTS: DemoComment[] = [
  {
    id: "c1",
    time: "0:32",
    timeSec: 32,
    author: "Maya",
    text: "Love this riff — keep it",
    isActive: true,
  },
  {
    id: "c2",
    time: "1:15",
    timeSec: 75,
    author: "Jake",
    text: "Drums feel rushed here",
  },
  {
    id: "c3",
    time: "2:41",
    timeSec: 161,
    author: "Alex",
    text: "Can we try a softer ending?",
  },
];

const DURATION_SEC = 198;

function generateWaveformBars(count: number, seed: number) {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const x = i / count;
    const base =
      0.3 +
      Math.abs(Math.sin(x * Math.PI * 2 + seed)) * 0.25 +
      Math.abs(Math.cos(x * Math.PI * 5.7 + seed * 2)) * 0.2 +
      Math.abs(Math.sin(x * Math.PI * 11 + seed * 0.5)) * 0.15;
    bars.push(Math.min(base, 0.95));
  }
  return bars;
}

export function DemoPlayer({ className }: { className?: string }) {
  const bars = generateWaveformBars(80, 42);

  return (
    <div className={`flex flex-col gap-4 ${className ?? ""}`}>
      {/* Waveform card */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-card-foreground">
              Added bass line
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              WAV
            </span>
          </div>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            0:32 / 3:18
          </span>
        </div>

        {/* Waveform visualization */}
        <div className="relative h-16">
          <div className="flex h-full items-end gap-[2px]">
            {bars.map((h, i) => {
              const progress = 32 / DURATION_SEC;
              const barPos = i / bars.length;
              const isPast = barPos <= progress;
              return (
                <div
                  key={i}
                  className={`min-w-[2px] flex-1 rounded-full transition-colors ${
                    isPast
                      ? "bg-primary/80"
                      : "bg-muted-foreground/20"
                  }`}
                  style={{ height: `${h * 100}%` }}
                />
              );
            })}
          </div>

          {/* Comment markers */}
          {DEMO_COMMENTS.map((c) => {
            const pct = (c.timeSec / DURATION_SEC) * 100;
            return (
              <div
                key={c.id}
                className="absolute -top-1.5 -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                <div
                  className={`size-2.5 rounded-full shadow-sm ${
                    c.isActive
                      ? "bg-primary shadow-primary/50 ring-2 ring-primary/30"
                      : "bg-primary/70 ring-1 ring-primary/20"
                  }`}
                />
              </div>
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 h-full w-0.5 bg-primary"
            style={{ left: `${(32 / DURATION_SEC) * 100}%` }}
          />
        </div>
      </div>

      {/* Comments list */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <h4 className="mb-3 text-sm font-medium text-card-foreground">
          Comments
        </h4>
        <div className="flex flex-col gap-1.5">
          {DEMO_COMMENTS.map((c, i) => (
            <div
              key={c.id}
              className={`animate-fade-in-up flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
                c.isActive
                  ? "bg-primary/10 ring-1 ring-primary/20"
                  : "bg-transparent"
              }`}
              style={{ animationDelay: `${800 + i * 150}ms` }}
            >
              <span className="mt-0.5 shrink-0 rounded bg-muted px-2 py-1 font-mono text-xs tabular-nums text-primary">
                {c.time}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="size-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-card-foreground">
                    {c.author}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-card-foreground/80">
                  {c.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Fake input */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex shrink-0 items-center gap-1 rounded bg-muted px-2 py-1.5 text-[11px] font-mono tabular-nums text-muted-foreground">
            <ClockIcon className="size-2.5" />
            0:32
          </div>
          <div className="flex-1 rounded-md border border-border/50 bg-background/50 px-3 py-1.5 text-xs text-muted-foreground">
            Add a comment…
          </div>
        </div>
      </div>
    </div>
  );
}
