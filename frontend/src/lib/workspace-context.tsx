
import React, { createContext, useContext, useState, useEffect } from 'react';

interface WorkspaceContextType {
  selectedWorkspace: string;
  selectedProject: string;
  setSelectedWorkspace: (workspace: string) => void;
  setSelectedProject: (project: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [selectedWorkspace, setSelectedWorkspace] = useState("T&D");
  const [selectedProject, setSelectedProject] = useState("T&D");

  // Sync project with workspace when workspace changes
  useEffect(() => {
    if (selectedWorkspace === "T&D") {
      setSelectedProject("T&D");
    } else if (selectedWorkspace === "ADMS") {
      setSelectedProject("ADMS");
    }
  }, [selectedWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        selectedWorkspace,
        selectedProject,
        setSelectedWorkspace,
        setSelectedProject,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

// Team member configurations
export const TEAM_MEMBERS = {
  "T&D": [
    { id: "tanay", name: "Tanay" },
    { id: "abhishek", name: "Abhishek" },
    { id: "harshada", name: "Harshada" },
  ],
  "ADMS": [
    { id: "pranay", name: "Pranay" },
    { id: "anish", name: "Anish" },
    { id: "shubham", name: "Shubham" },
  ],
};

export const WORKSPACE_CONFIG = {
  "T&D": {
    teamLead: "Shantnu",
    projects: ["T&D"],
    members: TEAM_MEMBERS["T&D"],
  },
  "ADMS": {
    teamLead: "Pranav",
    projects: ["ADMS"],
    members: TEAM_MEMBERS["ADMS"],
  },
};
