import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ClerkAuthGuard } from "../../common/auth/clerk-auth.guard";
import { WorkspaceMemberGuard } from "../../common/auth/workspace-member.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { OpsService } from "./ops.service";

@Controller("ops")
@UseGuards(ClerkAuthGuard, WorkspaceMemberGuard)
@RequirePermissions("workspace:manage")
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  /**
   * 1. GET /api/v1/ops/overview
   * Returns high-level operational pulse across the platform.
   */
  @Get("overview")
  async getOverview(
    @CurrentTenant() tenant: TenantContext,
    @Query("workspaceId") workspaceId?: string
  ) {
    const targetWs = workspaceId || tenant.workspaceId;
    const overview = await this.opsService.getOverview(targetWs);
    return {
      success: true,
      overview,
    };
  }

  /**
   * 2. GET /api/v1/ops/workspaces
   * Returns list of workspaces with operational stats.
   */
  @Get("workspaces")
  async getWorkspaces() {
    const workspaces = await this.opsService.getWorkspaces();
    return {
      success: true,
      workspaces,
    };
  }

  /**
   * 3. GET /api/v1/ops/leads
   * Returns recent leads across workspaces.
   */
  @Get("leads")
  async getLeads(
    @CurrentTenant() tenant: TenantContext,
    @Query("limit") limit?: string,
    @Query("workspaceId") workspaceId?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const leads = await this.opsService.getLeads(parsedLimit, workspaceId);
    return {
      success: true,
      leads,
    };
  }

  /**
   * 4. GET /api/v1/ops/workflows
   * Returns background system events and workflows.
   */
  @Get("workflows")
  async getWorkflows(
    @CurrentTenant() tenant: TenantContext,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("workspaceId") workspaceId?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const workflows = await this.opsService.getWorkflows(
      parsedLimit,
      status,
      workspaceId
    );
    return {
      success: true,
      workflows,
    };
  }

  /**
   * 5. POST /api/v1/ops/workflows/:id/retry
   * Retries a failed workflow.
   */
  @Post("workflows/:id/retry")
  async retryWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string
  ) {
    const result = await this.opsService.retryWorkflow(id, tenant.userId);
    return result;
  }

  /**
   * 6. GET /api/v1/ops/calls
   * Returns calls across workspaces.
   */
  @Get("calls")
  async getCalls(
    @CurrentTenant() tenant: TenantContext,
    @Query("limit") limit?: string,
    @Query("workspaceId") workspaceId?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const calls = await this.opsService.getCalls(parsedLimit, workspaceId);
    return {
      success: true,
      calls,
    };
  }

  /**
   * 7. GET /api/v1/ops/appointments
   * Returns appointments across workspaces.
   */
  @Get("appointments")
  async getAppointments(
    @CurrentTenant() tenant: TenantContext,
    @Query("limit") limit?: string,
    @Query("workspaceId") workspaceId?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const appointments = await this.opsService.getAppointments(
      parsedLimit,
      workspaceId
    );
    return {
      success: true,
      appointments,
    };
  }

  /**
   * 8. GET /api/v1/ops/errors
   * Consolidates and returns errors across all subsystems.
   */
  @Get("errors")
  async getErrors(
    @CurrentTenant() tenant: TenantContext,
    @Query("limit") limit?: string,
    @Query("workspaceId") workspaceId?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const errors = await this.opsService.getErrors(parsedLimit, workspaceId);
    return {
      success: true,
      errors,
    };
  }

  /**
   * 9. GET /api/v1/ops/integrations
   * Returns integration health across connectors.
   */
  @Get("integrations")
  async getIntegrations(
    @CurrentTenant() tenant: TenantContext,
    @Query("workspaceId") workspaceId?: string
  ) {
    const integrations = await this.opsService.getIntegrations(workspaceId);
    return {
      success: true,
      integrations,
    };
  }

  /**
   * 10. POST /api/v1/ops/integrations/:id/reconnect
   * Reconnects an integration.
   */
  @Post("integrations/:id/reconnect")
  async reconnectIntegration(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string,
    @Query("workspaceId") workspaceId?: string
  ) {
    const targetWs = workspaceId || tenant.workspaceId;
    const result = await this.opsService.reconnectIntegration(
      id,
      targetWs,
      tenant.userId
    );
    return result;
  }

  /**
   * 11. GET /api/v1/ops/audit
   * Queries audit log activity.
   */
  @Get("audit")
  async getAuditLogs(
    @CurrentTenant() tenant: TenantContext,
    @Query("limit") limit?: string,
    @Query("severity") severity?: string,
    @Query("actorType") actorType?: string,
    @Query("workspaceId") workspaceId?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const auditLogs = await this.opsService.getAuditLogs(
      parsedLimit,
      severity,
      actorType,
      workspaceId
    );
    return {
      success: true,
      auditLogs,
    };
  }

  /**
   * 12. POST /api/v1/ops/ai/pause
   * Pauses outbound AI calling dialer.
   */
  @Post("ai/pause")
  async pauseAiDialer(
    @CurrentTenant() tenant: TenantContext,
    @Query("workspaceId") workspaceId?: string
  ) {
    const targetWs = workspaceId || tenant.workspaceId;
    const result = await this.opsService.pauseAiDialer(targetWs, tenant.userId);
    return result;
  }

  /**
   * 13. POST /api/v1/ops/ai/resume
   * Resumes outbound AI calling dialer.
   */
  @Post("ai/resume")
  async resumeAiDialer(
    @CurrentTenant() tenant: TenantContext,
    @Query("workspaceId") workspaceId?: string
  ) {
    const targetWs = workspaceId || tenant.workspaceId;
    const result = await this.opsService.resumeAiDialer(targetWs, tenant.userId);
    return result;
  }

  /**
   * 14. GET /api/v1/ops/ai/status
   * Returns current AI dialer status.
   */
  @Get("ai/status")
  async getAiDialerStatus(
    @CurrentTenant() tenant: TenantContext,
    @Query("workspaceId") workspaceId?: string
  ) {
    const targetWs = workspaceId || tenant.workspaceId;
    const result = await this.opsService.getAiDialerStatus(targetWs);
    return result;
  }
}
