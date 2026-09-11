import type { WorkspaceRole } from "./workspace";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  workspaceRole?: WorkspaceRole;
  currentWorkspaceId?: string;
}

export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  updateProfile?: (updates: Partial<UserProfile>) => void;
}
