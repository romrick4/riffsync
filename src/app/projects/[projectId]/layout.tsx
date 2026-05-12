import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProjectProvider } from "./_components/project-context";
import { Separator } from "@/components/ui/separator";

const tabs = [
  { label: "Overview", href: "" },
  { label: "Music", href: "/music" },
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
            select: { id: true, displayName: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { songs: true, albums: true } },
    },
  });

  if (!project) notFound();

  const serializedProject = JSON.parse(JSON.stringify(project));

  return (
    <div>
      <nav className="relative -mx-4 sm:-mx-0">
        <div className="flex gap-1 overflow-x-auto px-4 sm:px-0 [-webkit-overflow-scrolling:touch]">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={`/projects/${projectId}${tab.href}`}
              className="whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:px-3 md:py-1.5"
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
      </nav>
      <Separator className="mt-1 mb-6" />
      <ProjectProvider project={serializedProject}>
        {children}
      </ProjectProvider>
    </div>
  );
}
