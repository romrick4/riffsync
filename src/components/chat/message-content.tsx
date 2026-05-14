"use client";

import Link from "next/link";
import {
  UserIcon,
  MusicIcon,
  LayersIcon,
  BarChart3Icon,
  CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const REF_PATTERN =
  /\[(@|\/)(.*?)\]\((member|song|version|poll|event):([a-f0-9-]+)\)/g;

type RefType = "member" | "song" | "version" | "poll" | "event";

interface ParsedRef {
  type: RefType;
  label: string;
  id: string;
}

const ICONS: Record<RefType, typeof UserIcon> = {
  member: UserIcon,
  song: MusicIcon,
  version: LayersIcon,
  poll: BarChart3Icon,
  event: CalendarIcon,
};

function getHref(
  type: RefType,
  id: string,
  projectId: string,
): string | null {
  switch (type) {
    case "member":
      return null;
    case "song":
      return `/projects/${projectId}/music/songs/${id}`;
    case "version":
      return `/projects/${projectId}/music/songs/${id}`;
    case "poll":
      return `/projects/${projectId}/polls`;
    case "event":
      return `/projects/${projectId}/calendar`;
  }
}

interface ReferenceChipProps {
  ref_: ParsedRef;
  projectId: string;
  isOwnMessage: boolean;
}

function ReferenceChip({ ref_, projectId, isOwnMessage }: ReferenceChipProps) {
  const Icon = ICONS[ref_.type];
  const href = getHref(ref_.type, ref_.id, projectId);

  const chipClass = cn(
    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium align-baseline",
    isOwnMessage
      ? "bg-primary-foreground/20 text-primary-foreground"
      : "bg-primary/10 text-primary",
  );

  const inner = (
    <>
      <Icon className="size-3" />
      <span>{ref_.label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(chipClass, "hover:underline")}>
        {inner}
      </Link>
    );
  }

  return <span className={chipClass}>{inner}</span>;
}

interface MessageContentProps {
  content: string;
  projectId: string;
  isOwnMessage: boolean;
}

export function MessageContent({
  content,
  projectId,
  isOwnMessage,
}: MessageContentProps) {
  const parts: (string | ParsedRef)[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(REF_PATTERN)) {
    const matchIndex = match.index!;
    if (matchIndex > lastIndex) {
      parts.push(content.slice(lastIndex, matchIndex));
    }
    parts.push({
      type: match[3] as RefType,
      label: match[2],
      id: match[4],
    });
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  if (parts.length === 0) {
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
  }

  return (
    <p className="whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <ReferenceChip
            key={i}
            ref_={part}
            projectId={projectId}
            isOwnMessage={isOwnMessage}
          />
        ),
      )}
    </p>
  );
}
