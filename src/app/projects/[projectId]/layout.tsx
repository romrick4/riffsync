import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProjectProvider } from "./_components/project-context";
import { Separator } from "@/components/ui/separator";

const tabs = [
  { label: "Overview", href: "" },
  { label: "Songs", href: "/songs" },
  { label: "Calendar", href: "/calendar" },
  { label: "Polls", href: "/polls" },
  { label: "Settings", href: "/settings" },
] as const;

export default async function ProjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });

  if (!membership) notFound();

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
      _count: { select: { songs: true } },
    },
  });

  if (!project) notFound();

  const serializedProject = JSON.parse(JSON.stringify(project));

  return (
    <div>
      <nav className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={`/projects/${projectId}${tab.href}`}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <Separator className="mt-1 mb-6" />
      <ProjectProvider project={serializedProject}>
        {children}
      </ProjectProvider>
    </div>
  );
}
