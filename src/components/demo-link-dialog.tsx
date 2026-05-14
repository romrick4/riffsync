"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  Loader2Icon,
  Trash2Icon,
  ClockIcon,
  InfinityIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EXPIRY_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 0, label: "Never" },
] as const;

interface DemoLinkData {
  id: string;
  token: string;
  url: string;
  expiresAt: string;
  isExpired?: boolean;
  createdAt: string;
  songVersion: { id: string; title: string; versionNumber: number };
  song: { id: string; title: string };
  createdBy: { id: string; displayName: string };
}

interface DemoLinkDialogProps {
  projectId: string;
  songId: string;
  versionId: string;
  versionTitle: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DemoLinkDialog({
  projectId,
  songId,
  versionId,
  versionTitle,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DemoLinkDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;

  const [links, setLinks] = useState<DemoLinkData[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState(7);

  const versionLinks = links.filter(
    (l) => l.songVersion.id === versionId && !l.isExpired,
  );

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/demo-links`);
      if (res.ok) {
        setLinks(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (controlledOnOpenChange) {
        controlledOnOpenChange(nextOpen);
      } else {
        setInternalOpen(nextOpen);
      }
      if (nextOpen) fetchLinks();
    },
    [controlledOnOpenChange, fetchLinks],
  );

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/songs/${songId}/versions/${versionId}/demo-link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expiresInDays: expiryDays }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Something went wrong. Try again.");
        return;
      }
      const newLink = await res.json();
      await copyToClipboard(newLink.url, newLink.id);
      toast.success("Link created and copied!");
      fetchLinks();
    } finally {
      setCreating(false);
    }
  }, [projectId, songId, versionId, expiryDays, fetchLinks]);

  const handleRevoke = useCallback(
    async (linkId: string) => {
      const res = await fetch(
        `/api/projects/${projectId}/demo-links/${linkId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
        toast.success("Link removed.");
      } else {
        toast.error("Something went wrong. Try again.");
      }
    },
    [projectId],
  );

  async function copyToClipboard(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Couldn't copy the link. Try again.");
    }
  }

  function formatExpiry(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Expired";
    if (diffDays > 365 * 50) return "Never expires";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <ExternalLinkIcon data-icon="inline-start" />
            Demo Link
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share a demo link</DialogTitle>
          <DialogDescription>
            Anyone with this link can listen — no account needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
            <p className="truncate text-sm font-medium">{versionTitle}</p>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Expires after</p>
              <div className="flex gap-1.5">
                {EXPIRY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExpiryDays(option.value)}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      expiryDays === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={creating}
              className="w-full"
            >
              {creating ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Create and Copy Link"
              )}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : versionLinks.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Active links for this recording
              </p>
              {versionLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-mono text-muted-foreground">
                      {link.url.replace(/^https?:\/\//, "")}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {formatExpiry(link.expiresAt).includes("Never") ? (
                        <InfinityIcon className="size-3" />
                      ) : (
                        <ClockIcon className="size-3" />
                      )}
                      {formatExpiry(link.expiresAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => copyToClipboard(link.url, link.id)}
                  >
                    {copiedId === link.id ? (
                      <CheckIcon className="size-3.5 text-green-500" />
                    ) : (
                      <CopyIcon className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleRevoke(link.id)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
