"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CoverArtUpload } from "@/components/cover-art-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveIcon } from "lucide-react";

interface SongMetadataClientProps {
  projectId: string;
  songId: string;
  coverArtUrl: string | null;
  isExplicit: boolean;
  language: string;
  isrc: string | null;
  featuredArtists: string | null;
  songwriters: string | null;
}

export function SongMetadataClient({
  projectId,
  songId,
  coverArtUrl: initialCoverArt,
  isExplicit: initialExplicit,
  language: initialLanguage,
  isrc: initialIsrc,
  featuredArtists: initialFeatured,
  songwriters: initialSongwriters,
}: SongMetadataClientProps) {
  const router = useRouter();
  const [coverArtUrl, setCoverArtUrl] = useState(initialCoverArt);
  const [isExplicit, setIsExplicit] = useState(initialExplicit);
  const [language, setLanguage] = useState(initialLanguage);
  const [isrc, setIsrc] = useState(initialIsrc || "");
  const [featuredArtists, setFeaturedArtists] = useState(initialFeatured || "");
  const [songwriters, setSongwriters] = useState(initialSongwriters || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/songs/${songId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isExplicit,
            language: language.trim(),
            isrc: isrc.trim() || null,
            featuredArtists: featuredArtists.trim() || null,
            songwriters: songwriters.trim() || null,
          }),
        },
      );
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <CoverArtUpload
          currentImageUrl={coverArtUrl}
          uploadUrl={`/api/projects/${projectId}/songs/${songId}/cover-art`}
          deleteUrl={`/api/projects/${projectId}/songs/${songId}/cover-art`}
          onUpdated={(url) => {
            setCoverArtUrl(url);
            router.refresh();
          }}
          size="lg"
        />

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="song-featured">Featured Artists</Label>
            <Input
              id="song-featured"
              placeholder="e.g. Artist Name, Another Artist"
              value={featuredArtists}
              onChange={(e) => setFeaturedArtists(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="song-songwriters">Songwriters</Label>
            <Input
              id="song-songwriters"
              placeholder="e.g. John Doe, Jane Smith"
              value={songwriters}
              onChange={(e) => setSongwriters(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="song-isrc">ISRC</Label>
          <Input
            id="song-isrc"
            placeholder="e.g. USRC17607839"
            value={isrc}
            onChange={(e) => setIsrc(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            International Standard Recording Code
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="song-language">Language</Label>
          <Input
            id="song-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 self-end pb-6">
          <input
            type="checkbox"
            id="song-explicit"
            checked={isExplicit}
            onChange={(e) => setIsExplicit(e.target.checked)}
            className="size-4 rounded border"
          />
          <Label htmlFor="song-explicit">Explicit Content</Label>
        </div>
      </div>

      <div>
        <Button onClick={handleSave} disabled={saving}>
          <SaveIcon data-icon="inline-start" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Details"}
        </Button>
      </div>
    </div>
  );
}
