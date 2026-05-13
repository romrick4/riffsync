"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  PlayIcon,
  PauseIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";

interface Comment {
  id: string;
  timestampSec: number;
  content: string;
  user: { displayName: string };
}

export interface AudioPlayerProps {
  src: string;
  resolveUrl?: () => Promise<string | null>;
  title: string;
  format: string;
  peaks?: number[] | null;
  durationSec?: number | null;
  comments?: Comment[];
  onTimestampClick?: (timestampSec: number) => void;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  src,
  resolveUrl,
  title,
  format,
  peaks,
  durationSec,
  comments,
  onTimestampClick,
}: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<import("wavesurfer.js").default | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSec ?? 0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  const hasPeaks = peaks && peaks.length > 0 && durationSec && durationSec > 0;

  if (src !== prevSrc) {
    setPrevSrc(src);
    setShouldLoad(false);
    setIsReady(false);
    setIsLoading(false);
  }

  // Pre-render waveform from peaks when available (before user clicks play)
  useEffect(() => {
    if (!hasPeaks || !containerRef.current || shouldLoad) return;

    let ws: import("wavesurfer.js").default;
    let cancelled = false;

    (async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      if (cancelled || !containerRef.current) return;

      ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "oklch(0.4 0 0)",
        progressColor: "oklch(0.585 0.233 277)",
        cursorColor: "oklch(0.585 0.233 277)",
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 64,
        normalize: true,
        peaks: [peaks],
        duration: durationSec,
        interact: false,
      });

      wsRef.current = ws;
    })();

    return () => {
      cancelled = true;
      ws?.destroy();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, hasPeaks]);

  useEffect(() => {
    if (!shouldLoad || !containerRef.current) return;

    let ws: import("wavesurfer.js").default;
    let cancelled = false;

    (async () => {
      const audioUrl = resolveUrl ? (await resolveUrl() ?? src) : src;
      if (cancelled) return;

      const WaveSurfer = (await import("wavesurfer.js")).default;
      if (cancelled || !containerRef.current) return;

      // Destroy the preview-only instance if it exists
      wsRef.current?.destroy();

      ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "oklch(0.4 0 0)",
        progressColor: "oklch(0.585 0.233 277)",
        cursorColor: "oklch(0.585 0.233 277)",
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 64,
        normalize: true,
        url: audioUrl,
        ...(hasPeaks ? { peaks: [peaks], duration: durationSec } : {}),
      });

      ws.on("ready", () => {
        if (cancelled) return;
        setDuration(ws.getDuration());
        setIsReady(true);
        setIsLoading(false);
        ws.setVolume(volume);
        ws.play();
      });

      ws.on("timeupdate", (time: number) => setCurrentTime(time));
      ws.on("play", () => setIsPlaying(true));
      ws.on("pause", () => setIsPlaying(false));
      ws.on("finish", () => setIsPlaying(false));

      ws.on("click", (relativeX: number) => {
        if (onTimestampClick) {
          const clickedTime = relativeX * ws.getDuration();
          onTimestampClick(clickedTime);
        }
      });

      wsRef.current = ws;
    })();

    return () => {
      cancelled = true;
      ws?.destroy();
      wsRef.current = null;
      setIsReady(false);
      setIsPlaying(false);
      setIsLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, shouldLoad]);

  const togglePlay = useCallback(() => {
    if (!shouldLoad) {
      setShouldLoad(true);
      setIsLoading(true);
      return;
    }

    wsRef.current?.playPause();
  }, [shouldLoad]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setVolume(v);
      setIsMuted(v === 0);
      wsRef.current?.setVolume(v);
    },
    []
  );

  const toggleMute = useCallback(() => {
    if (isMuted) {
      wsRef.current?.setVolume(volume || 0.8);
      setIsMuted(false);
    } else {
      wsRef.current?.setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const seekTo = useCallback(
    (time: number) => {
      if (wsRef.current && duration > 0) {
        wsRef.current.seekTo(time / duration);
      }
    },
    [duration]
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="truncate font-medium">{title}</span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs uppercase text-muted-foreground">
            {format}
          </span>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="relative min-h-16">
        <div ref={containerRef} className="w-full" />

        {!isReady && !hasPeaks && (
          <div className="absolute inset-0 bg-card">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <WaveformSkeleton />
            )}
          </div>
        )}

        {isReady && comments && comments.length > 0 && duration > 0 && (
          <CommentMarkers
            comments={comments}
            duration={duration}
            onSeek={seekTo}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : isPlaying ? (
            <PauseIcon className="size-4" />
          ) : (
            <PlayIcon className="size-4" />
          )}
        </Button>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon-xs" onClick={toggleMute}>
            {isMuted ? (
              <VolumeXIcon className="size-3.5" />
            ) : (
              <Volume2Icon className="size-3.5" />
            )}
          </Button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary md:[&::-webkit-slider-thumb]:size-3"
          />
        </div>
      </div>
    </div>
  );
}

function WaveformSkeleton() {
  return (
    <div className="flex h-full items-end gap-[3px]">
      {Array.from({ length: 70 }, (_, i) => {
        const h = 20 + Math.abs(Math.sin(i * 0.45) * 35 + Math.cos(i * 1.3) * 20);
        return (
          <div
            key={i}
            className="min-w-[2px] flex-1 rounded-full bg-muted-foreground/15"
            style={{ height: `${Math.min(h, 90)}%` }}
          />
        );
      })}
    </div>
  );
}

function CommentMarkers({
  comments,
  duration,
  onSeek,
}: {
  comments: Comment[];
  duration: number;
  onSeek: (time: number) => void;
}) {
  return (
    <TooltipProvider>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
        {comments.map((c) => {
          const pct = (c.timestampSec / duration) * 100;
          if (pct < 0 || pct > 100) return null;
          return (
            <Tooltip key={c.id}>
              <TooltipTrigger
                className="pointer-events-auto absolute -top-2 z-10 -translate-x-1/2 cursor-pointer p-1"
                style={{ left: `${pct}%` }}
                onClick={() => onSeek(c.timestampSec)}
                render={<button type="button" />}
              >
                <div className="size-3.5 rounded-full bg-primary shadow-sm shadow-primary/50 ring-1 ring-primary/30 md:size-2.5" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-52">
                <span className="font-medium">{c.user.displayName}</span>
                {" \u00b7 "}
                <span className="font-mono text-xs">
                  {formatTime(c.timestampSec)}
                </span>
                <br />
                <span className="text-muted-foreground">{c.content}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
