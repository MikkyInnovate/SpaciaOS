import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ClerkAuthGuard } from "../../common/auth/clerk-auth.guard";
import { WorkspaceMemberGuard } from "../../common/auth/workspace-member.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { TeamService } from "./team.service";
import {
  InviteMemberDto,
  UpdateMemberRoleDto,
  UpdateMemberStatusDto,
  UpdateAgentRoutingDto,
} from "./dto/team.dto";

@Controller("team")
@UseGuards(ClerkAuthGuard, WorkspaceMemberGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  /**
   * 1. Team stats & capacity metrics
   */
  @Get("stats")
  @RequirePermissions("members:read")
  async getStats(@CurrentTenant() tenant: TenantContext) {
    const stats = await this.teamService.getStats(tenant.workspaceId);
    return {
      success: true,
      stats,
    };
  }

  /**
   * 2. Full team roster & member states
   */
  @Get("members")
  @RequirePermissions("members:read")
  async listMembers(@CurrentTenant() tenant: TenantContext) {
    const members = await this.teamService.listMembers(tenant.workspaceId);
    return {
      success: true,
      members,
      total: members.length,
    };
  }

  /**
   * 3. Invite a new team member
   */
  @Post("members/invite")
  @RequirePermissions("members:manage")
  async inviteMember(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: InviteMemberDto
  ) {
    const member = await this.teamService.inviteMember(tenant, dto);
    return {
      success: true,
      member,
      message: `Invitation sent to ${dto.email} as ${dto.role}.`,
    };
  }

  /**
   * 4. Assign or mutate member role with owner protection guardrails
   */
  @Patch("members/:id/role")
  @RequirePermissions("members:manage")
  async updateMemberRole(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") memberId: string,
    @Body() dto: UpdateMemberRoleDto
  ) {
    const member = await this.teamService.updateRole(tenant, memberId, dto);
    return {
      success: true,
      member,
      message: `Member role successfully updated to ${dto.role}.`,
    };
  }

  /**
   * 5. Update member status (Active / Suspended)
   */
  @Patch("members/:id/status")
  @RequirePermissions("members:manage")
  async updateMemberStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") memberId: string,
    @Body() dto: UpdateMemberStatusDto
  ) {
    const member = await this.teamService.updateStatus(tenant, memberId, dto);
    return {
      success: true,
      member,
      message: `Member status updated to ${dto.status}.`,
    };
  }

  /**
   * 6. Remove member from workspace
   */
  @Delete("members/:id")
  @RequirePermissions("members:manage")
  async removeMember(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") memberId: string
  ) {
    const result = await this.teamService.removeMember(tenant, memberId);
    return result;
  }

  /**
   * 7. Agent routing data & capacity
   */
  @Get("routing")
  @RequirePermissions("members:read")
  async getRoutingRoster(@CurrentTenant() tenant: TenantContext) {
    const members = await this.teamService.listMembers(tenant.workspaceId);
    const agentRoster = members
      .filter((m) => m.agent !== null)
      .map((m) => ({
        memberId: m.id,
        user: m.user,
        role: m.role,
        agent: m.agent,
      }));

    return {
      success: true,
      routingRoster: agentRoster,
    };
  }

  /**
   * 8. Update agent routing rules (territory, specializations, weight, capacity)
   */
  @Put("routing/:agentId")
  @RequirePermissions("members:manage")
  async updateAgentRouting(
    @CurrentTenant() tenant: TenantContext,
    @Param("agentId") agentId: string,
    @Body() dto: UpdateAgentRoutingDto
  ) {
    const agent = await this.teamService.updateAgentRouting(
      tenant,
      agentId,
      dto
    );
    return {
      success: true,
      agent,
      message: "Agent routing configuration updated.",
    };
  }

  /**
   * 9. Static role definitions & RBAC permissions guide
   */
  @Get("roles")
  @RequirePermissions("members:read")
  async getRoles() {
    const roles = this.teamService.getRoleDefinitions();
    return {
      success: true,
      roles,
    };
  }
}
