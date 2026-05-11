"use client";

import { useState, type FormEvent } from "react";
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
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

export function JoinProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projects/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to join project");
        return;
      }

      setOpen(false);
      setInviteCode("");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <UserPlus className="size-4" data-icon="inline-start" />
        Join Project
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Join a project</DialogTitle>
            <DialogDescription>
              Enter the invite code shared by your bandmate.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                placeholder="e.g. a1b2c3d4"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                className="font-mono"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Joining…" : "Join Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
