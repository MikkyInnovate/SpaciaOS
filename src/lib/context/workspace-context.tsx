"use client";

import * as React from "react";
import type { Workspace, WorkspaceContextValue } from "@/types/workspace";
import { siteConfig } from "@/lib/config/site";
import { apiClient } from "@/lib/api/client";

export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: siteConfig.defaultWorkspace.id,
    name: siteConfig.defaultWorkspace.name,
    slug: "premier-realty",
    role: "Sales Operations",
    tier: "enterprise",
    currency: "NGN (₦)",
    timezone: "Africa/Lagos (WAT)",
    primaryMarket: "Lagos (Ikoyi, VI, Lekki)",
    isDefault: true,
  },
  {
    id: "ws_oakmont_capital",
    name: "Oakmont Capital Real Estate",
    slug: "oakmont-capital",
    role: "Admin",
    tier: "growth",
    currency: "USD ($)",
    timezone: "Africa/Lagos (WAT)",
    primaryMarket: "Abuja (Maitama, Asokoro)",
    isDefault: false,
  },
];

const STORAGE_KEY = "spacia_active_workspace_id";

const WorkspaceContext = React.createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces] = React.useState<Workspace[]>(MOCK_WORKSPACES);
  const [currentWorkspaceId, setCurrentWorkspaceId] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedId = localStorage.getItem(STORAGE_KEY);
        if (storedId && MOCK_WORKSPACES.some((ws) => ws.id === storedId)) {
          return storedId;
        }
      } catch {
        // Storage unavailable or blocked
      }
    }
    return MOCK_WORKSPACES[0].id;
  });
  const [isLoading] = React.useState<boolean>(false);

  const switchWorkspace = React.useCallback((workspaceId: string) => {
    const target = MOCK_WORKSPACES.find((ws) => ws.id === workspaceId);
    if (target) {
      setCurrentWorkspaceId(workspaceId);
      try {
        localStorage.setItem(STORAGE_KEY, workspaceId);
      } catch {
        // Storage unavailable
      }
    }
  }, []);

  // Keep centralized apiClient in sync with active workspace
  React.useEffect(() => {
    apiClient.setWorkspaceId(currentWorkspaceId);
  }, [currentWorkspaceId]);

  const currentWorkspace = React.useMemo(() => {
    return workspaces.find((ws) => ws.id === currentWorkspaceId) || workspaces[0];
  }, [workspaces, currentWorkspaceId]);

  const value = React.useMemo<WorkspaceContextValue>(
    () => ({
      currentWorkspace,
      workspaces,
      isLoading,
      switchWorkspace,
    }),
    [currentWorkspace, workspaces, isLoading, switchWorkspace]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a <WorkspaceProvider>");
  }
  return context;
}
