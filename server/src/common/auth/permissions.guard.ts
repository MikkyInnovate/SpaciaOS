import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "./permissions.decorator";
import { TenantContext } from "../tenant/tenant-context.interface";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantContext: TenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "No tenant context available to evaluate permissions.",
      });
    }

    // Wildcard permission grants all
    if (tenantContext.permissions.includes("*")) {
      return true;
    }

    const hasAll = requiredPermissions.every((perm) =>
      tenantContext.permissions.includes(perm)
    );

    if (!hasAll) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: `Missing required permission(s): ${requiredPermissions.join(", ")}`,
      });
    }

    return true;
  }
}
