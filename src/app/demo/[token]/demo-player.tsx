"use client";

import { AudioPlayer } from "@/components/audio-player";

interface DemoPlayerProps {
  audioUrl: string;
  title: string;
  format: string;
  peaks: number[] | null;
  durationSec: number | null;
}

export function DemoPlayer({
  audioUrl,
  title,
  format,
  peaks,
  durationSec,
}: DemoPlayerProps) {
  return (
    <AudioPlayer
      src={audioUrl}
      title={title}
      format={format}
      peaks={peaks}
      durationSec={durationSec}
    />
  );
}
