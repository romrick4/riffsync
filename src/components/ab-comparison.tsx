"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PlayIcon,
  PauseIcon,
  RefreshCwIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "lucide-react";

export interface ABComparisonProps {
  versionA: { id: string; title: string; src: string; format: string };
  versionB: { id: string; title: string; src: string; format: string };
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ABComparison({ versionA, versionB }: ABComparisonProps) {
  const containerARef = useRef<HTMLDivElement>(null);
  const containerBRef = useRef<HTMLDivElement>(null);
  const wsARef = useRef<import("wavesurfer.js").default | null>(null);
  const wsBRef = useRef<import("wavesurfer.js").default | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<"A" | "B">("A");
  const [readyA, setReadyA] = useState(false);
  const [readyB, setReadyB] = useState(false);
  const [timeA, setTimeA] = useState(0);
  const [timeB, setTimeB] = useState(0);
  const [durationA, setDurationA] = useState(0);
  const [durationB, setDurationB] = useState(0);

  useEffect(() => {
    let wsA: import("wavesurfer.js").default;
    let wsB: import("wavesurfer.js").default;
    let cancelled = false;

    (async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      if (cancelled) return;

      if (containerARef.current) {
        wsA = WaveSurfer.create({
          container: containerARef.current,
          waveColor: "oklch(0.4 0 0)",
          progressColor: "oklch(0.637 0.207 277)",
          cursorColor: "oklch(0.637 0.207 277)",
          cursorWidth: 2,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 48,
          normalize: true,
          url: versionA.src,
        });
        wsA.on("ready", () => {
          if (!cancelled) {
            setDurationA(wsA.getDuration());
            setReadyA(true);
          }
        });
        wsA.on("timeupdate", (t: number) => setTimeA(t));
        wsA.on("finish", () => setIsPlaying(false));
        wsARef.current = wsA;
      }

      if (containerBRef.current) {
        wsB = WaveSurfer.create({
          container: containerBRef.current,
          waveColor: "oklch(0.4 0 0)",
          progressColor: "oklch(0.556 0.15 300)",
          cursorColor: "oklch(0.556 0.15 300)",
          cursorWidth: 2,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 48,
          normalize: true,
          url: versionB.src,
        });
        wsB.on("ready", () => {
          if (!cancelled) {
            setDurationB(wsB.getDuration());
            setReadyB(true);
          }
        });
        wsB.on("timeupdate", (t: number) => setTimeB(t));
        wsB.on("finish", () => setIsPlaying(false));
        wsBRef.current = wsB;
      }
    })();

    return () => {
      cancelled = true;
      wsA?.destroy();
      wsB?.destroy();
      wsARef.current = null;
      wsBRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionA.src, versionB.src]);

  const togglePlayback = useCallback(() => {
    const wsA = wsARef.current;
    const wsB = wsBRef.current;
    if (!wsA || !wsB) return;

    if (isPlaying) {
      wsA.pause();
      wsB.pause();
      setIsPlaying(false);
    } else {
      if (activeTrack === "A") {
        wsB.pause();
        wsA.play();
      } else {
        wsA.pause();
        wsB.play();
      }
      setIsPlaying(true);
    }
  }, [isPlaying, activeTrack]);

  const switchTrack = useCallback(() => {
    const next = activeTrack === "A" ? "B" : "A";
    setActiveTrack(next);

    if (isPlaying) {
      if (next === "A") {
        wsBRef.current?.pause();
        wsARef.current?.play();
      } else {
        wsARef.current?.pause();
        wsBRef.current?.play();
      }
    }
  }, [activeTrack, isPlaying]);

  const syncPositions = useCallback(() => {
    const wsA = wsARef.current;
    const wsB = wsBRef.current;
    if (!wsA || !wsB || !durationA || !durationB) return;

    if (activeTrack === "A") {
      const ratio = timeA / durationA;
      wsB.seekTo(Math.min(ratio, 1));
    } else {
      const ratio = timeB / durationB;
      wsA.seekTo(Math.min(ratio, 1));
    }
  }, [activeTrack, timeA, timeB, durationA, durationB]);

  const bothReady = readyA && readyB;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">A/B Comparison</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={togglePlayback}
            disabled={!bothReady}
          >
            {isPlaying ? (
              <PauseIcon className="size-4" />
            ) : (
              <PlayIcon className="size-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={switchTrack}
            disabled={!bothReady}
          >
            {activeTrack === "A" ? (
              <ToggleLeftIcon data-icon="inline-start" className="size-4" />
            ) : (
              <ToggleRightIcon data-icon="inline-start" className="size-4" />
            )}
            Playing {activeTrack}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={syncPositions}
            disabled={!bothReady}
          >
            <RefreshCwIcon data-icon="inline-start" className="size-3.5" />
            Sync
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <TrackPanel
          label="A"
          title={versionA.title}
          format={versionA.format}
          containerRef={containerARef}
          isActive={activeTrack === "A"}
          isReady={readyA}
          currentTime={timeA}
          duration={durationA}
          accentColor="oklch(0.637 0.207 277)"
        />
        <TrackPanel
          label="B"
          title={versionB.title}
          format={versionB.format}
          containerRef={containerBRef}
          isActive={activeTrack === "B"}
          isReady={readyB}
          currentTime={timeB}
          duration={durationB}
          accentColor="oklch(0.556 0.15 300)"
        />
      </div>
    </div>
  );
}

function TrackPanel({
  label,
  title,
  format,
  containerRef,
  isActive,
  isReady,
  currentTime,
  duration,
}: {
  label: string;
  title: string;
  format: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
  isReady: boolean;
  currentTime: number;
  duration: number;
  accentColor: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all",
        isActive
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card/50 opacity-60"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant={isActive ? "default" : "outline"}
            className="h-5 w-5 justify-center p-0 text-[10px]"
          >
            {label}
          </Badge>
          <span className="text-xs font-medium">{title}</span>
          <span className="rounded bg-muted px-1 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">
            {format}
          </span>
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <div ref={containerRef} className="w-full" />
      {!isReady && (
        <div className="flex h-12 items-center justify-center">
          <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
