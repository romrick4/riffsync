import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ListMusicIcon, MusicIcon, ClockIcon } from "lucide-react";
import { NewSetlistDialog } from "./_components/new-setlist-dialog";

export default async function SetlistsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex flex-1 flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Setlists</h1>
          <p className="text-sm text-muted-foreground">
            Build and organize your live sets.
          </p>
        </div>
        <NewSetlistDialog projectId={projectId} />
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg border border-border bg-card"
              />
            ))}
          </div>
        }
      >
        <SetlistsContent projectId={projectId} />
      </Suspense>
    </div>
  );
}

async function SetlistsContent({ projectId }: { projectId: string }) {
  const setlists = await prisma.setlist.findMany({
    where: { projectId },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (setlists.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16">
        <ListMusicIcon className="size-10 text-muted-foreground/50" />
        <div className="text-center">
          <p className="font-medium">No setlists yet</p>
          <p className="text-sm text-muted-foreground">
            Create a setlist to start organizing your songs for a show.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {setlists.map((setlist) => (
        <Link
          key={setlist.id}
          href={`/projects/${projectId}/setlists/${setlist.id}`}
        >
          <Card className="h-full transition-colors hover:bg-muted/30">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded bg-muted">
                  <ListMusicIcon className="size-5 text-muted-foreground" />
                </div>
                <CardTitle className="flex-1 truncate">
                  {setlist.name}
                </CardTitle>
              </div>
              {setlist.description && (
                <CardDescription className="line-clamp-2">
                  {setlist.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MusicIcon className="size-3.5" />
                  {setlist._count.items}{" "}
                  {setlist._count.items === 1 ? "song" : "songs"}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3.5" />
                  Updated{" "}
                  {new Date(setlist.updatedAt).toLocaleDateString("en-US")}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
