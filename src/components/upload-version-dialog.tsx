"use client";

import { useState, useRef, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadIcon, FileAudioIcon, XIcon, InfoIcon, HelpCircleIcon } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface Version {
  id: string;
  title: string;
  versionNumber: number;
}

interface UploadVersionDialogProps {
  projectId: string;
  songId: string;
  existingVersions: Version[];
  defaultParentVersionId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ACCEPTED_TYPES = ["audio/wav", "audio/x-wav", "audio/flac", "audio/mpeg", "audio/mp3"];
const ACCEPTED_EXTENSIONS = [".wav", ".flac", ".mp3"];
const MAX_SIZE = 200 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getLatestVersionId(versions: Version[]): string {
  if (versions.length === 0) return "";
  return versions.reduce((a, b) =>
    a.versionNumber > b.versionNumber ? a : b
  ).id;
}

export function UploadVersionDialog({
  projectId,
  songId,
  existingVersions,
  defaultParentVersionId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: UploadVersionDialogProps) {
  const router = useRouter();
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(value);
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, controlledOnOpenChange]
  );

  const resolvedDefault = defaultParentVersionId ?? getLatestVersionId(existingVersions);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [parentVersionId, setParentVersionId] = useState<string>(resolvedDefault);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prevOpenRef = useRef(false);
  if (open && !prevOpenRef.current) {
    setParentVersionId(defaultParentVersionId ?? getLatestVersionId(existingVersions));
  }
  prevOpenRef.current = open;

  function validateFile(f: File): string | null {
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return "Unsupported format. Please upload a .wav, .flac, or .mp3 file.";
    }
    if (f.size > MAX_SIZE) {
      return `File is too large (${formatFileSize(f.size)}). Max 200MB.`;
    }
    return null;
  }

  function handleFileSelect(f: File) {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFile(f);
    setError(null);
    if (!title.trim()) {
      const nameWithoutExt = f.name.replace(/\.[^.]+$/, "");
      setTitle(nameWithoutExt);
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title]
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      if (description.trim()) formData.append("description", description.trim());
      if (parentVersionId) formData.append("parentVersionId", parentVersionId);

      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || "Upload failed"));
            } catch {
              reject(new Error("Upload failed"));
            }
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open(
          "POST",
          `/api/projects/${projectId}/songs/${songId}/versions`
        );
        xhr.send(formData);
      });

      setFile(null);
      setTitle("");
      setDescription("");
      setParentVersionId(resolvedDefault);
      setProgress(0);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setFile(null);
          setError(null);
          setProgress(0);
          setParentVersionId(resolvedDefault);
        }
      }}
    >
      {!isControlled && (
        <DialogTrigger
          render={
            <Button>
              <UploadIcon data-icon="inline-start" />
              Upload Version
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload New Version</DialogTitle>
            <DialogDescription>
              Upload an audio file (.wav, .flac, or .mp3). Max 200MB.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : file
                    ? "border-muted-foreground/30 bg-muted/30"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".wav,.flac,.mp3,audio/wav,audio/flac,audio/mpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              {file ? (
                <div className="flex items-center gap-3">
                  <FileAudioIcon className="size-8 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <XIcon />
                  </Button>
                </div>
              ) : (
                <>
                  <UploadIcon className="size-8 text-muted-foreground/50" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drop audio file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      WAV, FLAC, or MP3 up to 200MB
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="version-title">Title</Label>
              <Input
                id="version-title"
                placeholder="Version title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="version-description">
                Description (optional)
              </Label>
              <Textarea
                id="version-description"
                placeholder="Notes about this version..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {existingVersions.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label>Continues from</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={<HelpCircleIcon className="size-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />}
                      />
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="font-medium mb-1">Which version is this based on?</p>
                        <p>Pick the version you&apos;re iterating on to keep a clear revision history. Choose &quot;None&quot; only if this is a completely fresh take that wasn&apos;t derived from any existing version.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={parentVersionId}
                  onValueChange={(val) => setParentVersionId(val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a parent version...">
                      {parentVersionId === ""
                        ? "None \u2014 start new branch"
                        : (() => {
                            const v = existingVersions.find((v) => v.id === parentVersionId);
                            return v ? `v${v.versionNumber} \u2014 ${v.title}` : "Select a parent version...";
                          })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None &mdash; start new branch</SelectItem>
                    {existingVersions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        v{v.versionNumber} &mdash; {v.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {parentVersionId === "" && (
                  <div className="flex gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                    <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      This version won&apos;t be linked to any existing version
                      and will appear as a separate branch in the version history.
                    </span>
                  </div>
                )}
              </div>
            )}

            {uploading && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={uploading || !file || !title.trim()}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
