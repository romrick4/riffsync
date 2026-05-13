"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  LinkIcon,
} from "lucide-react";
import { getEventUrl } from "@/lib/share";
import type { CalendarEvent } from "@/components/calendar-view";

const EVENT_TYPE_LABELS: Record<string, string> = {
  REHEARSAL: "Rehearsal",
  SHOW: "Show",
  RECORDING_SESSION: "Recording",
  OTHER: "Other",
};

const EVENT_TYPE_BADGE_CLASSES: Record<string, string> = {
  REHEARSAL: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  SHOW: "bg-green-500/15 text-green-400 border-green-500/25",
  RECORDING_SESSION: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  OTHER: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
};

const RSVP_OPTIONS = [
  { value: "GOING", label: "Going" },
  { value: "MAYBE", label: "Maybe" },
  { value: "CANT_MAKE_IT", label: "Can't" },
] as const;

function formatTime(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export function EventCard({
  event,
  projectId,
  currentUserId,
  isOwner,
  highlight,
  onRsvpChange,
  onEdit,
  onDataChange,
}: {
  event: CalendarEvent;
  projectId: string;
  currentUserId: string;
  isOwner: boolean;
  highlight?: boolean;
  onRsvpChange: () => void;
  onEdit: () => void;
  onDataChange: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const canDelete = isOwner || event.createdBy.id === currentUserId;
  const isShow = event.eventType === "SHOW";
  const cardRef = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState(highlight);

  useEffect(() => {
    if (highlight && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const timeout = setTimeout(() => setHighlighted(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [highlight]);

  async function handleRsvp(status: string) {
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/calendar/${event.id}/rsvp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Something went wrong. Try again.");
        return;
      }
      onRsvpChange();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(
      `/api/projects/${projectId}/calendar/${event.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Something went wrong. Try again.");
      throw new Error("delete failed");
    }
    toast.success("Event deleted");
    onDataChange();
  }

  return (
    <Card
      ref={cardRef}
      className={cn(
        "transition-all duration-500",
        isShow && "border-green-500/30 bg-green-500/[0.03]",
        highlighted && "ring-2 ring-primary/60 shadow-lg shadow-primary/10",
      )}
    >
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              {isShow && <StarIcon className="size-4 shrink-0 fill-green-400 text-green-400" />}
              <h4 className={cn("truncate font-medium", isShow && "text-green-300")}>
                {event.title}
              </h4>
              <Badge
                className={cn(
                  "shrink-0 border",
                  EVENT_TYPE_BADGE_CLASSES[event.eventType],
                )}
              >
                {EVENT_TYPE_LABELS[event.eventType]}
              </Badge>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground">
                {event.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                const url = `${window.location.origin}${getEventUrl(projectId, event.id)}`;
                navigator.clipboard.writeText(url);
                toast.success("Link copied!");
              }}
            >
              <LinkIcon className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onEdit}>
              <PencilIcon className="size-3.5" />
            </Button>
            {canDelete && (
              <DeleteConfirmDialog
                title="Delete this event?"
                description="This event and all RSVPs will be permanently removed. This can't be undone."
                confirmLabel="Delete Event"
                trigger={
                  <Button variant="ghost" size="icon-sm">
                    <TrashIcon className="size-3.5" />
                  </Button>
                }
                onConfirm={handleDelete}
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            {formatDate(event.startTime)}
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            {formatTime(event.startTime)} – {formatTime(event.endTime)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="size-3.5" />
              {event.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <UsersIcon className="size-3.5" />
            {event.rsvpCounts.going} going · {event.rsvpCounts.maybe} maybe ·{" "}
            {event.rsvpCounts.cant} can&apos;t
          </span>
        </div>

        <div className="flex gap-2">
          {RSVP_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={event.userRsvp === opt.value ? "default" : "outline"}
              size="sm"
              disabled={submitting}
              onClick={() => handleRsvp(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
