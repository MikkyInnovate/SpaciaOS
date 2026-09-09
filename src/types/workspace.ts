export type WorkspaceTier = "starter" | "growth" | "enterprise";

export type WorkspaceRole = "owner" | "admin" | "sales_manager" | "sales_agent" | "viewer";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
  tier: WorkspaceTier;
  currency: string;
  timezone: string;
  primaryMarket: string;
  isDefault?: boolean;
}

export interface WorkspaceContextValue {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
}
