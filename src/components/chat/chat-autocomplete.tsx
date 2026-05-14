"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  UserIcon,
  MusicIcon,
  BarChart3Icon,
  CalendarIcon,
  ArrowLeftIcon,
  LayersIcon,
} from "lucide-react";

export type AutocompleteMode = "member" | "entity";

interface SearchResult {
  id: string;
  label: string;
  versionNumber?: number;
  songId?: string;
  songTitle?: string;
}

interface SelectedSong {
  id: string;
  title: string;
}

export interface AutocompleteSelection {
  type: "member" | "song" | "version" | "poll" | "event";
  id: string;
  label: string;
  songId?: string;
  songTitle?: string;
}

interface ChatAutocompleteProps {
  projectId: string;
  mode: AutocompleteMode;
  query: string;
  onSelect: (selection: AutocompleteSelection) => void;
  onDismiss: () => void;
}

export function ChatAutocomplete({
  projectId,
  mode,
  query,
  onSelect,
  onDismiss,
}: ChatAutocompleteProps) {
  const [songs, setSongs] = useState<SearchResult[]>([]);
  const [polls, setPolls] = useState<SearchResult[]>([]);
  const [events, setEvents] = useState<SearchResult[]>([]);
  const [members, setMembers] = useState<SearchResult[]>([]);
  const [versions, setVersions] = useState<SearchResult[]>([]);
  const [drillSong, setDrillSong] = useState<SelectedSong | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        if (drillSong) {
          const res = await fetch(
            `/api/projects/${projectId}/chat/search?type=version&q=${encodeURIComponent(q)}&songId=${drillSong.id}`,
          );
          if (res.ok) setVersions(await res.json());
        } else if (mode === "member") {
          const res = await fetch(
            `/api/projects/${projectId}/chat/search?type=member&q=${encodeURIComponent(q)}`,
          );
          if (res.ok) setMembers(await res.json());
        } else {
          const [songRes, pollRes, eventRes] = await Promise.all([
            fetch(
              `/api/projects/${projectId}/chat/search?type=song&q=${encodeURIComponent(q)}`,
            ),
            fetch(
              `/api/projects/${projectId}/chat/search?type=poll&q=${encodeURIComponent(q)}`,
            ),
            fetch(
              `/api/projects/${projectId}/chat/search?type=event&q=${encodeURIComponent(q)}`,
            ),
          ]);
          if (songRes.ok) setSongs(await songRes.json());
          if (pollRes.ok) setPolls(await pollRes.json());
          if (eventRes.ok) setEvents(await eventRes.json());
        }
      } finally {
        setLoading(false);
      }
    },
    [projectId, mode, drillSong],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (drillSong) {
          setDrillSong(null);
        } else {
          onDismiss();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drillSong, onDismiss]);

  function handleSongSelect(song: SearchResult) {
    setDrillSong({ id: song.id, title: song.label });
    setVersions([]);
  }

  function handleVersionSelect(version: SearchResult) {
    onSelect({
      type: "version",
      id: version.id,
      label: `${drillSong!.title} > ${version.label}`,
      songId: drillSong!.id,
      songTitle: drillSong!.title,
    });
  }

  function handleJustLinkSong() {
    if (!drillSong) return;
    onSelect({
      type: "song",
      id: drillSong.id,
      label: drillSong.title,
    });
  }

  const hasEntityResults =
    songs.length > 0 || polls.length > 0 || events.length > 0;

  return (
    <div className="absolute bottom-full left-0 right-0 z-50 mb-1 px-4">
      <Command
        shouldFilter={false}
        className="rounded-xl border bg-popover shadow-lg"
      >
        <CommandList className="max-h-56">
          {drillSong ? (
            <>
              <CommandGroup heading={drillSong.title}>
                <CommandItem onSelect={handleJustLinkSong}>
                  <MusicIcon className="size-4 text-muted-foreground" />
                  <span>Just link the song</span>
                </CommandItem>
                {versions.map((v) => (
                  <CommandItem
                    key={v.id}
                    onSelect={() => handleVersionSelect(v)}
                  >
                    <LayersIcon className="size-4 text-muted-foreground" />
                    <span>{v.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      v{v.versionNumber}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => setDrillSong(null)}
                  className="text-muted-foreground"
                >
                  <ArrowLeftIcon className="size-4" />
                  <span>Back to search</span>
                </CommandItem>
              </CommandGroup>
            </>
          ) : mode === "member" ? (
            <>
              {members.length === 0 && !loading && (
                <CommandEmpty>No members found</CommandEmpty>
              )}
              <CommandGroup heading="Members">
                {members.map((m) => (
                  <CommandItem
                    key={m.id}
                    onSelect={() =>
                      onSelect({ type: "member", id: m.id, label: m.label })
                    }
                  >
                    <UserIcon className="size-4 text-muted-foreground" />
                    <span>{m.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : (
            <>
              {!hasEntityResults && !loading && (
                <CommandEmpty>Nothing found</CommandEmpty>
              )}
              {songs.length > 0 && (
                <CommandGroup heading="Songs">
                  {songs.map((s) => (
                    <CommandItem
                      key={s.id}
                      onSelect={() => handleSongSelect(s)}
                    >
                      <MusicIcon className="size-4 text-muted-foreground" />
                      <span>{s.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {polls.length > 0 && (
                <CommandGroup heading="Polls">
                  {polls.map((p) => (
                    <CommandItem
                      key={p.id}
                      onSelect={() =>
                        onSelect({ type: "poll", id: p.id, label: p.label })
                      }
                    >
                      <BarChart3Icon className="size-4 text-muted-foreground" />
                      <span>{p.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {events.length > 0 && (
                <CommandGroup heading="Events">
                  {events.map((e) => (
                    <CommandItem
                      key={e.id}
                      onSelect={() =>
                        onSelect({ type: "event", id: e.id, label: e.label })
                      }
                    >
                      <CalendarIcon className="size-4 text-muted-foreground" />
                      <span>{e.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
