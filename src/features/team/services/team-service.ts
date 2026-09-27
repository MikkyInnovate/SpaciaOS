import { apiClient } from "@/lib/api/client";
import type {
  TeamMember,
  TeamStats,
  RoleDefinition,
  InviteMemberPayload,
  UpdateRolePayload,
  UpdateStatusPayload,
  UpdateAgentRoutingPayload,
} from "../types";

export const DEFAULT_ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: "owner",
    title: "Workspace Owner",
    description: "Unrestricted control over agency billing, team memberships, API keys, and workspace settings.",
    badgeVariant: "rose",
    permissions: ["All Permissions", "billing:manage", "workspace:delete", "members:manage"],
  },
  {
    role: "admin",
    title: "Operations Admin",
    description: "Full management of sales agents, routing rules, property catalog, and AI voice configurations.",
    badgeVariant: "indigo",
    permissions: ["workspace:manage", "members:manage", "leads:write", "properties:manage", "calls:trigger"],
  },
  {
    role: "sales_manager",
    title: "Sales Director / Manager",
    description: "Supervises pipeline velocity, resolves complex BANT objections, and conducts human broker takeovers.",
    badgeVariant: "emerald",
    permissions: ["leads:read", "leads:write", "calls:trigger", "properties:read", "handoff:takeover"],
  },
  {
    role: "sales_agent",
    title: "Licensed Luxury Broker",
    description: "Assigned qualified buyer viewings, manages active prospect dossiers, and conducts in-person inspections.",
    badgeVariant: "sky",
    permissions: ["leads:read", "leads:write", "calls:trigger", "properties:read", "appointments:manage"],
  },
];

const FALLBACK_MEMBERS: TeamMember[] = [];

class TeamService {
  /**
   * 1. Get team KPI metrics & capacity
   */
  async getStats(): Promise<TeamStats> {
    try {
      const response = await apiClient.get<any>("/api/v1/team/stats");
      const data = response?.data || response;
      if (data?.stats) {
        return data.stats;
      }
      if (data?.totalMembers !== undefined) {
        return data;
      }
    } catch (err) {
      console.warn("[TeamService] Using local fallback for stats:", err);
    }

    return {
      totalMembers: 0,
      activeBrokers: 0,
      routingActive: 0,
      totalCapacity: 0,
      currentActiveLeads: 0,
      availableCapacity: 0,
      capacityUtilizationPercent: 0,
    };
  }

  /**
   * 2. List all workspace members & agent routing records
   */
  async listMembers(): Promise<TeamMember[]> {
    try {
      const response = await apiClient.get<any>("/api/v1/team/members");
      const data = response?.data || response;
      if (data && Array.isArray(data.members)) {
        return data.members;
      }
      if (Array.isArray(data)) {
        return data;
      }
    } catch (err) {
      console.warn("[TeamService] Using local fallback for members list:", err);
    }

    return [];
  }

  /**
   * 3. Get static role definitions & RBAC guide
   */
  async getRoles(): Promise<RoleDefinition[]> {
    try {
      const response = await apiClient.get<any>("/api/v1/team/roles");
      if (response && Array.isArray(response.roles)) {
        return response.roles;
      }
    } catch (err) {
      // fallback
    }

    return DEFAULT_ROLE_DEFINITIONS;
  }

  /**
   * 4. Invite a new team member
   */
  async inviteMember(payload: InviteMemberPayload): Promise<TeamMember> {
    const response = await apiClient.post<any>("/api/v1/team/members/invite", payload);
    return response.member || response;
  }

  /**
   * 5. Update member role
   */
  async updateRole(memberId: string, payload: UpdateRolePayload): Promise<TeamMember> {
    const response = await apiClient.patch<any>(`/api/v1/team/members/${memberId}/role`, payload);
    return response.member || response;
  }

  /**
   * 6. Update member status (active / suspended)
   */
  async updateStatus(memberId: string, payload: UpdateStatusPayload): Promise<TeamMember> {
    const response = await apiClient.patch<any>(`/api/v1/team/members/${memberId}/status`, payload);
    return response.member || response;
  }

  /**
   * 7. Remove member from workspace
   */
  async removeMember(memberId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<any>(`/api/v1/team/members/${memberId}`);
    return response;
  }

  /**
   * 8. Update agent routing rules & capacity
   */
  async updateAgentRouting(
    agentId: string,
    payload: UpdateAgentRoutingPayload
  ): Promise<any> {
    const response = await apiClient.put<any>(`/api/v1/team/routing/${agentId}`, payload);
    return response.agent || response;
  }

  /**
   * 9. Resend invitation email to pending member
   */
  async resendInvite(memberId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<any>(`/api/v1/team/members/${memberId}/resend-invite`, {});
    return response;
  }

  /**
   * 10. Public: Retrieve invitation details for member onboarding
   */
  async getInvitation(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/api/v1/team/invite/${id}`);
    const data = response?.data || response;
    return data?.invitation || data;
  }

  /**
   * 11. Public: Accept invitation & complete onboarding
   */
  async acceptInvitation(
    id: string,
    payload: { firstName: string; lastName: string; phone?: string; clerkUserId?: string }
  ): Promise<any> {
    const response = await apiClient.post<any>(`/api/v1/team/invite/${id}/accept`, payload);
    const data = response?.data || response;
    return data;
  }
}

export const teamService = new TeamService();

