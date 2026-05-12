import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NavBar } from "./_components/nav-bar";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 overflow-x-hidden px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
