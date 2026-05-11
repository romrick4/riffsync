"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

interface BusyBlockDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editBlock?: {
    id: string;
    startTime: string;
    endTime: string;
    note: string | null;
  };
}

export function BusyBlockDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
  editBlock,
}: BusyBlockDialogProps) {
  const [startTime, setStartTime] = useState(
    editBlock ? toLocalDatetime(editBlock.startTime) : "",
  );
  const [endTime, setEndTime] = useState(
    editBlock ? toLocalDatetime(editBlock.endTime) : "",
  );
  const [note, setNote] = useState(editBlock?.note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!startTime || !endTime) {
      setError("Pick a start and end time.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      setError("The end time needs to be after the start time.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editBlock
        ? `/api/projects/${projectId}/calendar/busy/${editBlock.id}`
        : `/api/projects/${projectId}/calendar/busy`;

      const res = await fetch(url, {
        method: editBlock ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          note: note || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Try again.");
        return;
      }

      setStartTime("");
      setEndTime("");
      setNote("");
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editBlock ? "Edit Busy Time" : "Mark Busy"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="busy-start">From</Label>
              <Input
                id="busy-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="busy-end">Until</Label>
              <Input
                id="busy-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="busy-note">Note (optional)</Label>
            <Input
              id="busy-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. out of town, dentist..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editBlock
                  ? "Update"
                  : "Mark Busy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
