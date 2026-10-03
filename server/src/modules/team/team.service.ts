import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { eq, and, sql, desc } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { ResendNotificationAdapter } from "../notifications/adapters/resend-notification.adapter";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import {
  InviteMemberDto,
  UpdateMemberRoleDto,
  UpdateMemberStatusDto,
  UpdateAgentRoutingDto,
  AcceptInvitationDto,
} from "./dto/team.dto";
import {
  TeamMemberResponse,
  TeamStatsResponse,
  RoleDefinition,
} from "./interfaces/team.interface";
import { WorkspaceRole } from "../../database/schema/users.schema";
import { ClerkService } from "../../common/auth/clerk.service";

const DEFAULT_BROKERS = [
  {
    name: "Tunde Bakare",
    email: "tunde.bakare@spacia.luxury",
    phone: "+234 803 112 4001",
    roleTitle: "Senior Acquisition Executive",
    territory: "Lekki Phase 1 & Ikate",
    specializations: ["luxury_residential", "waterfront"],
    maxConcurrentLeads: 50,
    routingWeight: 15,
  },
  {
    name: "Ngozi Eze",
    email: "ngozi.eze@spacia.luxury",
    phone: "+234 802 334 5002",
    roleTitle: "Luxury Portfolio Director",
    territory: "Ikoyi & Banana Island",
    specializations: ["luxury_residential", "penthouses", "investment_yield"],
    maxConcurrentLeads: 50,
    routingWeight: 20,
  },
  {
    name: "Femi Adeleke",
    email: "femi.adeleke@spacia.luxury",
    phone: "+234 809 556 7003",
    roleTitle: "Commercial & Waterfront Lead",
    territory: "Victoria Island & Eko Atlantic",
    specializations: ["commercial", "land_development", "waterfront"],
    maxConcurrentLeads: 50,
    routingWeight: 15,
  },
];

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb,
    @Optional()
    private readonly resendAdapter?: ResendNotificationAdapter,
    @Optional()
    private readonly clerkService?: ClerkService
  ) {}

  /**
   * 1. Team KPI summary statistics
   */
  async getStats(workspaceId: string): Promise<TeamStatsResponse> {
    await this.ensureSeedBrokers(workspaceId);

    // 1. Total members count
    const members = await this.db
      .select({ id: schema.workspaceMembers.id, role: schema.workspaceMembers.role, status: schema.workspaceMembers.status })
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.workspaceId, workspaceId));

    const totalMembers = members.length;
    const activeBrokers = members.filter(
      (m) =>
        (m.role === "sales_agent" || m.role === "sales_manager") &&
        m.status === "active"
    ).length;

    // 2. Agents capacity & routing
    const agents = await this.db
      .select({
        id: schema.agents.id,
        status: schema.agents.status,
        isAvailableForRouting: schema.agents.isAvailableForRouting,
        maxConcurrentLeads: schema.agents.maxConcurrentLeads,
      })
      .from(schema.agents)
      .where(eq(schema.agents.workspaceId, workspaceId));

    const routingActive = agents.filter(
      (a) => a.isAvailableForRouting && a.status === "active"
    ).length;

    const totalCapacity = agents
      .filter((a) => a.isAvailableForRouting && a.status === "active")
      .reduce((sum, a) => sum + (a.maxConcurrentLeads || 50), 0);

    // 3. Current active leads count
    const leads = await this.db
      .select({ id: schema.leads.id, status: schema.leads.status })
      .from(schema.leads)
      .where(eq(schema.leads.workspaceId, workspaceId));

    const currentActiveLeads = leads.filter(
      (l) => l.status !== "Lost" && l.status !== "Nurture"
    ).length;

    const availableCapacity = Math.max(0, totalCapacity - currentActiveLeads);
    const capacityUtilizationPercent =
      totalCapacity > 0
        ? Math.min(100, Math.round((currentActiveLeads / totalCapacity) * 100))
        : 0;

    return {
      totalMembers,
      activeBrokers,
      routingActive,
      totalCapacity,
      currentActiveLeads,
      availableCapacity,
      capacityUtilizationPercent,
    };
  }

  /**
   * 2. List all workspace members and agents
   */
  async listMembers(workspaceId: string): Promise<TeamMemberResponse[]> {
    await this.ensureSeedBrokers(workspaceId);

    // Query members with user data
    const memberRows = await this.db
      .select({
        id: schema.workspaceMembers.id,
        workspaceId: schema.workspaceMembers.workspaceId,
        userId: schema.workspaceMembers.userId,
        role: schema.workspaceMembers.role,
        status: schema.workspaceMembers.status,
        invitedEmail: schema.workspaceMembers.invitedEmail,
        invitedAt: schema.workspaceMembers.invitedAt,
        joinedAt: schema.workspaceMembers.joinedAt,
        createdAt: schema.workspaceMembers.createdAt,
        userEmail: schema.users.email,
        userFirstName: schema.users.firstName,
        userLastName: schema.users.lastName,
        userImageUrl: schema.users.imageUrl,
      })
      .from(schema.workspaceMembers)
      .leftJoin(schema.users, eq(schema.workspaceMembers.userId, schema.users.id))
      .where(eq(schema.workspaceMembers.workspaceId, workspaceId))
      .orderBy(desc(schema.workspaceMembers.createdAt));

    // Query all agents for workspace
    const agentRows = await this.db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.workspaceId, workspaceId));

    // Lead assignment count per agent
    const leads = await this.db
      .select({
        id: schema.leads.id,
        assignedAgentId: schema.leads.assignedAgentId,
        status: schema.leads.status,
      })
      .from(schema.leads)
      .where(eq(schema.leads.workspaceId, workspaceId));

    return memberRows.map((m) => {
      const matchingAgent = agentRows.find(
        (a) => a.userId === m.userId || a.email.toLowerCase() === (m.userEmail || "").toLowerCase()
      );

      let agentData = null;
      if (matchingAgent) {
        const assignedLeadsCount = leads.filter(
          (l) =>
            l.assignedAgentId === matchingAgent.id &&
            l.status !== "Lost" &&
            l.status !== "Nurture"
        ).length;

        agentData = {
          id: matchingAgent.id,
          name: matchingAgent.name,
          email: matchingAgent.email,
          phone: matchingAgent.phone,
          avatarUrl: matchingAgent.avatarUrl,
          roleTitle: matchingAgent.roleTitle,
          status: matchingAgent.status as "active" | "busy" | "offline",
          territory: matchingAgent.territory || "Lagos Prime",
          specializations: matchingAgent.specializations || ["luxury_residential"],
          routingWeight: matchingAgent.routingWeight ?? 10,
          isAvailableForRouting: matchingAgent.isAvailableForRouting ?? true,
          maxConcurrentLeads: matchingAgent.maxConcurrentLeads ?? 50,
          activeLeadsCount: assignedLeadsCount,
        };
      }

      return {
        id: m.id,
        workspaceId: m.workspaceId,
        userId: m.userId,
        role: m.role as WorkspaceRole,
        status: (m.status as any) || "active",
        invitedEmail: m.invitedEmail,
        invitedAt: m.invitedAt,
        joinedAt: m.joinedAt,
        createdAt: m.createdAt,
        user: {
          id: m.userId,
          email: m.userEmail || m.invitedEmail || `${m.userId}@pacia.luxury`,
          firstName: m.userFirstName,
          lastName: m.userLastName,
          imageUrl: m.userImageUrl,
        },
        agent: agentData,
      };
    });
  }

  /**
   * 3. Invite a new team member with role & optional agent routing profile
   */
  async inviteMember(
    tenant: TenantContext,
    dto: InviteMemberDto
  ): Promise<TeamMemberResponse> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Check if an active member with this email already belongs to workspace
    const existingMembers = await this.listMembers(tenant.workspaceId);
    const existing = existingMembers.find(
      (m) =>
        m.user.email.toLowerCase() === normalizedEmail ||
        (m.invitedEmail && m.invitedEmail.toLowerCase() === normalizedEmail)
    );

    if (existing) {
      throw new ConflictException(
        `A team member with email '${dto.email}' already exists in this workspace.`
      );
    }

    // 2. Caller role validation: only owner or admin can invite members
    if (tenant.role !== "owner" && tenant.role !== "admin") {
      throw new ForbiddenException(
        "Only workspace owners and administrators can invite team members."
      );
    }

    // Only owners can invite someone as owner
    if (dto.role === "owner" && tenant.role !== "owner") {
      throw new ForbiddenException(
        "Only existing workspace owners can grant the Owner role to new members."
      );
    }

    // 3. Provision user record (reuse existing user if email already registered)
    const [existingUser] = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(sql`LOWER(${schema.users.email}) = LOWER(${normalizedEmail})`)
      .limit(1);

    const firstName = dto.firstName || dto.email.split("@")[0];
    const lastName = dto.lastName || "Broker";
    let targetUserId = existingUser?.id;

    // Check Clerk for existing user with this email
    let clerkUserId: string | null = null;
    if (this.clerkService) {
      try {
        const clerkUsers = await this.clerkService.getClient().users.getUserList({
          emailAddress: [normalizedEmail],
          limit: 1,
        });
        if (clerkUsers.data && clerkUsers.data.length > 0) {
          clerkUserId = clerkUsers.data[0].id;
        }
      } catch (err: any) {
        this.logger.debug(`Could not lookup Clerk user by email: ${err?.message}`);
      }
    }

    if (clerkUserId) {
      targetUserId = clerkUserId;
    } else if (!targetUserId) {
      targetUserId = `user_spacia_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    if (!existingUser) {
      await this.db
        .insert(schema.users)
        .values({
          id: targetUserId,
          email: normalizedEmail,
          firstName,
          lastName,
          imageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            `${firstName} ${lastName}`
          )}`,
        });
    } else if (clerkUserId && existingUser.id !== clerkUserId) {
      // Cascade update to real Clerk ID
      await this.db
        .update(schema.users)
        .set({ id: clerkUserId, updatedAt: new Date() })
        .where(eq(schema.users.email, normalizedEmail));
    }

    // 4. Provision workspace_members record (status: invited until accepted)
    const [createdMember] = await this.db
      .insert(schema.workspaceMembers)
      .values({
        workspaceId: tenant.workspaceId,
        userId: targetUserId,
        role: dto.role,
        status: "invited",
        invitedEmail: normalizedEmail,
        invitedAt: new Date(),
        joinedAt: null,
      })
      .returning();

    // 4b. Synchronize with Clerk Organization if applicable
    if (this.clerkService && tenant.workspaceId.startsWith("org_")) {
      const orgRole = dto.role === "admin" || dto.role === "owner" ? "org:admin" : "org:member";
      if (clerkUserId) {
        try {
          await this.clerkService.getClient().organizations.createOrganizationMembership({
            organizationId: tenant.workspaceId,
            userId: clerkUserId,
            role: orgRole,
          });
          this.logger.log(`Added Clerk organization membership for '${normalizedEmail}' in '${tenant.workspaceId}'`);
        } catch (err: any) {
          this.logger.debug(`Clerk org membership already exists or skipped: ${err?.message}`);
        }
      } else {
        try {
          await this.clerkService.getClient().organizations.createOrganizationInvitation({
            organizationId: tenant.workspaceId,
            emailAddress: normalizedEmail,
            role: orgRole,
            inviterUserId: tenant.userId.startsWith("user_") ? tenant.userId : undefined,
          });
          this.logger.log(`Created Clerk organization invitation for '${normalizedEmail}' in '${tenant.workspaceId}'`);
        } catch (err: any) {
          this.logger.debug(`Clerk org invitation already exists or skipped: ${err?.message}`);
        }
      }
    }

    // 5. If role is sales_agent or sales_manager, create agent routing profile
    let createdAgent = null;
    if (dto.role === "sales_agent" || dto.role === "sales_manager") {
      const [agentRecord] = await this.db
        .insert(schema.agents)
        .values({
          workspaceId: tenant.workspaceId,
          userId: targetUserId,
          name: `${firstName} ${lastName}`.trim(),
          email: normalizedEmail,
          phone: dto.phone || "+234 800 000 0000",
          roleTitle: dto.roleTitle || (dto.role === "sales_manager" ? "Sales Director" : "Sales Associate"),
          territory: dto.territory || "Lagos Prime",
          specializations: dto.specializations || ["luxury_residential"],
          routingWeight: dto.routingWeight || 10,
          maxConcurrentLeads: dto.maxConcurrentLeads || 50,
          status: "active",
          isAvailableForRouting: true,
        })
        .returning();

      createdAgent = agentRecord;
    }

    // 6. Record compliance audit log
    try {
      await this.db.insert(schema.auditLogs).values({
        workspaceId: tenant.workspaceId,
        actorId: tenant.userId,
        actorType: "user",
        action: "team:member_invited",
        resource: "workspace_members",
        metadata: {
          email: normalizedEmail,
          role: dto.role,
          resourceId: createdMember.id,
          invitedBy: tenant.userId,
        },
      });
    } catch {}

    // 7. Dispatch invitation email via Resend
    let workspaceName = "SpaciaOS Luxury Agency";
    try {
      const [ws] = await this.db
        .select({ name: schema.workspaces.name })
        .from(schema.workspaces)
        .where(eq(schema.workspaces.id, tenant.workspaceId))
        .limit(1);
      if (ws?.name) workspaceName = ws.name;
    } catch {}

    await this.sendInvitationEmail(normalizedEmail, firstName, dto.role, workspaceName, createdMember.id);

    this.logger.log(
      `Invited member '${normalizedEmail}' as role '${dto.role}' in workspace '${tenant.workspaceId}'`
    );

    return {
      id: createdMember.id,
      workspaceId: createdMember.workspaceId,
      userId: targetUserId,
      role: createdMember.role as WorkspaceRole,
      status: (createdMember.status as any) || "invited",
      invitedEmail: normalizedEmail,
      invitedAt: createdMember.invitedAt,
      joinedAt: createdMember.joinedAt,
      createdAt: createdMember.createdAt,
      user: {
        id: targetUserId,
        email: normalizedEmail,
        firstName,
        lastName,
      },
      agent: createdAgent
        ? {
            id: createdAgent.id,
            name: createdAgent.name,
            email: createdAgent.email,
            phone: createdAgent.phone,
            roleTitle: createdAgent.roleTitle,
            status: createdAgent.status as any,
            territory: createdAgent.territory,
            specializations: createdAgent.specializations,
            routingWeight: createdAgent.routingWeight,
            isAvailableForRouting: createdAgent.isAvailableForRouting,
            maxConcurrentLeads: createdAgent.maxConcurrentLeads,
            activeLeadsCount: 0,
          }
        : null,
    };
  }

  /**
   * 4. Update member role with owner protection guardrails
   */
  async updateRole(
    tenant: TenantContext,
    memberId: string,
    dto: UpdateMemberRoleDto
  ): Promise<TeamMemberResponse> {
    const [member] = await this.db
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.id, memberId),
          eq(schema.workspaceMembers.workspaceId, tenant.workspaceId)
        )
      )
      .limit(1);

    if (!member) {
      throw new NotFoundException(`Team member '${memberId}' not found.`);
    }

    // Owner protection guardrails
    if (member.role === "owner" && dto.role !== "owner") {
      const allOwners = await this.db
        .select()
        .from(schema.workspaceMembers)
        .where(
          and(
            eq(schema.workspaceMembers.workspaceId, tenant.workspaceId),
            eq(schema.workspaceMembers.role, "owner")
          )
        );

      if (allOwners.length <= 1) {
        throw new BadRequestException(
          "Cannot demote the sole workspace owner. Assign another owner before transferring or demoting this role."
        );
      }
    }

    // Admin elevation check: only owners can grant owner role
    if (dto.role === "owner" && tenant.role !== "owner") {
      throw new ForbiddenException(
        "Only workspace owners can promote members to the Owner role."
      );
    }

    const [updated] = await this.db
      .update(schema.workspaceMembers)
      .set({
        role: dto.role,
      })
      .where(eq(schema.workspaceMembers.id, memberId))
      .returning();

    // Audit log
    try {
      await this.db.insert(schema.auditLogs).values({
        workspaceId: tenant.workspaceId,
        actorId: tenant.userId,
        actorType: "user",
        action: "team:role_updated",
        resource: "workspace_members",
        metadata: {
          previousRole: member.role,
          newRole: dto.role,
          resourceId: memberId,
          updatedBy: tenant.userId,
        },
      });
    } catch {}

    const members = await this.listMembers(tenant.workspaceId);
    const updatedMember = members.find((m) => m.id === memberId);
    return updatedMember!;
  }

  /**
   * 5. Update member status (Active, Suspended)
   */
  async updateStatus(
    tenant: TenantContext,
    memberId: string,
    dto: UpdateMemberStatusDto
  ): Promise<TeamMemberResponse> {
    const [member] = await this.db
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.id, memberId),
          eq(schema.workspaceMembers.workspaceId, tenant.workspaceId)
        )
      )
      .limit(1);

    if (!member) {
      throw new NotFoundException(`Team member '${memberId}' not found.`);
    }

    // Cannot suspend sole owner
    if (member.role === "owner" && dto.status === "suspended") {
      const allOwners = await this.db
        .select()
        .from(schema.workspaceMembers)
        .where(
          and(
            eq(schema.workspaceMembers.workspaceId, tenant.workspaceId),
            eq(schema.workspaceMembers.role, "owner"),
            eq(schema.workspaceMembers.status, "active")
          )
        );

      if (allOwners.length <= 1) {
        throw new BadRequestException("Cannot suspend the sole active workspace owner.");
      }
    }

    await this.db
      .update(schema.workspaceMembers)
      .set({
        status: dto.status,
      })
      .where(eq(schema.workspaceMembers.id, memberId));

    // Also update agent availability if applicable
    if (dto.status === "suspended") {
      await this.db
        .update(schema.agents)
        .set({
          status: "offline",
          isAvailableForRouting: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.agents.workspaceId, tenant.workspaceId),
            eq(schema.agents.userId, member.userId)
          )
        );
    } else if (dto.status === "active") {
      await this.db
        .update(schema.agents)
        .set({
          status: "active",
          isAvailableForRouting: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.agents.workspaceId, tenant.workspaceId),
            eq(schema.agents.userId, member.userId)
          )
        );
    }

    const members = await this.listMembers(tenant.workspaceId);
    return members.find((m) => m.id === memberId)!;
  }

  /**
   * 6. Remove member from workspace
   */
  async removeMember(
    tenant: TenantContext,
    memberId: string
  ): Promise<{ success: boolean; message: string }> {
    const [member] = await this.db
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.id, memberId),
          eq(schema.workspaceMembers.workspaceId, tenant.workspaceId)
        )
      )
      .limit(1);

    if (!member) {
      throw new NotFoundException(`Team member '${memberId}' not found.`);
    }

    if (member.role === "owner") {
      const allOwners = await this.db
        .select()
        .from(schema.workspaceMembers)
        .where(
          and(
            eq(schema.workspaceMembers.workspaceId, tenant.workspaceId),
            eq(schema.workspaceMembers.role, "owner")
          )
        );

      if (allOwners.length <= 1) {
        throw new BadRequestException("Cannot remove the sole workspace owner.");
      }
    }

    await this.db
      .delete(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.id, memberId));

    // Deactivate agent if exists
    await this.db
      .update(schema.agents)
      .set({
        status: "offline",
        isAvailableForRouting: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.agents.workspaceId, tenant.workspaceId),
          eq(schema.agents.userId, member.userId)
        )
      );

    try {
      await this.db.insert(schema.auditLogs).values({
        workspaceId: tenant.workspaceId,
        actorId: tenant.userId,
        actorType: "user",
        action: "team:member_removed",
        resource: "workspace_members",
        metadata: {
          removedUserId: member.userId,
          removedRole: member.role,
          resourceId: memberId,
          removedBy: tenant.userId,
        },
      });
    } catch {}

    return {
      success: true,
      message: "Team member successfully removed from workspace.",
    };
  }

  /**
   * 7. Update agent routing rules (territory, specializations, weights, capacity)
   */
  async updateAgentRouting(
    tenant: TenantContext,
    agentId: string,
    dto: UpdateAgentRoutingDto
  ) {
    const [agent] = await this.db
      .select()
      .from(schema.agents)
      .where(
        and(
          eq(schema.agents.id, agentId),
          eq(schema.agents.workspaceId, tenant.workspaceId)
        )
      )
      .limit(1);

    if (!agent) {
      throw new NotFoundException(`Agent '${agentId}' not found in workspace.`);
    }

    const updates: Partial<typeof schema.agents.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.territory !== undefined) updates.territory = dto.territory;
    if (dto.specializations !== undefined) updates.specializations = dto.specializations;
    if (dto.routingWeight !== undefined) updates.routingWeight = dto.routingWeight;
    if (dto.isAvailableForRouting !== undefined) updates.isAvailableForRouting = dto.isAvailableForRouting;
    if (dto.maxConcurrentLeads !== undefined) updates.maxConcurrentLeads = dto.maxConcurrentLeads;
    if (dto.status !== undefined) updates.status = dto.status;

    const [updated] = await this.db
      .update(schema.agents)
      .set(updates)
      .where(eq(schema.agents.id, agentId))
      .returning();

    return updated;
  }

  /**
   * 8. Static role definitions & RBAC permissions guide
   */
  getRoleDefinitions(): RoleDefinition[] {
    return [
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
  }

  /**
   * Helper: Ensure default SpaciaOS brokers exist for a luxury workspace
   */
  private async ensureSeedBrokers(workspaceId: string): Promise<void> {
    try {
      if (
        process.env.NODE_ENV !== "test" &&
        !workspaceId.startsWith("ws_test_") &&
        !workspaceId.startsWith("ws_day23_")
      ) {
        return;
      }

      const existingAgents = await this.db
        .select({ id: schema.agents.id })
        .from(schema.agents)
        .where(eq(schema.agents.workspaceId, workspaceId))
        .limit(1);

      if (existingAgents.length > 0) return;

      this.logger.log(`Provisioning baseline luxury brokers for workspace '${workspaceId}'...`);

      for (const b of DEFAULT_BROKERS) {
        const userId = `user_spacia_${b.name.toLowerCase().replace(/[^a-z]/g, "")}`;
        const [firstName, ...rest] = b.name.split(" ");
        const lastName = rest.join(" ");

        await this.db
          .insert(schema.users)
          .values({
            id: userId,
            email: b.email,
            firstName,
            lastName,
            imageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(b.name)}`,
          })
          .onConflictDoNothing();

        await this.db
          .insert(schema.workspaceMembers)
          .values({
            workspaceId,
            userId,
            role: "sales_agent",
            status: "active",
            invitedEmail: b.email,
          })
          .onConflictDoNothing();

        await this.db
          .insert(schema.agents)
          .values({
            workspaceId,
            userId,
            name: b.name,
            email: b.email,
            phone: b.phone,
            roleTitle: b.roleTitle,
            territory: b.territory,
            specializations: b.specializations,
            maxConcurrentLeads: b.maxConcurrentLeads,
            routingWeight: b.routingWeight,
            status: "active",
            isAvailableForRouting: true,
          })
          .onConflictDoNothing();
      }
    } catch (err: any) {
      this.logger.debug(`Seed brokers check skipped: ${err.message}`);
    }
  }

  /**
   * Resend invitation email to an existing pending/invited member
   */
  async resendInvitation(
    tenant: TenantContext,
    memberId: string
  ): Promise<{ success: boolean; message: string }> {
    const [member] = await this.db
      .select({
        id: schema.workspaceMembers.id,
        role: schema.workspaceMembers.role,
        status: schema.workspaceMembers.status,
        invitedEmail: schema.workspaceMembers.invitedEmail,
        userId: schema.workspaceMembers.userId,
      })
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.id, memberId),
          eq(schema.workspaceMembers.workspaceId, tenant.workspaceId)
        )
      )
      .limit(1);

    if (!member) {
      throw new NotFoundException(`Team member '${memberId}' not found.`);
    }

    if (member.status !== "invited" && member.status !== "pending") {
      throw new BadRequestException("This team member has already joined and is currently active.");
    }

    const email = member.invitedEmail;
    if (!email) {
      throw new BadRequestException("No invitation email recorded for this team member.");
    }

    const [user] = await this.db
      .select({ firstName: schema.users.firstName })
      .from(schema.users)
      .where(eq(schema.users.id, member.userId))
      .limit(1);

    const firstName = user?.firstName || email.split("@")[0];

    let workspaceName = "SpaciaOS Luxury Agency";
    try {
      const [ws] = await this.db
        .select({ name: schema.workspaces.name })
        .from(schema.workspaces)
        .where(eq(schema.workspaces.id, tenant.workspaceId))
        .limit(1);
      if (ws?.name) workspaceName = ws.name;
    } catch {}

    await this.sendInvitationEmail(email, firstName, member.role, workspaceName, member.id);

    return {
      success: true,
      message: `Invitation email resent successfully to ${email}.`,
    };
  }

  /**
   * Helper: Dispatches luxury branded workspace invitation email
   */
  private async sendInvitationEmail(
    toEmail: string,
    firstName: string,
    role: string,
    workspaceName: string,
    memberId?: string
  ): Promise<void> {
    if (!this.resendAdapter) return;

    const roleTitleMap: Record<string, string> = {
      owner: "Workspace Owner",
      admin: "Operations Administrator",
      sales_manager: "Sales Director / Manager",
      sales_agent: "Licensed Luxury Broker",
    };
    const roleTitle = roleTitleMap[role] || "Team Member";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = memberId
      ? `${baseUrl}/invite/${memberId}`
      : `${baseUrl}/sign-up?invitedEmail=${encodeURIComponent(toEmail)}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #ffffff; color: #1c1917; border: 1px solid #e7e5e4; border-radius: 12px;">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 18px; font-weight: 700; color: #0d4a36; letter-spacing: -0.02em;">SpaciaOS<span style="color: #059669;">OS</span></span>
          <span style="font-size: 11px; margin-left: 8px; background: #ecfdf5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: 600;">WORKSPACE INVITATION</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; color: #1c1917; margin: 0 0 12px 0;">You've been invited to join ${workspaceName}</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #44403c; margin: 0 0 20px 0;">
          Hello ${firstName},<br/><br/>
          You have been granted access to the <strong>${workspaceName}</strong> workspace on SpaciaOS with the role of <strong>${roleTitle}</strong>.
        </p>
        <div style="margin: 28px 0;">
          <a href="${inviteLink}" style="display: inline-block; background: #0d4a36; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: 600; border-radius: 8px; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            Accept Invitation &amp; Join Workspace &rarr;
          </a>
        </div>
        <p style="font-size: 12px; color: #78716c; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f5f5f4; padding-top: 16px;">
          If the button above does not work, copy and paste this link into your browser:<br/>
          <a href="${inviteLink}" style="color: #0d4a36; word-break: break-all;">${inviteLink}</a>
        </p>
      </div>
    `;

    try {
      await this.resendAdapter.sendEmail({
        to: toEmail,
        subject: `You've been invited to join ${workspaceName} on SpaciaOS`,
        html,
        text: `You have been invited to join ${workspaceName} on SpaciaOS as ${roleTitle}. Accept your invitation here: ${inviteLink}`,
      });
      this.logger.log(`[TeamService] Invitation email successfully dispatched to ${toEmail}`);
    } catch (err: any) {
      this.logger.warn(`[TeamService] Failed to dispatch invitation email to ${toEmail}: ${err.message}`);
    }
  }

  /**
   * Public: Retrieve invitation details for member onboarding
   */
  async getInvitation(memberId: string) {
    const [member] = await this.db
      .select({
        id: schema.workspaceMembers.id,
        workspaceId: schema.workspaceMembers.workspaceId,
        userId: schema.workspaceMembers.userId,
        role: schema.workspaceMembers.role,
        status: schema.workspaceMembers.status,
        invitedEmail: schema.workspaceMembers.invitedEmail,
        invitedAt: schema.workspaceMembers.invitedAt,
        joinedAt: schema.workspaceMembers.joinedAt,
        createdAt: schema.workspaceMembers.createdAt,
      })
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.id, memberId))
      .limit(1);

    if (!member) {
      throw new NotFoundException("Invitation link not found or expired.");
    }

    const [workspace] = await this.db
      .select({ id: schema.workspaces.id, name: schema.workspaces.name, slug: schema.workspaces.slug })
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, member.workspaceId))
      .limit(1);

    let user = null;
    if (member.userId) {
      const [foundUser] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, member.userId))
        .limit(1);
      user = foundUser;
    }

    // Try finding matching agent
    const [agent] = await this.db
      .select()
      .from(schema.agents)
      .where(
        and(
          eq(schema.agents.workspaceId, member.workspaceId),
          sql`(${schema.agents.userId} = ${member.userId} OR LOWER(${schema.agents.email}) = LOWER(${member.invitedEmail || user?.email || ""}))`
        )
      )
      .limit(1);

    const roleDefinitions = this.getRoleDefinitions();
    const roleDef = roleDefinitions.find((r) => r.role === member.role);
    const targetEmail = (member.invitedEmail || user?.email || "").toLowerCase().trim();

    let hasClerkAccount = false;
    if (this.clerkService && targetEmail) {
      try {
        const clerkUsers = await this.clerkService.getClient().users.getUserList({
          emailAddress: [targetEmail],
          limit: 1,
        });
        hasClerkAccount = Boolean(clerkUsers.data && clerkUsers.data.length > 0);
      } catch {}
    }

    return {
      id: member.id,
      workspaceId: member.workspaceId,
      workspaceName: workspace?.name || "SpaciaOS Luxury Agency",
      email: targetEmail,
      hasClerkAccount,
      role: member.role,
      roleTitle: roleDef?.title || member.role,
      roleDescription: roleDef?.description || "",
      badgeVariant: roleDef?.badgeVariant || "sky",
      status: member.status,
      isAccepted: member.status === "active",
      invitedAt: member.invitedAt,
      joinedAt: member.joinedAt,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: agent?.phone || "",
      agent: agent
        ? {
            roleTitle: agent.roleTitle,
            territory: agent.territory,
            specializations: agent.specializations,
            phone: agent.phone,
          }
        : null,
    };
  }

  /**
   * Public: Accept workspace invitation and complete agent onboarding
   */
  async acceptInvitation(memberId: string, dto: AcceptInvitationDto) {
    const [member] = await this.db
      .select()
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.id, memberId))
      .limit(1);

    if (!member) {
      throw new NotFoundException("Invitation link not found or expired.");
    }

    if (member.status === "active") {
      return {
        success: true,
        alreadyActive: true,
        message: "Invitation has already been accepted.",
        workspaceId: member.workspaceId,
      };
    }

    const now = new Date();
    const fullName = `${dto.firstName} ${dto.lastName}`.trim();

    // 1. Update workspace member status to active
    await this.db
      .update(schema.workspaceMembers)
      .set({
        status: "active",
        joinedAt: now,
      })
      .where(eq(schema.workspaceMembers.id, memberId));

    // Resolve real Clerk user ID if available
    let resolvedClerkUserId = dto.clerkUserId;
    if (!resolvedClerkUserId && this.clerkService && member.invitedEmail) {
      try {
        const clerkUsers = await this.clerkService.getClient().users.getUserList({
          emailAddress: [member.invitedEmail.toLowerCase().trim()],
          limit: 1,
        });
        if (clerkUsers.data && clerkUsers.data.length > 0) {
          resolvedClerkUserId = clerkUsers.data[0].id;
        }
      } catch {}
    }

    // 2. Update user profile if exists
    if (member.userId) {
      await this.db
        .update(schema.users)
        .set({
          firstName: dto.firstName,
          lastName: dto.lastName,
          imageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
          updatedAt: now,
        })
        .where(eq(schema.users.id, member.userId));

      if (resolvedClerkUserId && member.userId !== resolvedClerkUserId) {
        await this.db
          .update(schema.users)
          .set({ id: resolvedClerkUserId, updatedAt: now })
          .where(eq(schema.users.id, member.userId));
      }
    }

    // Ensure member is in Clerk Organization
    if (this.clerkService && resolvedClerkUserId && member.workspaceId.startsWith("org_")) {
      const orgRole = member.role === "admin" || member.role === "owner" ? "org:admin" : "org:member";
      try {
        await this.clerkService.getClient().organizations.createOrganizationMembership({
          organizationId: member.workspaceId,
          userId: resolvedClerkUserId,
          role: orgRole,
        });
      } catch (err: any) {
        this.logger.debug(`Clerk membership add skipped: ${err?.message}`);
      }
    }

    // 3. Update agent record if exists
    const [agent] = await this.db
      .select()
      .from(schema.agents)
      .where(
        and(
          eq(schema.agents.workspaceId, member.workspaceId),
          sql`(${schema.agents.userId} = ${member.userId} OR LOWER(${schema.agents.email}) = LOWER(${member.invitedEmail || ""}))`
        )
      )
      .limit(1);

    if (agent) {
      await this.db
        .update(schema.agents)
        .set({
          name: fullName,
          phone: dto.phone || agent.phone,
          status: "active",
          isAvailableForRouting: true,
          updatedAt: now,
        })
        .where(eq(schema.agents.id, agent.id));
    }

    // 4. Audit trail
    try {
      await this.db.insert(schema.auditLogs).values({
        workspaceId: member.workspaceId,
        actorId: resolvedClerkUserId || member.userId || "user_invited",
        actorType: "user",
        action: "team:member_accepted_invite",
        resource: "workspace_members",
        metadata: {
          memberId: member.id,
          role: member.role,
          name: fullName,
          email: member.invitedEmail,
        },
      });
    } catch {}

    this.logger.log(
      `Invitation ${memberId} accepted by '${fullName}' (${member.invitedEmail}) in workspace '${member.workspaceId}'`
    );

    return {
      success: true,
      message: "Welcome to SpaciaOS! Your profile has been activated.",
      workspaceId: member.workspaceId,
      hasClerkAccount: Boolean(resolvedClerkUserId),
    };
  }
}
