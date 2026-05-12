import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notify, getProjectMemberIds } from "@/lib/notifications";
import { InviteLanding } from "./invite-landing";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const [project, user] = await Promise.all([
    prisma.project.findUnique({
      where: { inviteCode: code },
      select: { id: true, name: true, inviteCode: true },
    }),
    getCurrentUser(),
  ]);

  if (!project) notFound();

  if (!user) {
    return <InviteLanding projectName={project.name} inviteCode={code} />;
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId: project.id, userId: user.id },
    },
  });

  if (existingMember) {
    redirect(`/projects/${project.id}`);
  }

  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: user.id,
      role: "MEMBER",
    },
  });

  const recipientIds = await getProjectMemberIds(project.id, user.id);
  notify({
    type: "INVITE_RECEIVED",
    message: `${user.displayName} joined ${project.name}`,
    linkUrl: `/projects/${project.id}`,
    recipientIds,
  }).catch(() => {});

  redirect(`/projects/${project.id}`);
}
