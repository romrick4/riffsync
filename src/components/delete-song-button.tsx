"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

interface DeleteSongButtonProps {
  projectId: string;
  songId: string;
  albumId?: string | null;
}

export function DeleteSongButton({
  projectId,
  songId,
  albumId,
}: DeleteSongButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    const res = await fetch(
      `/api/projects/${projectId}/songs/${songId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Something went wrong. Try again in a moment.");
      throw new Error("delete failed");
    }
    toast.success("Song deleted");
    const redirectTo = albumId
      ? `/projects/${projectId}/music/albums/${albumId}`
      : `/projects/${projectId}/music`;
    router.push(redirectTo);
  }

  return (
    <DeleteConfirmDialog
      title="Delete this song?"
      description="All recordings, lyrics, and tabs for this song will be permanently deleted. This can't be undone."
      confirmLabel="Delete Song"
      trigger={
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <Trash2Icon data-icon="inline-start" />
          Delete
        </Button>
      }
      onConfirm={handleDelete}
    />
  );
}
