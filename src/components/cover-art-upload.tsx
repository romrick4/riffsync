"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, UploadIcon, XIcon } from "lucide-react";

interface CoverArtUploadProps {
  currentPath: string | null;
  uploadUrl: string;
  deleteUrl: string;
  onUpdated: (path: string | null) => void;
  size?: "sm" | "lg";
}

export function CoverArtUpload({
  currentPath,
  uploadUrl,
  deleteUrl,
  onUpdated,
  size = "lg",
}: CoverArtUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = size === "lg" ? "size-48" : "size-24";
  const iconSize = size === "lg" ? "size-10" : "size-5";

  const imageUrl = currentPath
    ? `/api/files/${encodeURIComponent(currentPath)}`
    : null;

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onUpdated(data.coverArtPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setUploading(true);
    try {
      await fetch(deleteUrl, { method: "DELETE" });
      onUpdated(null);
    } catch {
      setError("Failed to remove");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`group relative ${sizeClasses} overflow-hidden rounded-lg border bg-muted`}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Cover art"
              className="size-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                size="icon-xs"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <UploadIcon className="size-3" />
              </Button>
              <Button
                size="icon-xs"
                variant="secondary"
                onClick={handleRemove}
                disabled={uploading}
              >
                <XIcon className="size-3" />
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            <ImageIcon className={iconSize} />
            {size === "lg" && (
              <span className="text-xs">
                {uploading ? "Uploading..." : "Upload cover art"}
              </span>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {size === "lg" && (
        <p className="text-xs text-muted-foreground">
          JPG, PNG, or WebP. Recommended 3000x3000px.
        </p>
      )}
    </div>
  );
}
