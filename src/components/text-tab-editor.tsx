"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileTextIcon,
  UploadIcon,
  ImageIcon,
  DownloadIcon,
  PencilIcon,
  Trash2Icon,
  SaveIcon,
  XIcon,
  Loader2Icon,
  FileIcon,
} from "lucide-react";

interface TabFile {
  id: string;
  title: string;
  fileType: string;
  textContent: string | null;
  filePath: string | null;
  createdAt: string;
  uploadedBy: { displayName: string };
}

interface TextTabEditorProps {
  songId: string;
  projectId: string;
  tabs: TabFile[];
}

const TAB_FILE_EXTENSIONS = ".gp,.gp5,.gpx,.gp7,.png,.jpg,.jpeg,.gif,.webp";
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

function getFileExtension(name: string): string {
  return name.substring(name.lastIndexOf(".")).toLowerCase();
}

function isImageFile(filePath: string | null): boolean {
  if (!filePath) return false;
  return IMAGE_EXTENSIONS.includes(getFileExtension(filePath));
}

export function TextTabEditor({ songId, projectId, tabs }: TextTabEditorProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleSaveEdit(tabId: string) {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/songs/${songId}/tabs/${tabId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ textContent: editContent }),
        }
      );
      if (!res.ok) throw new Error("Failed to save");
      setEditingId(null);
      router.refresh();
    } catch {
      // error handled silently, user sees no change
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tabId: string) {
    if (!confirm("Delete this tab file?")) return;
    setDeleting(tabId);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/songs/${songId}/tabs/${tabId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch {
      // error handled silently
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <AddTextTabDialog projectId={projectId} songId={songId} />
        <UploadTabFileDialog projectId={projectId} songId={songId} />
      </div>

      {tabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16">
          <FileTextIcon className="size-10 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-medium">No tabs yet</p>
            <p className="text-sm text-muted-foreground">
              Write a text tab or upload a Guitar Pro / image file.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tabs.map((tab) => (
            <Card key={tab.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {tab.fileType === "TEXT_TAB" && (
                    <FileTextIcon className="size-4 text-muted-foreground" />
                  )}
                  {tab.fileType === "IMAGE" && (
                    <ImageIcon className="size-4 text-muted-foreground" />
                  )}
                  {tab.fileType === "GUITAR_PRO" && (
                    <FileIcon className="size-4 text-muted-foreground" />
                  )}
                  {tab.title}
                </CardTitle>
                <CardAction className="flex items-center gap-1">
                  <Badge variant="outline">
                    {tab.fileType === "TEXT_TAB"
                      ? "Text"
                      : tab.fileType === "IMAGE"
                        ? "Image"
                        : "Guitar Pro"}
                  </Badge>
                  {tab.fileType === "TEXT_TAB" && editingId !== tab.id && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setEditingId(tab.id);
                        setEditContent(tab.textContent || "");
                      }}
                    >
                      <PencilIcon />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(tab.id)}
                    disabled={deleting === tab.id}
                  >
                    {deleting === tab.id ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <Trash2Icon />
                    )}
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {tab.fileType === "TEXT_TAB" && (
                  <>
                    {editingId === tab.id ? (
                      <div className="flex flex-col gap-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[200px] font-mono text-sm leading-tight"
                          style={{ tabSize: 4 }}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(tab.id)}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2Icon
                                className="animate-spin"
                                data-icon="inline-start"
                              />
                            ) : (
                              <SaveIcon data-icon="inline-start" />
                            )}
                            {saving ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <pre className="overflow-x-auto whitespace-pre rounded-md bg-muted/30 p-4 font-mono text-sm leading-tight text-foreground/90">
                        {tab.textContent}
                      </pre>
                    )}
                  </>
                )}

                {tab.fileType === "IMAGE" && tab.filePath && (
                  <div className="overflow-hidden rounded-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/projects/${projectId}/songs/${songId}/tabs/${tab.id}/file`}
                      alt={tab.title}
                      className="max-w-full"
                    />
                  </div>
                )}

                {tab.fileType === "GUITAR_PRO" && (
                  <div className="flex items-center gap-3 rounded-md bg-muted/30 p-4">
                    <FileIcon className="size-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Guitar Pro file
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Download to view in Guitar Pro or similar software
                      </p>
                    </div>
                    <a
                      href={`/api/projects/${projectId}/songs/${songId}/tabs/${tab.id}/file`}
                      download
                    >
                      <Button variant="outline" size="sm">
                        <DownloadIcon data-icon="inline-start" />
                        Download
                      </Button>
                    </a>
                  </div>
                )}

                <div className="mt-2 text-xs text-muted-foreground">
                  Uploaded by {tab.uploadedBy.displayName} on{" "}
                  {new Date(tab.createdAt).toLocaleDateString("en-US")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddTextTabDialog({
  projectId,
  songId,
}: {
  projectId: string;
  songId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/songs/${songId}/tabs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            fileType: "TEXT_TAB",
            textContent: content,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setTitle("");
      setContent("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setError(null);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline">
            <FileTextIcon data-icon="inline-start" />
            Write Text Tab
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Write Text Tab</DialogTitle>
            <DialogDescription>
              Write tablature using plain text. Use monospaced formatting for
              alignment.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tab-title">Title</Label>
              <Input
                id="tab-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Intro Riff, Main Solo"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tab-content">Tab Content</Label>
              <Textarea
                id="tab-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`e|---0---0---|\nB|---1---1---|\nG|---0---0---|\nD|---2---2---|\nA|---3---3---|\nE|-----------|`}
                className="min-h-[200px] font-mono text-sm leading-tight"
                style={{ tabSize: 4 }}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={saving || !title.trim() || !content.trim()}>
              {saving ? "Saving..." : "Save Tab"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadTabFileDialog({
  projectId,
  songId,
}: {
  projectId: string;
  songId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function getFileType(fileName: string): "GUITAR_PRO" | "IMAGE" | null {
    const ext = getFileExtension(fileName);
    if ([".gp", ".gp5", ".gpx", ".gp7"].includes(ext)) return "GUITAR_PRO";
    if (IMAGE_EXTENSIONS.includes(ext)) return "IMAGE";
    return null;
  }

  function handleFileSelect(f: File) {
    const fileType = getFileType(f.name);
    if (!fileType) {
      setError(
        "Unsupported file type. Use Guitar Pro (.gp, .gp5, .gpx, .gp7) or image files (.png, .jpg, .gif, .webp)"
      );
      return;
    }
    setFile(f);
    setError(null);
    if (!title.trim()) {
      setTitle(f.name.replace(/\.[^.]+$/, ""));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;

    const fileType = getFileType(file.name);
    if (!fileType) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("fileType", fileType);
      formData.append("file", file);

      const res = await fetch(
        `/api/projects/${projectId}/songs/${songId}/tabs`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setFile(null);
      setTitle("");
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
        }
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <UploadIcon data-icon="inline-start" />
            Upload File
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Tab File</DialogTitle>
            <DialogDescription>
              Upload a Guitar Pro file or image of sheet music / tabs.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
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
                accept={TAB_FILE_EXTENSIONS}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              {file ? (
                <div className="flex items-center gap-3">
                  {isImageFile(file.name) ? (
                    <ImageIcon className="size-8 text-muted-foreground" />
                  ) : (
                    <FileIcon className="size-8 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
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
                      Drop file here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Guitar Pro (.gp, .gp5, .gpx, .gp7) or images (.png, .jpg,
                      .gif, .webp)
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="upload-tab-title">Title</Label>
              <Input
                id="upload-tab-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tab title"
                required
              />
            </div>

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
