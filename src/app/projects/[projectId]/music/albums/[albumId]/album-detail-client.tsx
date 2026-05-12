"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CoverArtUpload } from "@/components/cover-art-upload";
import { SortableSongList } from "@/components/sortable-song-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { NewSongDialog } from "@/components/new-song-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { toast } from "sonner";
import {
  DownloadIcon,
  PlusIcon,
  SettingsIcon,
  AlertTriangleIcon,
  MusicIcon,
  Trash2Icon,
} from "lucide-react";

interface AlbumSong {
  id: string;
  title: string;
  trackNumber: number | null;
  hasFinalVersion: boolean;
  versionCount: number;
}

interface AlbumData {
  id: string;
  title: string;
  description: string | null;
  coverArtPath: string | null;
  coverArtUrl: string | null;
  releaseDate: string | null;
  genre: string | null;
  secondaryGenre: string | null;
  artistName: string | null;
  upc: string | null;
  isExplicit: boolean;
  language: string;
  songs: AlbumSong[];
}

interface AlbumDetailClientProps {
  album: AlbumData;
  projectId: string;
  projectName: string;
  unassignedSongs: { id: string; title: string }[];
  isOwner: boolean;
}

export function AlbumDetailClient({
  album: initialAlbum,
  projectId,
  projectName,
  unassignedSongs: initialUnassigned,
  isOwner,
}: AlbumDetailClientProps) {
  const router = useRouter();
  const [album, setAlbum] = useState(initialAlbum);
  const [unassigned, setUnassigned] = useState(initialUnassigned);
  const [addSongOpen, setAddSongOpen] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);

  // Metadata form state
  const [metaTitle, setMetaTitle] = useState(album.title);
  const [metaDescription, setMetaDescription] = useState(album.description || "");
  const [metaArtist, setMetaArtist] = useState(album.artistName || "");
  const [metaGenre, setMetaGenre] = useState(album.genre || "");
  const [metaSecondaryGenre, setMetaSecondaryGenre] = useState(album.secondaryGenre || "");
  const [metaUpc, setMetaUpc] = useState(album.upc || "");
  const [metaLanguage, setMetaLanguage] = useState(album.language);
  const [metaReleaseDate, setMetaReleaseDate] = useState(
    album.releaseDate ? album.releaseDate.split("T")[0] : "",
  );
  const [metaExplicit, setMetaExplicit] = useState(album.isExplicit);
  const [metaSaving, setMetaSaving] = useState(false);
  const [deleteSongsChecked, setDeleteSongsChecked] = useState(false);

  const songsWithoutFinal = album.songs.filter((s) => !s.hasFinalVersion);
  const allReady = album.songs.length > 0 && songsWithoutFinal.length === 0 && album.coverArtPath;

  const handleReorder = useCallback(
    async (songIds: string[]) => {
      await fetch(
        `/api/projects/${projectId}/albums/${album.id}/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songIds }),
        },
      );
      setAlbum((prev) => ({
        ...prev,
        songs: songIds.map((id, i) => {
          const song = prev.songs.find((s) => s.id === id)!;
          return { ...song, trackNumber: i + 1 };
        }),
      }));
    },
    [projectId, album.id],
  );

  async function handleAddSong(songId: string) {
    const trackNumber = album.songs.length + 1;
    const res = await fetch(
      `/api/projects/${projectId}/songs/${songId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: album.id, trackNumber }),
      },
    );

    if (res.ok) {
      const added = unassigned.find((s) => s.id === songId);
      if (added) {
        setAlbum((prev) => ({
          ...prev,
          songs: [
            ...prev.songs,
            {
              id: added.id,
              title: added.title,
              trackNumber,
              hasFinalVersion: false,
              versionCount: 0,
            },
          ],
        }));
        setUnassigned((prev) => prev.filter((s) => s.id !== songId));
      }
      setAddSongOpen(false);
      router.refresh();
    }
  }

  async function handleSaveMetadata() {
    setMetaSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/albums/${album.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: metaTitle.trim(),
            description: metaDescription.trim() || null,
            artistName: metaArtist.trim() || null,
            genre: metaGenre.trim() || null,
            secondaryGenre: metaSecondaryGenre.trim() || null,
            upc: metaUpc.trim() || null,
            language: metaLanguage.trim(),
            isExplicit: metaExplicit,
            releaseDate: metaReleaseDate || null,
          }),
        },
      );

      if (res.ok) {
        const updated = await res.json();
        setAlbum((prev) => ({
          ...prev,
          title: updated.title,
          description: updated.description,
          artistName: updated.artistName,
          genre: updated.genre,
          secondaryGenre: updated.secondaryGenre,
          upc: updated.upc,
          language: updated.language,
          isExplicit: updated.isExplicit,
          releaseDate: updated.releaseDate,
        }));
        setMetadataOpen(false);
        router.refresh();
      }
    } finally {
      setMetaSaving(false);
    }
  }

  async function handleDeleteAlbum() {
    const qs = deleteSongsChecked ? "?deleteSongs=true" : "";
    const res = await fetch(
      `/api/projects/${projectId}/albums/${album.id}${qs}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Something went wrong. Try again in a moment.");
      throw new Error("delete failed");
    }
    toast.success("Album deleted");
    router.push(`/projects/${projectId}/music`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Album header with cover art */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <CoverArtUpload
          currentImageUrl={album.coverArtUrl}
          uploadUrl={`/api/projects/${projectId}/albums/${album.id}/cover-art`}
          deleteUrl={`/api/projects/${projectId}/albums/${album.id}/cover-art`}
          onUpdated={(url) =>
            setAlbum((prev) => ({ ...prev, coverArtUrl: url }))
          }
          size="lg"
        />

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Album</Badge>
            {album.genre && <Badge variant="outline">{album.genre}</Badge>}
            {album.isExplicit && <Badge variant="outline">Explicit</Badge>}
            {allReady && <Badge>Distribution Ready</Badge>}
          </div>

          {album.description && (
            <p className="text-sm text-muted-foreground">{album.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{album.songs.length} {album.songs.length === 1 ? "song" : "songs"}</span>
            {album.artistName && <span>by {album.artistName}</span>}
            {album.releaseDate && (
              <span>
                Release: {new Date(album.releaseDate).toLocaleDateString("en-US")}
              </span>
            )}
            {album.upc && <span>UPC: {album.upc}</span>}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Dialog open={metadataOpen} onOpenChange={setMetadataOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm">
                    <SettingsIcon data-icon="inline-start" />
                    Metadata
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Album Metadata</DialogTitle>
                  <DialogDescription>
                    Set distribution metadata for this album. These fields are used when downloading for distribution.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="meta-title">Album Title</Label>
                    <Input
                      id="meta-title"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="meta-artist">Artist Name</Label>
                    <Input
                      id="meta-artist"
                      placeholder={projectName}
                      value={metaArtist}
                      onChange={(e) => setMetaArtist(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="meta-genre">Genre</Label>
                    <Input
                      id="meta-genre"
                      placeholder="e.g. Rock"
                      value={metaGenre}
                      onChange={(e) => setMetaGenre(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="meta-secondary-genre">Secondary Genre</Label>
                    <Input
                      id="meta-secondary-genre"
                      placeholder="e.g. Alternative"
                      value={metaSecondaryGenre}
                      onChange={(e) => setMetaSecondaryGenre(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="meta-release-date">Release Date</Label>
                    <Input
                      id="meta-release-date"
                      type="date"
                      value={metaReleaseDate}
                      onChange={(e) => setMetaReleaseDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="meta-language">Language</Label>
                    <Input
                      id="meta-language"
                      value={metaLanguage}
                      onChange={(e) => setMetaLanguage(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="meta-upc">UPC</Label>
                    <Input
                      id="meta-upc"
                      placeholder="Optional"
                      value={metaUpc}
                      onChange={(e) => setMetaUpc(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 self-end">
                    <input
                      type="checkbox"
                      id="meta-explicit"
                      checked={metaExplicit}
                      onChange={(e) => setMetaExplicit(e.target.checked)}
                      className="size-4 rounded border"
                    />
                    <Label htmlFor="meta-explicit">Explicit Content</Label>
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="meta-description">Description</Label>
                    <Textarea
                      id="meta-description"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Notes about this album..."
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button onClick={handleSaveMetadata} disabled={metaSaving}>
                    {metaSaving ? "Saving..." : "Save Metadata"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <a
              href={`/api/projects/${projectId}/albums/${album.id}/download`}
              download
            >
              <Button variant="outline" size="sm" disabled={album.songs.length === 0}>
                <DownloadIcon data-icon="inline-start" />
                Download for Distribution
              </Button>
            </a>

            {isOwner && (
              <DeleteConfirmDialog
                title="Delete this album?"
                description="This will permanently delete the album. This can't be undone."
                confirmLabel="Delete Album"
                trigger={
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                    <Trash2Icon data-icon="inline-start" />
                    Delete
                  </Button>
                }
                onConfirm={handleDeleteAlbum}
              >
                {album.songs.length > 0 && (
                  <label className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteSongsChecked}
                      onChange={(e) => setDeleteSongsChecked(e.target.checked)}
                      className="mt-0.5 size-4 rounded border accent-destructive"
                    />
                    <span>
                      <span className="font-medium">Also delete all {album.songs.length} {album.songs.length === 1 ? "song" : "songs"} in this album</span>
                      <br />
                      <span className="text-muted-foreground">
                        All recordings, lyrics, and tabs for these songs will be gone forever. If unchecked, the songs will become singles.
                      </span>
                    </span>
                  </label>
                )}
              </DeleteConfirmDialog>
            )}
          </div>
        </div>
      </div>

      {/* Distribution warnings */}
      {album.songs.length > 0 && !allReady && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="flex flex-col gap-1">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Not ready for distribution
            </p>
            <ul className="text-muted-foreground">
              {!album.coverArtPath && <li>Missing cover art (3000x3000 JPG recommended)</li>}
              {songsWithoutFinal.map((s) => (
                <li key={s.id}>&quot;{s.title}&quot; has no final version</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tracklist */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Tracklist</h2>
          <div className="flex flex-wrap gap-2">
            <NewSongDialog
              projectId={projectId}
              albumId={album.id}
              onCreated={(song) => {
                setAlbum((prev) => ({
                  ...prev,
                  songs: [
                    ...prev.songs,
                    {
                      id: song.id,
                      title: song.title,
                      trackNumber: prev.songs.length + 1,
                      hasFinalVersion: false,
                      versionCount: 0,
                    },
                  ],
                }));
              }}
            />
            {unassigned.length > 0 && (
              <Dialog open={addSongOpen} onOpenChange={setAddSongOpen}>
                <DialogTrigger
                  render={
                    <Button variant="outline" size="sm">
                      <PlusIcon data-icon="inline-start" />
                      Add Existing Song
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Add Song to Album</DialogTitle>
                    <DialogDescription>
                      Select an unassigned single to add to this album.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 flex max-h-64 flex-col gap-1 overflow-y-auto">
                    {unassigned.map((song) => (
                      <button
                        key={song.id}
                        type="button"
                        onClick={() => handleAddSong(song.id)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors hover:bg-muted"
                      >
                        <MusicIcon className="size-4 text-muted-foreground" />
                        {song.title}
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {album.songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12">
            <MusicIcon className="size-8 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">No songs in this album</p>
              <p className="text-sm text-muted-foreground">
                Add existing singles or create new songs to build your tracklist.
              </p>
            </div>
          </div>
        ) : (
          <SortableSongList
            songs={album.songs}
            projectId={projectId}
            albumId={album.id}
            onReorder={handleReorder}
          />
        )}
      </div>
    </div>
  );
}
