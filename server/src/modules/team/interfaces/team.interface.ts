import { WorkspaceRole } from "../../../database/schema/users.schema";

export interface TeamMemberResponse {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: "active" | "invited" | "pending" | "suspended";
  invitedEmail?: string | null;
  invitedAt?: Date | null;
  joinedAt?: Date | null;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    roleTitle: string;
    status: "active" | "busy" | "offline";
    territory?: string | null;
    specializations?: string[] | null;
    routingWeight: number;
    isAvailableForRouting: boolean;
    maxConcurrentLeads: number;
    activeLeadsCount: number;
  } | null;
}

export interface TeamStatsResponse {
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
  badgeVariant: "rose" | "indigo" | "emerald" | "sky" | "amber";
  permissions: string[];
}
