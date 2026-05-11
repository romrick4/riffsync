"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, MusicIcon, CheckCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface SortableSong {
  id: string;
  title: string;
  trackNumber: number | null;
  hasFinalVersion: boolean;
  versionCount: number;
}

interface SortableSongListProps {
  songs: SortableSong[];
  projectId: string;
  albumId: string;
  onReorder: (songIds: string[]) => Promise<void>;
}

function SortableRow({
  song,
  index,
  projectId,
}: {
  song: SortableSong;
  index: number;
  projectId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card px-3 py-3 md:py-2.5 ${
        isDragging ? "z-10 shadow-lg ring-2 ring-primary/20" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none p-2 -m-2 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-5" />
      </button>
      <span className="w-6 text-center text-sm font-mono text-muted-foreground">
        {index + 1}
      </span>
      <MusicIcon className="size-4 shrink-0 text-muted-foreground" />
      <Link
        href={`/projects/${projectId}/music/songs/${song.id}`}
        className="flex-1 truncate text-sm font-medium hover:underline"
      >
        {song.title}
      </Link>
      <div className="flex items-center gap-2">
        {song.hasFinalVersion ? (
          <Badge variant="secondary" className="gap-1">
            <CheckCircleIcon className="size-3" />
            Final
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            {song.versionCount} {song.versionCount === 1 ? "version" : "versions"}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function SortableSongList({
  songs: initialSongs,
  projectId,
  albumId,
  onReorder,
}: SortableSongListProps) {
  const [songs, setSongs] = useState(initialSongs);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = songs.findIndex((s) => s.id === active.id);
    const newIndex = songs.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(songs, oldIndex, newIndex);

    setSongs(reordered);
    setSaving(true);

    try {
      await onReorder(reordered.map((s) => s.id));
    } catch {
      setSongs(initialSongs);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={songs} strategy={verticalListSortingStrategy}>
          {songs.map((song, index) => (
            <SortableRow
              key={song.id}
              song={song}
              index={index}
              projectId={projectId}
            />
          ))}
        </SortableContext>
      </DndContext>
      {saving && (
        <p className="text-xs text-muted-foreground text-center">Saving order...</p>
      )}
    </div>
  );
}
