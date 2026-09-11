export type WorkspaceTier = "starter" | "growth" | "enterprise";

export type WorkspaceRole =
  | "org:admin"
  | "org:member"
  | "owner"
  | "admin"
  | "sales_manager"
  | "sales_agent"
  | "viewer"
  | string;

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role?: string;
  imageUrl?: string;
  tier?: string;
  primaryMarket?: string;
}

export interface WorkspaceContextValue {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  hasWorkspace: boolean;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
}
