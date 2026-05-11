"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PollCard, type PollData } from "@/components/poll-card";
import { CreatePollDialog } from "@/components/create-poll-dialog";

export function PollsList({
  projectId,
  initialPolls,
}: {
  projectId: string;
  initialPolls: PollData[];
}) {
  const [polls, setPolls] = useState(initialPolls);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPolls = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/polls`);
    if (res.ok) {
      setPolls(await res.json());
    }
  }, [projectId]);

  function handleCreated() {
    setDialogOpen(false);
    fetchPolls();
  }

  const activePolls = polls.filter((p) => p.isActive);
  const closedPolls = polls.filter((p) => !p.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {polls.length} {polls.length === 1 ? "poll" : "polls"}
        </p>
        <Button onClick={() => setDialogOpen(true)}>Create Poll</Button>
      </div>

      {polls.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No polls yet. Create one to get your band&apos;s opinion!
        </p>
      )}

      {activePolls.length > 0 && (
        <div className="space-y-3">
          {activePolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} projectId={projectId} />
          ))}
        </div>
      )}

      {closedPolls.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Closed Polls
          </h2>
          {closedPolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} projectId={projectId} />
          ))}
        </div>
      )}

      <CreatePollDialog
        projectId={projectId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleCreated}
      />
    </div>
  );
}
