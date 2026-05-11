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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EVENT_TYPES = [
  { value: "REHEARSAL", label: "Rehearsal" },
  { value: "SHOW", label: "Show" },
  { value: "RECORDING_SESSION", label: "Recording Session" },
  { value: "OTHER", label: "Other" },
];

interface EventDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editEvent?: {
    id: string;
    title: string;
    description: string | null;
    eventType: string;
    startTime: string;
    endTime: string;
    location: string | null;
  };
}

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
  editEvent,
}: EventDialogProps) {
  const [title, setTitle] = useState(editEvent?.title ?? "");
  const [eventType, setEventType] = useState(
    editEvent?.eventType ?? "REHEARSAL",
  );
  const [startTime, setStartTime] = useState(
    editEvent ? toLocalDatetime(editEvent.startTime) : "",
  );
  const [endTime, setEndTime] = useState(
    editEvent ? toLocalDatetime(editEvent.endTime) : "",
  );
  const [location, setLocation] = useState(editEvent?.location ?? "");
  const [description, setDescription] = useState(
    editEvent?.description ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title || !startTime || !endTime) {
      setError("Title, start time, and end time are required");
      return;
    }

    setSubmitting(true);
    try {
      const url = editEvent
        ? `/api/projects/${projectId}/calendar/${editEvent.id}`
        : `/api/projects/${projectId}/calendar`;

      const res = await fetch(url, {
        method: editEvent ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          eventType,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          location: location || undefined,
          description: description || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      setTitle("");
      setEventType("REHEARSAL");
      setStartTime("");
      setEndTime("");
      setLocation("");
      setDescription("");
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
            {editEvent ? "Edit Event" : "Create Event"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Band practice"
            />
          </div>

          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={eventType} onValueChange={(v) => v && setEventType(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-start">Start</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">End</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-location">Location (optional)</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Studio A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Description (optional)</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this event..."
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editEvent
                  ? "Update Event"
                  : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
