import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SettingsForm } from "@/components/settings-form";
import { MembersList } from "@/components/members-list";
import { InviteCode } from "../_components/invite-code";
import { DeleteProjectButton } from "@/components/delete-project-button";

export default async function ProjectSettingsPage({
  params,
}: {
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
    },
  });

  if (!project) notFound();

  const isOwner = membership.role === "OWNER";
  const serializedMembers = JSON.parse(JSON.stringify(project.members));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your project settings and members.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Info</CardTitle>
          <CardDescription>
            {isOwner
              ? "Update your project name and description."
              : "Only the project owner can edit these settings."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            projectId={projectId}
            initialName={project.name}
            initialDescription={project.description ?? ""}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite Link</CardTitle>
          <CardDescription>
            Share this link with bandmates so they can join the project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteCode code={project.inviteCode} />
          <p className="mt-3 text-xs text-muted-foreground">
            New members can join by opening this link or by entering the code on
            the projects page via &quot;Join Project&quot;.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {project.members.length} member{project.members.length !== 1 && "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersList
            projectId={projectId}
            members={serializedMembers}
            currentUserId={user.id}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect the entire project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Delete Project</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this project, all songs, versions, and
                  files. This cannot be undone.
                </p>
              </div>
              <DeleteProjectButton
                projectId={projectId}
                projectName={project.name}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
