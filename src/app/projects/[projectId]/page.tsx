import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Music, Users, Calendar } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Music className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{project._count.songs}</p>
              <p className="text-xs text-muted-foreground">Songs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{project.members.length}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {project._count.calendarEvents}
              </p>
              <p className="text-xs text-muted-foreground">Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
                    className="flex items-center gap-3"
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {member.user.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{member.user.username}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Share this invite code with your bandmates so they can join the
              project.
            </p>
            <InviteCode code={project.inviteCode} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {project.songs.length === 0 &&
          project.calendarEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity yet. Start by creating a song!
            </p>
          ) : (
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {project.songs.map((song: any) => {
                const latestVersion = song.versions[0];
                return (
                  <div key={song.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Music className="size-3.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{song.title}</p>
                      {latestVersion ? (
                        <p className="text-xs text-muted-foreground">
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
                  </div>
                );
              })}
              {project.songs.length > 0 &&
                project.calendarEvents.length > 0 && (
                  <Separator />
                )}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {project.calendarEvents.map((event: any) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="size-3.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.eventType.replace(/_/g, " ").toLowerCase()}{" "}
                      &middot;{" "}
                      {formatDistanceToNow(event.startTime, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
