import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { ROLES_KEY } from "./roles.decorator";
import { SKIP_MEMBERSHIP_CHECK_KEY } from "./skip-membership-check.decorator";
import { WorkspaceMembersService } from "../../modules/workspaces/workspace-members.service";
import { WorkspacesRepository } from "../../modules/workspaces/workspaces.repository";
import { UsersRepository } from "../../modules/users/users.repository";
import { TenantContext } from "../tenant/tenant-context.interface";
import {
  DEFAULT_ROLE_PERMISSIONS,
  ClientRole,
} from "../../database/schema/roles.schema";

/**
 * WorkspaceMemberGuard: Enforces database-level workspace membership authorization.
 * 
 * Flow:
 * 1. Checks if route is @Public().
 * 2. Checks if route is @SkipMembershipCheck().
 * 3. Extracts verified Clerk tenantContext (userId and workspaceId).
 * 4. Verifies that the workspace exists in Neon (404 WORKSPACE_NOT_PROVISIONED).
 * 5. Queries Neon DB `workspace_members` table (403 WORKSPACE_MEMBERSHIP_REQUIRED).
 * 6. Uses Neon `workspace_members.role` as the SOLE AUTHORITATIVE Pacia application role.
 * 7. Updates request.tenantContext with the verified DB role and its permissions.
 * 8. Enforces @RequireRoles(...) if declared on the endpoint.
 */
@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  private readonly logger = new Logger(WorkspaceMemberGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly workspacesRepo: WorkspacesRepository,
    private readonly workspaceMembersService: WorkspaceMembersService,
    private readonly usersRepo: UsersRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const request = context.switchToHttp().getRequest();
      if (request.tenantContext) {
        try {
          let dbMember = await this.workspaceMembersService.findMember(
            request.tenantContext.workspaceId,
            request.tenantContext.userId
          );

          if (!dbMember) {
            if (
              process.env.NODE_ENV === "development" ||
              process.env.ALLOW_MOCK_AUTH === "true"
            ) {
              const existingUser = await this.usersRepo.findById(
                request.tenantContext.userId
              );
              if (!existingUser) {
                await this.usersRepo.upsert({
                  id: request.tenantContext.userId,
                  email: `${request.tenantContext.userId}@pacia.dev`,
                  firstName: "Active",
                  lastName: "Member",
                });
              }
              dbMember = await this.workspaceMembersService.addMember(
                request.tenantContext.workspaceId,
                request.tenantContext.userId,
                "owner"
              );
            }
          }

          if (dbMember) {
            const authoritativeRole = dbMember.role as ClientRole;
            request.tenantContext.role = authoritativeRole;
            request.tenantContext.permissions =
              DEFAULT_ROLE_PERMISSIONS[authoritativeRole] || [];
          }
        } catch {
          // Gracefully continue unauthenticated on public route
          delete request.tenantContext;
        }
      }
      return true;
    }

    const skipMembershipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_MEMBERSHIP_CHECK_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (skipMembershipCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantContext: TenantContext = request.tenantContext;

    if (!tenantContext || !tenantContext.userId || !tenantContext.workspaceId) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Tenant context is missing or incomplete. Ensure ClerkAuthGuard runs first.",
      });
    }

    // Step 4: Verify workspace is provisioned in Neon
    let workspace = await this.workspacesRepo.findById(tenantContext.workspaceId);
    if (!workspace) {
      const bySlug = await this.workspacesRepo.findBySlug(
        tenantContext.orgSlug || tenantContext.workspaceId
      );
      if (bySlug) {
        workspace = bySlug;
        tenantContext.workspaceId = bySlug.id;
      }
    }
    if (!workspace) {
      if (
        process.env.NODE_ENV === "development" ||
        process.env.ALLOW_MOCK_AUTH === "true"
      ) {
        this.logger.log(
          `JIT provisioning workspace '${tenantContext.workspaceId}' for local development.`
        );
        workspace = await this.workspacesRepo.create({
          id: tenantContext.workspaceId,
          name: tenantContext.orgSlug
            ? tenantContext.orgSlug.replace(/-/g, " ")
            : "Primary Workspace",
          slug: tenantContext.orgSlug || tenantContext.workspaceId,
        });
      } else {
        this.logger.warn(`Workspace '${tenantContext.workspaceId}' not found in database.`);
        throw new NotFoundException({
          code: "WORKSPACE_NOT_PROVISIONED",
          message: `Workspace '${tenantContext.workspaceId}' has not been provisioned in Pacia. Please complete workspace provisioning.`,
        });
      }
    }

    // Step 5: Authoritatively validate database membership in Neon
    let member = await this.workspaceMembersService.findMember(
      tenantContext.workspaceId,
      tenantContext.userId
    );

    if (!member) {
      if (
        process.env.NODE_ENV === "development" ||
        process.env.ALLOW_MOCK_AUTH === "true"
      ) {
        // Ensure user exists in users table before creating membership (satisfies FK constraint)
        const existingUser = await this.usersRepo.findById(tenantContext.userId);
        if (!existingUser) {
          this.logger.log(
            `JIT provisioning user '${tenantContext.userId}' for local development.`
          );
          await this.usersRepo.upsert({
            id: tenantContext.userId,
            email: `${tenantContext.userId}@pacia.dev`,
            firstName: "Active",
            lastName: "Member",
          });
        }

        this.logger.log(
          `JIT provisioning membership for user '${tenantContext.userId}' in workspace '${tenantContext.workspaceId}'.`
        );
        member = await this.workspaceMembersService.addMember(
          tenantContext.workspaceId,
          tenantContext.userId,
          "owner"
        );
      } else {
        member = await this.workspaceMembersService.validateMembership(
          tenantContext.workspaceId,
          tenantContext.userId
        );
      }
    }

    // Neon DB workspace_members.role is the authoritative Pacia application role
    const paciaRole = member.role as ClientRole;
    const permissions = DEFAULT_ROLE_PERMISSIONS[paciaRole] || [];

    // Update request tenantContext with the DB-backed role and permissions
    tenantContext.role = paciaRole;
    tenantContext.permissions = permissions;
    request.membership = member;

    // Evaluate @RequireRoles(...) if present
    const requiredRoles = this.reflector.getAllAndOverride<ClientRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(paciaRole)) {
        this.logger.warn(
          `Access denied: User '${tenantContext.userId}' has role '${paciaRole}', but endpoint requires one of [${requiredRoles.join(", ")}].`
        );
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: `Insufficient role. Required: ${requiredRoles.join(", ")}. Current role: ${paciaRole}.`,
        });
      }
    }

    return true;
  }
}
