import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ClerkAuthGuard } from "./clerk-auth.guard";
import { WorkspaceMemberGuard } from "./workspace-member.guard";
import { SkipMembershipCheck } from "./skip-membership-check.decorator";
import { CurrentTenant } from "../tenant/tenant.decorator";
import { TenantContext } from "../tenant/tenant-context.interface";
import { ProvisioningService } from "../../modules/workspaces/provisioning.service";
import { UsersRepository } from "../../modules/users/users.repository";
import { WorkspacesRepository } from "../../modules/workspaces/workspaces.repository";
import { SyncProfileDto } from "./dto/sync-profile.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly provisioningService: ProvisioningService,
    private readonly usersRepo: UsersRepository,
    private readonly workspacesRepo: WorkspacesRepository
  ) {}

  /**
   * GET /api/v1/auth/me
   * 
   * Returns the verified Clerk identity, DB workspace membership, Pacia application role,
   * and permissions. Requires valid database membership.
   */
  @Get("me")
  async getMe(@CurrentTenant() tenant: TenantContext, @Req() req: any) {
    const user = await this.usersRepo.findById(tenant.userId);
    const workspace = await this.workspacesRepo.findById(tenant.workspaceId);
    const membership = req.membership;

    return {
      userId: tenant.userId,
      workspaceId: tenant.workspaceId,
      paciaRole: tenant.role,
      permissions: tenant.permissions,
      user: user || { id: tenant.userId },
      workspace: workspace || { id: tenant.workspaceId },
      membership: membership || null,
    };
  }

  /**
   * POST /api/v1/auth/sync
   * 
   * Dedicated, explicit onboarding and synchronization endpoint.
   * Creates or updates User, Workspace, and Membership in Neon based on verified Clerk claims.
   * Not part of normal query authentication.
   */
  @Post("sync")
  @SkipMembershipCheck()
  async syncProfile(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: SyncProfileDto
  ) {
    const isOrgAdmin =
      tenant.rawOrgRole === "org:admin" ||
      tenant.rawOrgRole === "admin" ||
      tenant.rawOrgRole === "owner" ||
      tenant.rawOrgRole === "org:owner";

    const workspaceName = dto.workspaceName || tenant.orgSlug || "Default Workspace";
    const workspaceSlug =
      dto.workspaceSlug || tenant.orgSlug || `ws-${tenant.workspaceId.slice(0, 8)}`;

    const result = await this.provisioningService.provisionOrSync({
      userId: tenant.userId,
      userEmail: `${tenant.userId}@pacia.local`, // Fallback or updated via dto/Clerk
      userFirstName: dto.firstName,
      userLastName: dto.lastName,
      userImageUrl: dto.imageUrl,
      workspaceId: tenant.workspaceId,
      workspaceName,
      workspaceSlug,
      workspaceTier: dto.tier,
      isOrgAdminInClerk: isOrgAdmin,
    });

    return result;
  }
}
