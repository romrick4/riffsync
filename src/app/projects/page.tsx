export const unstable_instant = { prefetch: "static" };

import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Users } from "lucide-react";
import { CreateProjectDialog } from "./_components/create-project-dialog";
import { JoinProjectDialog } from "./_components/join-project-dialog";
import { formatDistanceToNow } from "date-fns";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Your bands and collaborations
          </p>
        </div>
        <div className="flex gap-2">
          <JoinProjectDialog />
          <CreateProjectDialog />
        </div>
      </div>

      <Suspense
        fallback={
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-lg border border-border bg-card" />
            ))}
          </div>
        }
      >
        <ProjectList userId={user.id} />
      </Suspense>
    </div>
  );
}

async function ProjectList({ userId }: { userId: string }) {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } } },
    include: {
      _count: { select: { members: true, songs: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (projects.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Music className="size-8 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">No projects yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create a new project to start collaborating with your band, or join
          an existing one with an invite code.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {projects.map((project: any) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <Card className="h-full transition-colors hover:bg-card/80">
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              {project.description && (
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <Users className="size-3" />
                  {project._count.members}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Music className="size-3" />
                  {project._count.songs}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDistanceToNow(project.updatedAt, {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
