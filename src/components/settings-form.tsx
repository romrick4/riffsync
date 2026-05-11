"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface SettingsFormProps {
  projectId: string;
  initialName: string;
  initialDescription: string;
  isOwner: boolean;
}

export function SettingsForm({
  projectId,
  initialName,
  initialDescription,
  isOwner,
}: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save");
        return;
      }

      toast.success("Project updated");
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project-name">Project Name</Label>
        <Input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isOwner}
          placeholder="My Band Project"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-description">Description</Label>
        <Textarea
          id="project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isOwner}
          placeholder="A brief description of the project..."
          rows={3}
        />
      </div>
      {isOwner && (
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      )}
    </form>
  );
}
