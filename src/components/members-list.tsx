"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Member {
  id: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    displayName: string;
  };
}

interface MembersListProps {
  projectId: string;
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
}

export function MembersList({
  projectId,
  members,
  currentUserId,
  isOwner,
}: MembersListProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/members?memberId=${memberId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to remove member");
        return;
      }
      toast.success("Member removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const initials = member.user.displayName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        const isSelf = member.user.id === currentUserId;
        const canRemove = isOwner && !isSelf && member.role !== "OWNER";

        return (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {member.user.displayName}
                {isSelf && (
                  <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {member.role === "OWNER" ? "Owner" : "Member"}
              </p>
            </div>
            <Badge variant={member.role === "OWNER" ? "default" : "outline"} className="text-xs">
              {member.role}
            </Badge>
            {canRemove && (
              <Dialog>
                <DialogTrigger
                  render={
                    <Button variant="destructive" size="xs" />
                  }
                >
                  Remove
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Remove Member</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to remove{" "}
                      <strong>{member.user.displayName}</strong> from the
                      project? They will lose access to all songs and files.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      Cancel
                    </DialogClose>
                    <Button
                      variant="destructive"
                      disabled={removingId === member.id}
                      onClick={() => handleRemove(member.id)}
                    >
                      {removingId === member.id ? "Removing..." : "Remove"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        );
      })}
    </div>
  );
}
