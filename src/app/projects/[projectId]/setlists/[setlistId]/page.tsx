import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { SetlistDetailClient } from "./setlist-detail-client";

export default async function SetlistDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; setlistId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { projectId, setlistId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) notFound();

  const setlist = await prisma.setlist.findUnique({
    where: { id: setlistId, projectId },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          song: {
            select: { id: true, title: true },
          },
          lockedVersion: {
            select: { id: true, title: true, versionNumber: true },
          },
        },
      },
    },
  });

  if (!setlist) notFound();

  const projectSongs = await prisma.song.findMany({
    where: { projectId },
    select: {
      id: true,
      title: true,
      versions: {
        select: { id: true, title: true, versionNumber: true },
        orderBy: { versionNumber: "desc" },
      },
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/projects/${projectId}/setlists`}>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ArrowLeftIcon data-icon="inline-start" />
            Setlists
          </Button>
        </Link>
      </div>

      <SetlistDetailClient
        setlist={{
          id: setlist.id,
          name: setlist.name,
          description: setlist.description,
          items: setlist.items.map((item) => ({
            id: item.id,
            position: item.position,
            notes: item.notes,
            song: item.song,
            lockedVersion: item.lockedVersion,
          })),
        }}
        projectId={projectId}
        projectSongs={projectSongs}
        isOwner={membership.role === "OWNER"}
      />
    </div>
  );
}
