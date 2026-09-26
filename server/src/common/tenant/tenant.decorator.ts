import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { TenantContext } from "./tenant-context.interface";

/**
 * Parameter decorator to extract the verified TenantContext from the active request.
 * 
 * Usage:
 * @Get('current')
 * getCurrent(@CurrentTenant() tenant: TenantContext) { ... }
 */
export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext): TenantContext | any => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext: TenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "No active tenant context found on request. Ensure ClerkAuthGuard is applied.",
      });
    }

    return data ? tenantContext[data] : tenantContext;
  }
);
