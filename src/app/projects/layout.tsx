import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NavBar } from "./_components/nav-bar";
import { PWAInstallBanner } from "@/components/pwa-install-banner";

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
      <PWAInstallBanner />
      <main className="mx-auto w-full max-w-7xl flex-1 px-[max(1rem,env(safe-area-inset-right))] py-6 sm:px-[max(1.5rem,env(safe-area-inset-right))]">
        {children}
      </main>
    </div>
  );
}
