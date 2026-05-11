"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react";
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
  return new Intl.DateTimeFormat("default", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("default", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export function EventCard({
  event,
  projectId,
  onRsvpChange,
}: {
  event: CalendarEvent;
  projectId: string;
  onRsvpChange: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleRsvp(status: string) {
    setSubmitting(true);
    try {
      await fetch(
        `/api/projects/${projectId}/calendar/${event.id}/rsvp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      onRsvpChange();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-medium">{event.title}</h4>
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
