import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getProjectMembership } from "@/lib/project-data";
import { Separator } from "@/components/ui/separator";

const tabs = [
  { label: "Overview", href: "" },
  { label: "Music", href: "/music" },
  { label: "Calendar", href: "/calendar" },
  { label: "Setlists", href: "/setlists" },
  { label: "Polls", href: "/polls" },
  { label: "Chat", href: "/chat" },
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

  const membership = await getProjectMembership(projectId, user.id);
  if (!membership) notFound();

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
      {children}
    </div>
  );
}
