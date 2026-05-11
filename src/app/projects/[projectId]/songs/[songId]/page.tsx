import { redirect } from "next/navigation";

export default async function SongRedirect({
  params,
}: {
  params: Promise<{ projectId: string; songId: string }>;
}) {
  const { projectId, songId } = await params;
  redirect(`/projects/${projectId}/music/songs/${songId}`);
}
