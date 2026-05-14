"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { toast } from "sonner";
import {
  GripVerticalIcon,
  MusicIcon,
  PlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  ListMusicIcon,
  LockIcon,
  StickyNoteIcon,
} from "lucide-react";

interface Version {
  id: string;
  title: string;
  versionNumber: number;
}

interface SetlistItemData {
  id: string;
  position: number;
  notes: string | null;
  song: { id: string; title: string };
  lockedVersion: Version | null;
}

interface SetlistData {
  id: string;
  name: string;
  description: string | null;
  items: SetlistItemData[];
}

interface ProjectSong {
  id: string;
  title: string;
  versions: Version[];
}

interface SetlistDetailClientProps {
  setlist: SetlistData;
  projectId: string;
  projectSongs: ProjectSong[];
  isOwner: boolean;
}

export function SetlistDetailClient({
  setlist: initialSetlist,
  projectId,
  projectSongs,
  isOwner,
}: SetlistDetailClientProps) {
  const router = useRouter();
  const [setlist, setSetlist] = useState(initialSetlist);
  const [saving, setSaving] = useState(false);

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editName, setEditName] = useState(setlist.name);
  const [editDescription, setEditDescription] = useState(
    setlist.description || "",
  );
  const [editSaving, setEditSaving] = useState(false);

  const [addSongOpen, setAddSongOpen] = useState(false);
  const [addSongSearch, setAddSongSearch] = useState("");

  const [notesItemId, setNotesItemId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  const [versionItemId, setVersionItemId] = useState<string | null>(null);
  const versionItem = versionItemId
    ? setlist.items.find((i) => i.id === versionItemId)
    : null;
  const versionSong = versionItem
    ? projectSongs.find((s) => s.id === versionItem.song.id)
    : null;

  const songIdsInSetlist = new Set(setlist.items.map((i) => i.song.id));
  const availableSongs = projectSongs.filter(
    (s) => !songIdsInSetlist.has(s.id),
  );
  const filteredAvailableSongs = addSongSearch.trim()
    ? availableSongs.filter((s) =>
        s.title.toLowerCase().includes(addSongSearch.toLowerCase()),
      )
    : availableSongs;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = setlist.items.findIndex((i) => i.id === active.id);
      const newIndex = setlist.items.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(setlist.items, oldIndex, newIndex).map(
        (item, i) => ({ ...item, position: i }),
      );

      setSetlist((prev) => ({ ...prev, items: reordered }));
      setSaving(true);

      try {
        const res = await fetch(
          `/api/projects/${projectId}/setlists/${setlist.id}/reorder`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemIds: reordered.map((i) => i.id),
            }),
          },
        );
        if (!res.ok) throw new Error();
      } catch {
        setSetlist((prev) => ({ ...prev, items: initialSetlist.items }));
        toast.error("Couldn't save the new order. Try again.");
      } finally {
        setSaving(false);
      }
    },
    [setlist.items, setlist.id, projectId, initialSetlist.items],
  );

  async function handleEditSetlist(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) return;

    setEditSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/setlists/${setlist.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName.trim(),
            description: editDescription.trim() || null,
          }),
        },
      );

      if (!res.ok) throw new Error();

      setSetlist((prev) => ({
        ...prev,
        name: editName.trim(),
        description: editDescription.trim() || null,
      }));
      setEditNameOpen(false);
      router.refresh();
    } catch {
      toast.error("Couldn't save changes. Try again.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeleteSetlist() {
    const res = await fetch(
      `/api/projects/${projectId}/setlists/${setlist.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      toast.error("Something went wrong. Try again in a moment.");
      throw new Error("delete failed");
    }
    toast.success("Setlist deleted");
    router.push(`/projects/${projectId}/setlists`);
  }

  async function handleAddSong(songId: string) {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/setlists/${setlist.id}/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }

      const newItem = await res.json();
      setSetlist((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      setAddSongOpen(false);
      setAddSongSearch("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't add that song.",
      );
    }
  }

  async function handleRemoveItem(itemId: string) {
    const prev = setlist.items;
    setSetlist((s) => ({
      ...s,
      items: s.items
        .filter((i) => i.id !== itemId)
        .map((i, idx) => ({ ...i, position: idx })),
    }));

    try {
      const res = await fetch(
        `/api/projects/${projectId}/setlists/${setlist.id}/items/${itemId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
    } catch {
      setSetlist((s) => ({ ...s, items: prev }));
      toast.error("Couldn't remove that song. Try again.");
    }
  }

  async function handleLockVersion(itemId: string, versionId: string | null) {
    const item = setlist.items.find((i) => i.id === itemId);
    if (!item) return;

    const song = projectSongs.find((s) => s.id === item.song.id);
    const newVersion = versionId
      ? song?.versions.find((v) => v.id === versionId) ?? null
      : null;

    setSetlist((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId ? { ...i, lockedVersion: newVersion } : i,
      ),
    }));
    setVersionItemId(null);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/setlists/${setlist.id}/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lockedVersionId: versionId }),
        },
      );
      if (!res.ok) throw new Error();
    } catch {
      setSetlist((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId ? { ...i, lockedVersion: item.lockedVersion } : i,
        ),
      }));
      toast.error("Couldn't update the version. Try again.");
    }
  }

  function openNotesDialog(item: SetlistItemData) {
    setNotesItemId(item.id);
    setNotesValue(item.notes || "");
  }

  async function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    if (!notesItemId) return;

    setNotesSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/setlists/${setlist.id}/items/${notesItemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notesValue.trim() || null }),
        },
      );
      if (!res.ok) throw new Error();

      setSetlist((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === notesItemId
            ? { ...i, notes: notesValue.trim() || null }
            : i,
        ),
      }));
      setNotesItemId(null);
    } catch {
      toast.error("Couldn't save notes. Try again.");
    } finally {
      setNotesSaving(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            {setlist.name}
          </h1>
          {setlist.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {setlist.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {setlist.items.length}{" "}
            {setlist.items.length === 1 ? "song" : "songs"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm">
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleEditSetlist}>
                <DialogHeader>
                  <DialogTitle>Edit Setlist</DialogTitle>
                  <DialogDescription>
                    Change the name or description for this setlist.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="edit-setlist-name"
                      className="text-sm font-medium"
                    >
                      Name
                    </label>
                    <Input
                      id="edit-setlist-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="edit-setlist-description"
                      className="text-sm font-medium"
                    >
                      Description (optional)
                    </label>
                    <Textarea
                      id="edit-setlist-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Notes about this setlist..."
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    type="submit"
                    disabled={editSaving || !editName.trim()}
                  >
                    {editSaving ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {isOwner && (
            <DeleteConfirmDialog
              title="Delete this setlist?"
              description="This removes the setlist. Your songs won't be affected."
              confirmLabel="Delete Setlist"
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon data-icon="inline-start" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              }
              onConfirm={handleDeleteSetlist}
            />
          )}
        </div>
      </div>

      {/* Add song control */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Songs</h2>
        <Dialog open={addSongOpen} onOpenChange={(open) => {
          setAddSongOpen(open);
          if (!open) setAddSongSearch("");
        }}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm">
                <PlusIcon data-icon="inline-start" />
                Add Song
              </Button>
            }
          />
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add a Song</DialogTitle>
              <DialogDescription>
                Pick a song from your band to add to this setlist.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex flex-col gap-3">
              {projectSongs.length > 5 && (
                <Input
                  placeholder="Search songs..."
                  value={addSongSearch}
                  onChange={(e) => setAddSongSearch(e.target.value)}
                  autoFocus
                />
              )}
              <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                {filteredAvailableSongs.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {availableSongs.length === 0
                      ? projectSongs.length === 0
                        ? "No songs in this band yet. Add songs in the Music tab first."
                        : "All your songs are already in this setlist."
                      : "No songs match your search."}
                  </p>
                ) : (
                  filteredAvailableSongs.map((song) => (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => handleAddSong(song.id)}
                      className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-left transition-colors hover:bg-muted active:bg-muted"
                    >
                      <MusicIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{song.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Song list */}
      {setlist.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12">
          <ListMusicIcon className="size-8 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-medium">No songs in this setlist</p>
            <p className="text-sm text-muted-foreground">
              Add songs to start building your set.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={setlist.items}
              strategy={verticalListSortingStrategy}
            >
              {setlist.items.map((item, index) => (
                <SetlistRow
                  key={item.id}
                  item={item}
                  index={index}
                  projectId={projectId}
                  projectSongs={projectSongs}
                  setVersionItemId={setVersionItemId}
                  onOpenNotes={openNotesDialog}
                  onRemove={handleRemoveItem}
                />
              ))}
            </SortableContext>
          </DndContext>
          {saving && (
            <p className="text-center text-xs text-muted-foreground">
              Saving order...
            </p>
          )}
        </div>
      )}

      {/* Notes dialog */}
      <Dialog
        open={notesItemId !== null}
        onOpenChange={(open) => {
          if (!open) setNotesItemId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveNotes}>
            <DialogHeader>
              <DialogTitle>Song Notes</DialogTitle>
              <DialogDescription>
                Add notes for this song — reminders, cues, key changes, anything
                you need on stage.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="e.g. Start with acoustic intro, key of G..."
                rows={4}
                autoFocus
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={notesSaving}>
                {notesSaving ? "Saving..." : "Save Notes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Version picker dialog */}
      <Dialog
        open={versionItemId !== null}
        onOpenChange={(open) => {
          if (!open) setVersionItemId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pick a Version</DialogTitle>
            <DialogDescription>
              Lock a specific recording for &ldquo;{versionItem?.song.title}&rdquo; in this
              setlist, or use the latest version.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto">
            <button
              type="button"
              onClick={() =>
                versionItemId && handleLockVersion(versionItemId, null)
              }
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-left transition-colors hover:bg-muted active:bg-muted ${
                !versionItem?.lockedVersion
                  ? "bg-muted font-medium"
                  : ""
              }`}
            >
              <MusicIcon className="size-4 shrink-0 text-muted-foreground" />
              Use latest version
            </button>
            {versionSong?.versions.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() =>
                  versionItemId && handleLockVersion(versionItemId, v.id)
                }
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-left transition-colors hover:bg-muted active:bg-muted ${
                  versionItem?.lockedVersion?.id === v.id
                    ? "bg-muted font-medium"
                    : ""
                }`}
              >
                <LockIcon className="size-4 shrink-0 text-muted-foreground" />
                v{v.versionNumber}: {v.title}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SetlistRow({
  item,
  index,
  projectId,
  projectSongs,
  setVersionItemId,
  onOpenNotes,
  onRemove,
}: {
  item: SetlistItemData;
  index: number;
  projectId: string;
  projectSongs: ProjectSong[];
  setVersionItemId: (id: string | null) => void;
  onOpenNotes: (item: SetlistItemData) => void;
  onRemove: (itemId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const song = projectSongs.find((s) => s.id === item.song.id);
  const hasVersions = (song?.versions.length ?? 0) > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 sm:gap-3 rounded-lg border bg-card px-2 sm:px-3 py-3 md:py-2.5 ${
        isDragging ? "z-10 shadow-lg ring-2 ring-primary/20" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none p-2 -m-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-5" />
      </button>

      <span className="w-6 text-center text-sm font-mono text-muted-foreground shrink-0">
        {index + 1}
      </span>

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <a
          href={`/projects/${projectId}/music/songs/${item.song.id}`}
          className="truncate text-sm font-medium hover:underline"
        >
          {item.song.title}
        </a>
        <div className="flex flex-wrap items-center gap-1.5">
          {item.lockedVersion ? (
            <Badge variant="secondary" className="gap-1 text-xs max-w-[10rem] sm:max-w-none">
              <LockIcon className="size-3 shrink-0" />
              <span className="truncate">
                v{item.lockedVersion.versionNumber}: {item.lockedVersion.title}
              </span>
            </Badge>
          ) : hasVersions ? (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Latest version
            </Badge>
          ) : null}
          {item.notes && (
            <Badge variant="outline" className="gap-1 text-xs text-muted-foreground max-w-[8rem] sm:max-w-48">
              <StickyNoteIcon className="size-3 shrink-0" />
              <span className="truncate">{item.notes}</span>
            </Badge>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="shrink-0 size-9 sm:size-8">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {hasVersions && (
            <DropdownMenuItem
              onClick={() => setVersionItemId(item.id)}
            >
              <LockIcon className="size-4" />
              {item.lockedVersion ? "Change version" : "Lock a version"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onOpenNotes(item)}>
            <StickyNoteIcon className="size-4" />
            {item.notes ? "Edit notes" : "Add notes"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onRemove(item.id)}
          >
            <Trash2Icon className="size-4" />
            Remove from setlist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
