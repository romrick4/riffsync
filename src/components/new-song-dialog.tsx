"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";

export function NewSongDialog({
  projectId,
  albumId,
  albums,
  onCreated,
}: {
  projectId: string;
  albumId?: string;
  albums?: { id: string; title: string }[];
  onCreated?: (song: { id: string; title: string }) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showAlbumPicker = !albumId && albums && albums.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          albumId: albumId || selectedAlbumId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create song");
      }

      const song = await res.json();
      setTitle("");
      setDescription("");
      setSelectedAlbumId("");
      setOpen(false);
      onCreated?.(song);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon data-icon="inline-start" />
            New Song
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Song</DialogTitle>
            <DialogDescription>
              Add a new song to start tracking versions and lyrics.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="song-title">Title</Label>
              <Input
                id="song-title"
                placeholder="Song title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="song-description">Description (optional)</Label>
              <Textarea
                id="song-description"
                placeholder="Notes about this song..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {showAlbumPicker && (
              <div className="flex flex-col gap-2">
                <Label>Add to album</Label>
                <Select
                  value={selectedAlbumId}
                  onValueChange={(val) => setSelectedAlbumId(val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Single (no album)">
                      {selectedAlbumId
                        ? albums.find((a) => a.id === selectedAlbumId)?.title
                        : "Single (no album)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Single (no album)</SelectItem>
                    {albums.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? "Creating..." : "Create Song"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
