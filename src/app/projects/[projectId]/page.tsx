import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Music, Users, Calendar, Copy } from "lucide-react";
import { InviteCode } from "./_components/invite-code";
import { formatDistanceToNow } from "date-fns";

export default async function ProjectDashboard({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { songs: true, albums: true, calendarEvents: true } },
      songs: {
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          versions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              uploadedBy: {
                select: { displayName: true },
              },
            },
          },
        },
      },
      calendarEvents: {
        where: { startTime: { gte: new Date() } },
        orderBy: { startTime: "asc" },
        take: 3,
      },
    },
  });

  if (!project) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-0 divide-x divide-border rounded-lg border bg-card/50 text-center">
        <Link href={`/projects/${projectId}/music`} className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors hover:bg-muted/50">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Music className="size-3.5" />
            <span className="text-xs">Songs</span>
          </div>
          <span className="text-xl font-bold tabular-nums">{project._count.songs}</span>
        </Link>
        <div className="flex flex-1 flex-col items-center gap-1 py-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-3.5" />
            <span className="text-xs">Members</span>
          </div>
          <span className="text-xl font-bold tabular-nums">{project.members.length}</span>
        </div>
        <Link href={`/projects/${projectId}/calendar`} className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors hover:bg-muted/50">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5" />
            <span className="text-xs">Events</span>
          </div>
          <span className="text-xl font-bold tabular-nums">{project._count.calendarEvents}</span>
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section>
          <h2 className="mb-2.5 text-sm font-medium text-muted-foreground">Members</h2>
          <div className="space-y-1">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {project.members.map((member: any) => {
              const initials = member.user.displayName
                .split(" ")
                .map((w: string) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 -mx-2"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {member.user.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{member.user.username}
                    </p>
                  </div>
                  {member.role === "OWNER" && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      Owner
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed px-3 py-2.5">
            <Copy className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Invite code:</span>
            <InviteCode code={project.inviteCode} />
          </div>
        </section>

        <section>
          <h2 className="mb-2.5 text-sm font-medium text-muted-foreground">Recent Activity</h2>
          {project.songs.length === 0 &&
          project.calendarEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity yet. Start by creating a song!
            </p>
          ) : (
            <div className="space-y-0.5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {project.songs.map((song: any) => {
                const latestVersion = song.versions[0];
                return (
                  <Link
                    key={song.id}
                    href={`/projects/${projectId}/music/songs/${song.id}`}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2 -mx-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Music className="size-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{song.title}</p>
                      {latestVersion ? (
                        <p className="truncate text-xs text-muted-foreground">
                          v{latestVersion.versionNumber} by{" "}
                          {latestVersion.uploadedBy.displayName} &middot;{" "}
                          {formatDistanceToNow(latestVersion.createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Created{" "}
                          {formatDistanceToNow(song.createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {project.calendarEvents.map((event: any) => (
                <Link
                  key={event.id}
                  href={`/projects/${projectId}/calendar`}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2 -mx-2 transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="size-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.eventType.replace(/_/g, " ").toLowerCase()}{" "}
                      &middot;{" "}
                      {formatDistanceToNow(event.startTime, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
