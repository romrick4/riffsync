"use client";

import { useState, useMemo } from "react";
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
import { cn } from "@/lib/utils";
import type { BusyBlock, CalendarMember } from "@/components/calendar-view";
import type { MemberColor } from "@/lib/member-colors";
import { AlertTriangleIcon } from "lucide-react";

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
  busyBlocks?: BusyBlock[];
  memberColorMap?: Map<string, MemberColor>;
  members?: CalendarMember[];
}

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function timeRangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
) {
  return aStart < bEnd && aEnd > bStart;
}

export function EventDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
  editEvent,
  busyBlocks = [],
  memberColorMap,
  members = [],
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

  const conflicts = useMemo(() => {
    if (!startTime || !endTime || busyBlocks.length === 0) return [];

    const eventStart = new Date(startTime);
    const eventEnd = new Date(endTime);
    if (eventEnd <= eventStart) return [];

    const matched: { block: BusyBlock; memberName: string }[] = [];
    const seenUsers = new Set<string>();

    for (const block of busyBlocks) {
      if (seenUsers.has(block.user.id)) continue;
      const bStart = new Date(block.startTime);
      const bEnd = new Date(block.endTime);
      if (timeRangesOverlap(eventStart, eventEnd, bStart, bEnd)) {
        matched.push({
          block,
          memberName: block.user.displayName,
        });
        seenUsers.add(block.user.id);
      }
    }
    return matched;
  }, [startTime, endTime, busyBlocks]);

  const totalMembers = members.length;
  const availableCount = totalMembers - conflicts.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title || !startTime || !endTime) {
      setError("Fill in a title, start time, and end time.");
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
        setError(data.error || "Something went wrong. Try again.");
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

          {/* Conflict warning */}
          {conflicts.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-amber-300">
                    {conflicts.length === 1
                      ? "1 member has a conflict"
                      : `${conflicts.length} members have conflicts`}
                    {totalMembers > 0 && (
                      <span className="font-normal text-amber-400/80">
                        {" "}
                        — {availableCount} of {totalMembers} available
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-amber-400/80">
                    {conflicts.map(({ block, memberName }) => {
                      const color = memberColorMap?.get(block.user.id);
                      return (
                        <span key={block.user.id} className="flex items-center gap-1.5">
                          <span className={cn("size-2 rounded-full", color?.dot ?? "bg-zinc-400")} />
                          {memberName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

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
