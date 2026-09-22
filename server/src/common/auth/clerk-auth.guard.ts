import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ClerkService } from "./clerk.service";
import { IS_PUBLIC_KEY } from "./public.decorator";
import {
  mapClerkRoleToClientRole,
  DEFAULT_ROLE_PERMISSIONS,
  ClientRole,
} from "../../database/schema/roles.schema";
import { TenantContext } from "../tenant/tenant-context.interface";

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly clerkService: ClerkService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        if (token) {
          try {
            const session = await this.clerkService.verifySessionToken(token);
            if (session.orgId) {
              const clientRole = mapClerkRoleToClientRole(session.orgRole);
              request.tenantContext = {
                userId: session.userId,
                workspaceId: session.orgId,
                role: clientRole,
                permissions: DEFAULT_ROLE_PERMISSIONS[clientRole] || [],
                orgSlug: session.orgSlug,
              };
            }
          } catch {
            // Optional auth on public route: proceed unauthenticated
          }
        }
      }
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Missing or malformed Authorization header. Expected 'Bearer <token>'.",
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Bearer token cannot be empty.",
      });
    }

    // Verify session token and extract claims
    const session = await this.clerkService.verifySessionToken(token);

    // Enforce active workspace requirement
    if (!session.orgId) {
      throw new ForbiddenException({
        code: "NO_ACTIVE_WORKSPACE",
        message:
          "No active organization/workspace selected in Clerk token. Tenant context requires an active organization.",
      });
    }

    // Optional X-Workspace-Id header check for development/debugging
    const xWorkspaceId = request.headers["x-workspace-id"];
    if (xWorkspaceId && xWorkspaceId !== session.orgId) {
      throw new ForbiddenException({
        code: "WORKSPACE_MISMATCH",
        message: `X-Workspace-Id header ('${xWorkspaceId}') does not match verified token org_id ('${session.orgId}').`,
      });
    }

    // Role safety enforcement:
    // - Missing role intentionally falls back to 'viewer' (documented read-only baseline).
    // - Unknown/unrecognized roles are rejected with UNSUPPORTED_ROLE (never silently granted permissions).
    let role: ClientRole;
    try {
      role = mapClerkRoleToClientRole(session.orgRole);
    } catch (err: any) {
      this.logger.warn(
        `Rejected user ${session.userId} with unsupported role: ${session.orgRole}`
      );
      throw new ForbiddenException({
        code: "UNSUPPORTED_ROLE",
        message: `Organization role '${session.orgRole}' is not recognized or supported.`,
      });
    }

    const permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];

    const tenantContext: TenantContext = {
      workspaceId: session.orgId,
      userId: session.userId,
      role,
      permissions,
      orgSlug: session.orgSlug || undefined,
      rawOrgRole: session.orgRole,
    };

    // Attach verified identity to request object
    request.tenantContext = tenantContext;
    request.user = {
      id: session.userId,
      workspaceId: session.orgId,
      role,
      permissions,
    };

    return true;
  }
}
