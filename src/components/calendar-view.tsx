"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildMemberColorMap } from "@/lib/member-colors";
import { EventCard } from "@/components/event-card";
import { EventDialog } from "@/components/event-dialog";
import { BusyBlockDialog } from "@/components/busy-block-dialog";

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

export interface BusyBlock {
  id: string;
  startTime: string;
  endTime: string;
  note: string | null;
  user: { id: string; displayName: string; username: string };
}

export interface CalendarMember {
  userId: string;
  displayName: string;
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

function dateSpansDay(start: Date, end: Date, year: number, month: number, day: number) {
  const dayStart = new Date(year, month, day);
  const dayEnd = new Date(year, month, day, 23, 59, 59, 999);
  return start <= dayEnd && end >= dayStart;
}

function formatTime(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function formatShortDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export function CalendarView({
  projectId,
  currentUserId,
  isOwner,
  members,
  initialEvents,
  initialBusyBlocks,
  initialYear,
  initialMonth,
}: {
  projectId: string;
  currentUserId: string;
  isOwner: boolean;
  members: CalendarMember[];
  initialEvents: CalendarEvent[];
  initialBusyBlocks: BusyBlock[];
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [busyBlocks, setBusyBlocks] = useState<BusyBlock[]>(initialBusyBlocks);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [busyDialogOpen, setBusyDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [editBusyBlock, setEditBusyBlock] = useState<BusyBlock | null>(null);

  const memberColorMap = buildMemberColorMap(members.map((m) => m.userId));

  const fetchData = useCallback(async () => {
    const monthKey = formatMonthKey(year, month);
    const [eventsRes, busyRes] = await Promise.all([
      fetch(`/api/projects/${projectId}/calendar?month=${monthKey}`),
      fetch(`/api/projects/${projectId}/calendar/busy?month=${monthKey}`),
    ]);
    if (eventsRes.ok) setEvents(await eventsRes.json());
    if (busyRes.ok) setBusyBlocks(await busyRes.json());
  }, [projectId, year, month]);

  useEffect(() => {
    if (year !== initialYear || month !== initialMonth) {
      fetchData();
    }
  }, [year, month, initialYear, initialMonth, fetchData]);

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

  const busyByDay = new Map<number, BusyBlock[]>();
  for (const block of busyBlocks) {
    const start = new Date(block.startTime);
    const end = new Date(block.endTime);
    for (let d = 1; d <= daysInMonth; d++) {
      if (dateSpansDay(start, end, year, month, d)) {
        if (!busyByDay.has(d)) busyByDay.set(d, []);
        busyByDay.get(d)!.push(block);
      }
    }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedEvents = selectedDay
    ? (eventsByDay.get(selectedDay) ?? [])
    : events;

  const selectedBusy = selectedDay ? (busyByDay.get(selectedDay) ?? []) : busyBlocks;

  const monthLabel = new Date(year, month).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  function handleEventCreated() {
    setEventDialogOpen(false);
    setEditEvent(null);
    fetchData();
  }

  function handleBusyCreated() {
    setBusyDialogOpen(false);
    setEditBusyBlock(null);
    fetchData();
  }

  function openEditEvent(event: CalendarEvent) {
    setEditEvent(event);
    setEventDialogOpen(true);
  }

  function openEditBusy(block: BusyBlock) {
    setEditBusyBlock(block);
    setBusyDialogOpen(true);
  }

  async function handleDeleteEvent(eventId: string) {
    const res = await fetch(
      `/api/projects/${projectId}/calendar/${eventId}`,
      { method: "DELETE" },
    );
    if (res.ok) fetchData();
  }

  async function handleDeleteBusy(blockId: string) {
    const res = await fetch(
      `/api/projects/${projectId}/calendar/busy/${blockId}`,
      { method: "DELETE" },
    );
    if (res.ok) fetchData();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <h2 className="min-w-[140px] text-center text-lg font-semibold sm:min-w-[180px]">
            {monthLabel}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditBusyBlock(null);
              setBusyDialogOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            Mark Busy
          </Button>
          <Button
            onClick={() => {
              setEditEvent(null);
              setEventDialogOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            Add Event
          </Button>
        </div>
      </div>

      {/* Member color legend */}
      {members.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="font-medium">Members:</span>
          {members.map((m) => {
            const color = memberColorMap.get(m.userId)!;
            return (
              <span key={m.userId} className="flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-full", color.dot)} />
                {m.displayName}
              </span>
            );
          })}
        </div>
      )}

      {/* Calendar grid */}
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
            const dayBusy = day ? (busyByDay.get(day) ?? []) : [];
            const uniqueBusyUsers = [...new Set(dayBusy.map((b) => b.user.id))];

            return (
              <button
                key={i}
                type="button"
                disabled={day === null}
                onClick={() =>
                  day !== null &&
                  setSelectedDay(day === selectedDay ? null : day)
                }
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
                        <span className="text-xs text-muted-foreground">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                    {uniqueBusyUsers.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-0.5">
                        {uniqueBusyUsers.slice(0, 4).map((userId) => {
                          const color = memberColorMap.get(userId);
                          return (
                            <span
                              key={userId}
                              className={cn(
                                "h-1 w-3 rounded-full",
                                color?.dot ?? "bg-zinc-400",
                              )}
                            />
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event list */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          {selectedDay
            ? `Events on ${new Date(year, month, selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`
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
                currentUserId={currentUserId}
                isOwner={isOwner}
                onRsvpChange={fetchData}
                onEdit={() => openEditEvent(event)}
                onDelete={() => handleDeleteEvent(event.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Busy blocks list */}
      {selectedBusy.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            {selectedDay ? "Busy times on this day" : "All busy times this month"}
          </h3>
          <div className="space-y-2">
            {selectedBusy.map((block) => {
              const color = memberColorMap.get(block.user.id);
              const canManage = block.user.id === currentUserId;
              return (
                <div
                  key={block.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                    color?.border,
                  )}
                >
                  <span className={cn("size-2.5 shrink-0 rounded-full", color?.dot ?? "bg-zinc-400")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {block.user.displayName}
                      {block.note && (
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          — {block.note}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(block.startTime)} {formatTime(block.startTime)} –{" "}
                      {isSameDay(new Date(block.startTime), new Date(block.endTime))
                        ? formatTime(block.endTime)
                        : `${formatShortDate(block.endTime)} ${formatTime(block.endTime)}`}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditBusy(block)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteBusy(block.id)}
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <EventDialog
        projectId={projectId}
        open={eventDialogOpen}
        onOpenChange={(open) => {
          setEventDialogOpen(open);
          if (!open) setEditEvent(null);
        }}
        onSuccess={handleEventCreated}
        editEvent={
          editEvent
            ? {
                id: editEvent.id,
                title: editEvent.title,
                description: editEvent.description,
                eventType: editEvent.eventType,
                startTime: editEvent.startTime,
                endTime: editEvent.endTime,
                location: editEvent.location,
              }
            : undefined
        }
        busyBlocks={busyBlocks}
        memberColorMap={memberColorMap}
        members={members}
      />

      <BusyBlockDialog
        projectId={projectId}
        open={busyDialogOpen}
        onOpenChange={(open) => {
          setBusyDialogOpen(open);
          if (!open) setEditBusyBlock(null);
        }}
        onSuccess={handleBusyCreated}
        editBlock={
          editBusyBlock
            ? {
                id: editBusyBlock.id,
                startTime: editBusyBlock.startTime,
                endTime: editBusyBlock.endTime,
                note: editBusyBlock.note,
              }
            : undefined
        }
      />
    </div>
  );
}
