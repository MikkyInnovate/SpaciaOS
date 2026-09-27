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

const FALLBACK_MEMBERS: TeamMember[] = [
  {
    id: "mem_tunde_bakare",
    workspaceId: "default",
    userId: "user_spacia_tundebakare",
    role: "sales_agent",
    status: "active",
    createdAt: new Date().toISOString(),
    user: {
      id: "user_spacia_tundebakare",
      email: "tunde.bakare@spacia.luxury",
      firstName: "Tunde",
      lastName: "Bakare",
      imageUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Tunde%20Bakare",
    },
    agent: {
      id: "agent_tunde",
      name: "Tunde Bakare",
      email: "tunde.bakare@spacia.luxury",
      phone: "+234 803 112 4001",
      roleTitle: "Senior Acquisition Executive",
      status: "active",
      territory: "Lekki Phase 1 & Ikate",
      specializations: ["luxury_residential", "waterfront"],
      routingWeight: 15,
      isAvailableForRouting: true,
      maxConcurrentLeads: 50,
      activeLeadsCount: 14,
    },
  },
  {
    id: "mem_ngozi_eze",
    workspaceId: "default",
    userId: "user_spacia_ngozieze",
    role: "sales_manager",
    status: "active",
    createdAt: new Date().toISOString(),
    user: {
      id: "user_spacia_ngozieze",
      email: "ngozi.eze@spacia.luxury",
      firstName: "Ngozi",
      lastName: "Eze",
      imageUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Ngozi%20Eze",
    },
    agent: {
      id: "agent_ngozi",
      name: "Ngozi Eze",
      email: "ngozi.eze@spacia.luxury",
      phone: "+234 802 334 5002",
      roleTitle: "Luxury Portfolio Director",
      status: "active",
      territory: "Ikoyi & Banana Island",
      specializations: ["luxury_residential", "penthouses", "investment_yield"],
      routingWeight: 20,
      isAvailableForRouting: true,
      maxConcurrentLeads: 50,
      activeLeadsCount: 19,
    },
  },
  {
    id: "mem_femi_adeleke",
    workspaceId: "default",
    userId: "user_spacia_femiadeleke",
    role: "sales_agent",
    status: "active",
    createdAt: new Date().toISOString(),
    user: {
      id: "user_spacia_femiadeleke",
      email: "femi.adeleke@spacia.luxury",
      firstName: "Femi",
      lastName: "Adeleke",
      imageUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Femi%20Adeleke",
    },
    agent: {
      id: "agent_femi",
      name: "Femi Adeleke",
      email: "femi.adeleke@spacia.luxury",
      phone: "+234 809 556 7003",
      roleTitle: "Commercial & Waterfront Lead",
      status: "active",
      territory: "Victoria Island & Eko Atlantic",
      specializations: ["commercial", "land_development", "waterfront"],
      routingWeight: 15,
      isAvailableForRouting: true,
      maxConcurrentLeads: 50,
      activeLeadsCount: 11,
    },
  },
];

class TeamService {
  /**
   * 1. Get team KPI metrics & capacity
   */
  async getStats(): Promise<TeamStats> {
    try {
      const response = await apiClient.get<any>("/api/v1/team/stats");
      if (response && response.stats) {
        return response.stats;
      }
      if (response && response.totalMembers !== undefined) {
        return response;
      }
    } catch (err) {
      console.warn("[TeamService] Using local fallback for stats:", err);
    }

    return {
      totalMembers: FALLBACK_MEMBERS.length,
      activeBrokers: FALLBACK_MEMBERS.filter((m) => m.agent !== null && m.status === "active").length,
      routingActive: FALLBACK_MEMBERS.filter((m) => m.agent?.isAvailableForRouting).length,
      totalCapacity: 150,
      currentActiveLeads: 44,
      availableCapacity: 106,
      capacityUtilizationPercent: 29,
    };
  }

  /**
   * 2. List all workspace members & agent routing records
   */
  async listMembers(): Promise<TeamMember[]> {
    try {
      const response = await apiClient.get<any>("/api/v1/team/members");
      if (response && Array.isArray(response.members)) {
        return response.members;
      }
      if (Array.isArray(response)) {
        return response;
      }
    } catch (err) {
      console.warn("[TeamService] Using local fallback for members list:", err);
    }

    return FALLBACK_MEMBERS;
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
}

export const teamService = new TeamService();
