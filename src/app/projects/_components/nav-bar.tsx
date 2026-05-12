"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, BellRing, BellOff } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notification-bell";
import { usePushSubscription } from "@/hooks/use-push-subscription";

interface NavBarProps {
  user: {
    id: string;
    displayName: string;
  };
}

export function NavBar({ user }: NavBarProps) {
  const router = useRouter();
  const { isSubscribed, isSupported, subscribe, unsubscribe } =
    usePushSubscription();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleTogglePush() {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  }

  const initials = user.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/projects">
          <Logo size="sm" />
        </Link>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="rounded-full" />
              }
            >
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {isSupported && (
                <DropdownMenuItem onClick={handleTogglePush}>
                  {isSubscribed ? (
                    <BellOff className="size-4" />
                  ) : (
                    <BellRing className="size-4" />
                  )}
                  {isSubscribed ? "Disable push notifications" : "Enable push notifications"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
