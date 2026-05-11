"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export function DeleteProjectButton({
  projectId,
  projectName,
}: DeleteProjectButtonProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmation === projectName;

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to delete project");
        return;
      }
      toast.success("Project deleted");
      router.push("/projects");
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        Delete Project
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. All songs, versions,
            files, and data will be deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-delete">
            Type <strong>{projectName}</strong> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={projectName}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!canDelete || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
