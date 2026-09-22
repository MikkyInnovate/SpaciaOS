import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ClerkAuthGuard } from "../../common/auth/clerk-auth.guard";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { WorkspacesService } from "./workspaces.service";
import { SystemEventsService } from "./system-events.service";
import { CreateSystemEventDto } from "./dto/create-system-event.dto";

@Controller("workspaces")
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly systemEventsService: SystemEventsService
  ) {}

  /**
   * Returns current active workspace details for the authenticated user and organization.
   * Resolves the workspace from the database using verified Clerk org_id.
   */
  @Get("current")
  async getCurrentWorkspace(@CurrentTenant() tenant: TenantContext) {
    return this.workspacesService.getCurrentWorkspace(tenant);
  }

  /**
   * Retrieves operational system events strictly scoped to the active tenant.
   * Requires 'events:read' permission (granted to owner, admin, sales_manager).
   */
  @Get("system-events")
  @RequirePermissions("events:read")
  async getSystemEvents(@CurrentTenant() tenant: TenantContext) {
    return this.systemEventsService.getTenantEvents(tenant);
  }

  /**
   * Emits a new operational system event bound to the active tenant.
   */
  @Post("system-events")
  @HttpCode(HttpStatus.CREATED)
  async emitSystemEvent(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateSystemEventDto
  ) {
    return this.systemEventsService.emitEvent(tenant, dto);
  }
}
