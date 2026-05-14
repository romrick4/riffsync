"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CoverArtUpload } from "@/components/cover-art-upload";
import { BandPageTrackPicker } from "@/components/band-page-track-picker";
import { toast } from "sonner";
import {
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  Loader2Icon,
} from "lucide-react";

interface BandPageData {
  id: string;
  isPublished: boolean;
  bio: string | null;
  contactEmail: string | null;
  heroImagePath: string | null;
  socialLinks: Record<string, string> | null;
  tracks: TrackData[];
}

interface TrackData {
  id: string;
  position: number;
  song: { id: string; title: string };
  version: { id: string; title: string; versionNumber: number } | null;
}

interface Props {
  projectId: string;
  projectSlug: string;
  heroImageUrl: string | null;
}

export function BandPageSettings({ projectId, projectSlug, heroImageUrl }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isPublished, setIsPublished] = useState(false);
  const [bio, setBio] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [spotify, setSpotify] = useState("");
  const [youtube, setYoutube] = useState("");
  const [website, setWebsite] = useState("");
  const [tracks, setTracks] = useState<TrackData[]>([]);

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/b/${projectSlug}`;
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    let cancelled = false;
    fetch(`/api/projects/${projectId}/band-page`)
      .then((res) => (res.ok ? res.json() : { bandPage: null }))
      .then((data) => {
        if (cancelled) return;
        const bp: BandPageData | null = data.bandPage;
        if (bp) {
          setIsPublished(bp.isPublished);
          setBio(bp.bio ?? "");
          setContactEmail(bp.contactEmail ?? "");
          const socials = bp.socialLinks ?? {};
          setInstagram(socials.instagram ?? "");
          setSpotify(socials.spotify ?? "");
          setYoutube(socials.youtube ?? "");
          setWebsite(socials.website ?? "");
          setTracks(bp.tracks);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const socialLinks: Record<string, string> = {};
      if (instagram.trim()) socialLinks.instagram = instagram.trim();
      if (spotify.trim()) socialLinks.spotify = spotify.trim();
      if (youtube.trim()) socialLinks.youtube = youtube.trim();
      if (website.trim()) socialLinks.website = website.trim();

      const res = await fetch(`/api/projects/${projectId}/band-page`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublished,
          bio: bio.trim() || null,
          contactEmail: contactEmail.trim() || null,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong. Try again.");
        return;
      }

      toast.success(isPublished ? "Band page is live!" : "Band page saved.");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCopyUrl() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Published toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label>Public Band Page</Label>
          <p className="text-xs text-muted-foreground">
            When on, anyone with the link can see your band page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPublished ? "default" : "secondary"}>
            {isPublished ? "Live" : "Off"}
          </Badge>
          <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        </div>
      </div>

      {isPublished && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
          <span className="min-w-0 flex-1 truncate text-sm">{publicUrl}</span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={handleCopyUrl}>
            {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            render={<a href={publicUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLinkIcon className="size-4" />
          </Button>
        </div>
      )}

      <Separator />

      {/* Hero Image */}
      <div className="space-y-1">
        <Label>Banner Image</Label>
        <p className="text-xs text-muted-foreground">
          A wide image that shows at the top of your band page.
        </p>
        <CoverArtUpload
          currentImageUrl={heroImageUrl}
          uploadUrl={`/api/projects/${projectId}/band-page/hero`}
          deleteUrl={`/api/projects/${projectId}/band-page/hero`}
          onUpdated={() => router.refresh()}
          size="lg"
        />
      </div>

      <Separator />

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="band-page-bio">Bio</Label>
        <Textarea
          id="band-page-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell people about your band..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          If left blank, your project description is used instead.
        </p>
      </div>

      <Separator />

      {/* Featured Tracks */}
      <div className="space-y-2">
        <Label>Featured Recordings</Label>
        <p className="text-xs text-muted-foreground">
          Pick songs to play on your band page. Drag to reorder.
        </p>
        <BandPageTrackPicker
          projectId={projectId}
          tracks={tracks}
          onTracksChange={setTracks}
        />
      </div>

      <Separator />

      {/* Contact */}
      <div className="space-y-4">
        <Label>Contact &amp; Links</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bp-email" className="text-xs text-muted-foreground">
              Email
            </Label>
            <Input
              id="bp-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="band@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bp-website" className="text-xs text-muted-foreground">
              Website
            </Label>
            <Input
              id="bp-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="yourband.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bp-instagram" className="text-xs text-muted-foreground">
              Instagram
            </Label>
            <Input
              id="bp-instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@yourband"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bp-spotify" className="text-xs text-muted-foreground">
              Spotify
            </Label>
            <Input
              id="bp-spotify"
              value={spotify}
              onChange={(e) => setSpotify(e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bp-youtube" className="text-xs text-muted-foreground">
              YouTube
            </Label>
            <Input
              id="bp-youtube"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder="https://youtube.com/@yourband"
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Band Page"}
      </Button>
    </form>
  );
}
