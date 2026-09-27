export type WorkspaceRole =
  | "owner"
  | "admin"
  | "sales_manager"
  | "sales_agent"
  | "viewer";

export type MemberStatus = "active" | "invited" | "pending" | "suspended";

export interface AgentRoutingProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  roleTitle?: string | null;
  status: "active" | "busy" | "offline";
  territory: string;
  specializations: string[];
  routingWeight: number;
  isAvailableForRouting: boolean;
  maxConcurrentLeads: number;
  activeLeadsCount: number;
}

export interface TeamMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: MemberStatus;
  invitedEmail?: string | null;
  invitedAt?: string | null;
  joinedAt?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
  };
  agent: AgentRoutingProfile | null;
}

export interface TeamStats {
  totalMembers: number;
  activeBrokers: number;
  routingActive: number;
  totalCapacity: number;
  currentActiveLeads: number;
  availableCapacity: number;
  capacityUtilizationPercent: number;
}

export interface RoleDefinition {
  role: WorkspaceRole;
  title: string;
  description: string;
  badgeVariant: "rose" | "indigo" | "emerald" | "sky" | "stone";
  permissions: string[];
}

export interface InviteMemberPayload {
  email: string;
  role: WorkspaceRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleTitle?: string;
  territory?: string;
  specializations?: string[];
  routingWeight?: number;
  maxConcurrentLeads?: number;
}

export interface UpdateRolePayload {
  role: WorkspaceRole;
}

export interface UpdateStatusPayload {
  status: MemberStatus;
}

export interface UpdateAgentRoutingPayload {
  territory?: string;
  specializations?: string[];
  routingWeight?: number;
  isAvailableForRouting?: boolean;
  maxConcurrentLeads?: number;
  status?: "active" | "busy" | "offline";
}
