"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  PlusIcon,
  GripVerticalIcon,
  XIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Loader2Icon,
  SaveIcon,
} from "lucide-react";

interface TrackData {
  id: string;
  position: number;
  song: { id: string; title: string };
  version: { id: string; title: string; versionNumber: number } | null;
}

interface SongOption {
  id: string;
  title: string;
  latestVersion: {
    id: string;
    title: string;
    versionNumber: number;
  } | null;
  versions?: {
    id: string;
    title: string;
    versionNumber: number;
  }[];
}

interface Props {
  projectId: string;
  tracks: TrackData[];
  onTracksChange: (tracks: TrackData[]) => void;
}

export function BandPageTrackPicker({ projectId, tracks, onTracksChange }: Props) {
  const [songs, setSongs] = useState<SongOption[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    let cancelled = false;
    setLoadingSongs(true);
    fetch(`/api/projects/${projectId}/songs`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setSongs(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingSongs(false);
      });
    return () => { cancelled = true; };
  }, [projectId]);

  const selectedSongIds = new Set(tracks.map((t) => t.song.id));
  const availableSongs = songs.filter((s) => !selectedSongIds.has(s.id) && s.latestVersion);

  function addTrack(song: SongOption) {
    if (!song.latestVersion) return;
    const newTrack: TrackData = {
      id: `new-${Date.now()}`,
      position: tracks.length,
      song: { id: song.id, title: song.title },
      version: song.latestVersion,
    };
    onTracksChange([...tracks, newTrack]);
    setDirty(true);
  }

  function removeTrack(index: number) {
    const updated = tracks.filter((_, i) => i !== index);
    onTracksChange(updated);
    setDirty(true);
  }

  function moveTrack(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= tracks.length) return;
    const updated = [...tracks];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onTracksChange(updated);
    setDirty(true);
  }

  function changeVersion(index: number, versionId: string) {
    const song = songs.find((s) => s.id === tracks[index].song.id);
    if (!song) return;

    const allVersions = song.versions ?? (song.latestVersion ? [song.latestVersion] : []);
    const version = allVersions.find((v) => v.id === versionId);
    if (!version) return;

    const updated = [...tracks];
    updated[index] = { ...updated[index], version };
    onTracksChange(updated);
    setDirty(true);
  }

  async function saveTracks() {
    setSaving(true);
    try {
      const payload = tracks.map((t, i) => ({
        songId: t.song.id,
        versionId: t.version?.id ?? null,
        position: i,
      }));

      const res = await fetch(`/api/projects/${projectId}/band-page/tracks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: payload }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong. Try again.");
        return;
      }

      const data = await res.json();
      onTracksChange(data.tracks);
      setDirty(false);
      toast.success("Featured recordings saved.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {tracks.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No featured recordings yet. Add songs below.
        </p>
      )}

      {tracks.map((track, index) => (
        <div
          key={track.id}
          className="flex items-center gap-2 rounded-lg border bg-card p-3"
        >
          <div className="flex shrink-0 flex-col">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => moveTrack(index, "up")}
              disabled={index === 0}
            >
              <ChevronUpIcon className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => moveTrack(index, "down")}
              disabled={index === tracks.length - 1}
            >
              <ChevronDownIcon className="size-3" />
            </Button>
          </div>

          <GripVerticalIcon className="hidden size-4 shrink-0 text-muted-foreground sm:block" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{track.song.title}</p>
            {track.version && (
              <p className="text-xs text-muted-foreground">
                {track.version.title} (v{track.version.versionNumber})
              </p>
            )}
          </div>

          {/* Version selector - only show if the song has multiple versions */}
          {songs.find((s) => s.id === track.song.id)?.versions &&
            (songs.find((s) => s.id === track.song.id)?.versions?.length ?? 0) > 1 && (
              <Select
                value={track.version?.id ?? ""}
                onValueChange={(v) => v && changeVersion(index, v)}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {songs
                    .find((s) => s.id === track.song.id)
                    ?.versions?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        v{v.versionNumber}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => removeTrack(index)}
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        {loadingSongs ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Loading songs...
          </div>
        ) : availableSongs.length > 0 ? (
          <Select onValueChange={(songId) => {
            if (!songId) return;
            const song = songs.find((s) => s.id === songId);
            if (song) addTrack(song);
          }}>
            <SelectTrigger className="h-9 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <PlusIcon className="size-3.5" />
                <span>Add a song</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {availableSongs.map((song) => (
                <SelectItem key={song.id} value={song.id}>
                  {song.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : tracks.length > 0 ? (
          <p className="text-xs text-muted-foreground">All songs added.</p>
        ) : songs.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Upload some recordings first, then come back to feature them here.
          </p>
        ) : null}

        {dirty && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={saveTracks}
            disabled={saving}
          >
            {saving ? (
              <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <SaveIcon className="mr-1.5 size-3.5" />
            )}
            Save Track Order
          </Button>
        )}
      </div>
    </div>
  );
}
