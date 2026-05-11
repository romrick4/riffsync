"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventCard } from "@/components/event-card";
import { EventDialog } from "@/components/event-dialog";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: "REHEARSAL" | "SHOW" | "RECORDING_SESSION" | "OTHER";
  startTime: string;
  endTime: string;
  location: string | null;
  createdBy: { id: string; displayName: string; username: string };
  createdAt: string;
  rsvpCounts: { going: number; maybe: number; cant: number };
  userRsvp: "GOING" | "MAYBE" | "CANT_MAKE_IT" | null;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_TYPE_COLORS: Record<string, string> = {
  REHEARSAL: "bg-blue-500",
  SHOW: "bg-green-500",
  RECORDING_SESSION: "bg-orange-500",
  OTHER: "bg-zinc-500",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatMonthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function CalendarView({
  projectId,
  initialEvents,
  initialYear,
  initialMonth,
}: {
  projectId: string;
  initialEvents: CalendarEvent[];
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    const res = await fetch(
      `/api/projects/${projectId}/calendar?month=${formatMonthKey(year, month)}`,
    );
    if (res.ok) {
      setEvents(await res.json());
    }
  }, [projectId, year, month]);

  useEffect(() => {
    if (year !== initialYear || month !== initialMonth) {
      fetchEvents();
    }
  }, [year, month, initialYear, initialMonth, fetchEvents]);

  function prevMonth() {
    setSelectedDay(null);
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    setSelectedDay(null);
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const eventsByDay = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    const d = new Date(event.startTime).getDate();
    if (!eventsByDay.has(d)) eventsByDay.set(d, []);
    eventsByDay.get(d)!.push(event);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedEvents = selectedDay
    ? (eventsByDay.get(selectedDay) ?? [])
    : events;

  const monthLabel = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  function handleEventCreated() {
    setDialogOpen(false);
    fetchEvents();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <h2 className="min-w-[180px] text-center text-lg font-semibold">
            {monthLabel}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Add Event</Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-7">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="border-b border-border bg-muted/50 px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const isToday =
              day !== null && isSameDay(new Date(year, month, day), today);
            const isSelected = day !== null && day === selectedDay;
            const dayEvents = day ? (eventsByDay.get(day) ?? []) : [];

            return (
              <button
                key={i}
                type="button"
                disabled={day === null}
                onClick={() => day !== null && setSelectedDay(day === selectedDay ? null : day)}
                className={cn(
                  "flex min-h-[72px] flex-col items-start border-b border-r border-border p-1.5 text-left transition-colors",
                  day === null
                    ? "cursor-default bg-muted/20"
                    : "cursor-pointer hover:bg-muted/40",
                  isSelected && "bg-accent",
                  isToday && "ring-1 ring-inset ring-primary/40",
                )}
              >
                {day !== null && (
                  <>
                    <span
                      className={cn(
                        "mb-1 flex size-6 items-center justify-center rounded-full text-xs",
                        isToday &&
                          "bg-primary font-semibold text-primary-foreground",
                      )}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className={cn(
                              "size-2 rounded-full",
                              EVENT_TYPE_COLORS[ev.eventType],
                            )}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          {selectedDay
            ? `Events on ${new Date(year, month, selectedDay).toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}`
            : "All events this month"}
        </h3>
        {selectedEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No events {selectedDay ? "on this day" : "this month"}
          </p>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                projectId={projectId}
                onRsvpChange={fetchEvents}
              />
            ))}
          </div>
        )}
      </div>

      <EventDialog
        projectId={projectId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleEventCreated}
      />
    </div>
  );
}
