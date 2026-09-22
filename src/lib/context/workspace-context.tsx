"use client";

import * as React from "react";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import type { Workspace, WorkspaceContextValue } from "@/types/workspace";
import { apiClient } from "@/lib/api/client";

const PREFERRED_WORKSPACE_STORAGE_KEY = "pacia_preferred_workspace_id";

const WorkspaceContext = React.createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization();
  const { userMemberships, setActive, isLoaded: isOrgListLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  const isLoading = !isOrgLoaded || !isOrgListLoaded;

  const userMembershipsData = userMemberships?.data;

  // Extract list of all Clerk organizations the user belongs to
  const workspaces = React.useMemo<Workspace[]>(() => {
    if (!userMembershipsData || userMembershipsData.length === 0) {
      if (process.env.NODE_ENV === "development") {
        return [
          {
            id: "org_dubai_palace",
            name: "Dubai Palace Realty",
            slug: "dubai-palace",
            role: "org:admin",
          },
        ];
      }
      return [];
    }

    return userMembershipsData.map((mem) => ({
      id: mem.organization.id,
      name: mem.organization.name,
      slug: mem.organization.slug || mem.organization.id,
      role: mem.role,
      imageUrl: mem.organization.imageUrl,
    }));
  }, [userMembershipsData]);

  // Current active workspace derived strictly from active Clerk organization
  const currentWorkspace = React.useMemo<Workspace | null>(() => {
    if (!organization) {
      if (
        process.env.NODE_ENV === "development" &&
        (!userMembershipsData || userMembershipsData.length === 0)
      ) {
        return {
          id: "org_dubai_palace",
          name: "Dubai Palace Realty",
          slug: "dubai-palace",
          role: "org:admin",
        };
      }
      return null;
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug || organization.id,
      role: membership?.role || "org:member",
      imageUrl: organization.imageUrl,
    };
  }, [organization, membership, userMembershipsData]);

  // Auto-activate organization if single organization exists or restore UI preference
  React.useEffect(() => {
    if (isLoading || !setActive) return;

    // If an organization is already active, don't force a switch
    if (organization) return;

    if (workspaces.length === 1) {
      // Exactly 1 organization: auto-activate to enter Pacia seamlessly
      setActive({ organization: workspaces[0].id });
    } else if (workspaces.length > 1) {
      // Multiple organizations: check if non-authoritative preference exists in storage
      let preferredId: string | null = null;
      try {
        preferredId = localStorage.getItem(PREFERRED_WORKSPACE_STORAGE_KEY);
      } catch {
        // Storage restricted
      }

      if (preferredId && workspaces.some((ws) => ws.id === preferredId)) {
        setActive({ organization: preferredId });
      } else {
        // Default to first organization
        setActive({ organization: workspaces[0].id });
      }
    }
  }, [isLoading, organization, workspaces, setActive]);

  // Synchronize active workspace ID with centralized apiClient
  React.useEffect(() => {
    if (currentWorkspace?.id) {
      apiClient.setWorkspaceId(currentWorkspace.id);
    } else {
      apiClient.setWorkspaceId("");
    }
  }, [currentWorkspace?.id]);

  const switchWorkspace = React.useCallback(
    async (workspaceId: string) => {
      if (!setActive) return;

      try {
        await setActive({ organization: workspaceId });
        try {
          localStorage.setItem(PREFERRED_WORKSPACE_STORAGE_KEY, workspaceId);
        } catch {
          // Storage restricted
        }
      } catch (err) {
        console.error("Failed to switch active organization:", err);
      }
    },
    [setActive]
  );

  const value = React.useMemo<WorkspaceContextValue>(
    () => ({
      currentWorkspace,
      workspaces,
      hasWorkspace: Boolean(currentWorkspace),
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
