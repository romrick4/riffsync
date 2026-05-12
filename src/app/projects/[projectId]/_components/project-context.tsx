"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface ProjectMember {
  id: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    displayName: string;
  };
}

export interface ProjectData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  _count: { songs: number };
}

const ProjectContext = createContext<ProjectData | null>(null);

export function ProjectProvider({
  project,
  children,
}: {
  project: ProjectData;
  children: ReactNode;
}) {
  return (
    <ProjectContext.Provider value={project}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
