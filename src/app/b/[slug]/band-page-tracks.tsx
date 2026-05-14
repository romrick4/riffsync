"use client";

import Image from "next/image";
import { AudioPlayer } from "@/components/audio-player";

interface Track {
  id: string;
  songTitle: string;
  versionTitle: string;
  format: string;
  audioUrl: string;
  coverArtUrl: string | null;
  peaks: number[] | null;
  durationSec: number | null;
}

export function BandPageTracks({ tracks }: { tracks: Track[] }) {
  return (
    <div className="space-y-3">
      {tracks.map((track) => (
        <div key={track.id} className="overflow-hidden rounded-xl border bg-card">
          {track.coverArtUrl && (
            <div className="relative h-32 w-full sm:h-40">
              <Image
                src={track.coverArtUrl}
                alt={track.songTitle}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
                <p className="text-sm font-semibold text-white drop-shadow-md">
                  {track.songTitle}
                </p>
              </div>
            </div>
          )}
          <div className="p-4">
            {!track.coverArtUrl && (
              <p className="mb-2 text-sm font-semibold">{track.songTitle}</p>
            )}
            <AudioPlayer
              src={track.audioUrl}
              title={track.versionTitle}
              format={track.format}
              peaks={track.peaks}
              durationSec={track.durationSec}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
