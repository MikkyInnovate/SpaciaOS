import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ClerkAuthGuard } from "../../common/auth/clerk-auth.guard";
import { WorkspaceMemberGuard } from "../../common/auth/workspace-member.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { DashboardService } from "./dashboard.service";
import { QueryDashboardDto } from "./dto/query-dashboard.dto";

@Controller("dashboard")
@UseGuards(ClerkAuthGuard, WorkspaceMemberGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * 1. GET /api/v1/dashboard/metrics
   * Aggregates the 7 primary sales command center metrics:
   * Leads, Calls, Qualified, Hot, Viewings, Handoffs, Follow-ups
   */
  @Get("metrics")
  @RequirePermissions("leads:read")
  async getMetrics(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryDashboardDto
  ) {
    return this.dashboardService.getMetrics(tenant, query);
  }

  /**
   * 2. GET /api/v1/dashboard/attention
   * Answers: "What requires attention?"
   * Returns prioritized urgent operational items (takeovers, hot unbooked leads, today's inspections)
   */
  @Get("attention")
  @RequirePermissions("leads:read")
  async getAttentionItems(@CurrentTenant() tenant: TenantContext) {
    return this.dashboardService.getAttentionItems(tenant);
  }

  /**
   * 3. GET /api/v1/dashboard/feed
   * Answers: "What happened today?"
   * Chronological unified real-time activity feed
   */
  @Get("feed")
  @RequirePermissions("leads:read")
  async getActivityFeed(@CurrentTenant() tenant: TenantContext) {
    return this.dashboardService.getActivityFeed(tenant);
  }

  /**
   * 4. GET /api/v1/dashboard/funnel
   * Visual conversion funnel stages across lead progression
   */
  @Get("funnel")
  @RequirePermissions("leads:read")
  async getPipelineFunnel(@CurrentTenant() tenant: TenantContext) {
    return this.dashboardService.getPipelineFunnel(tenant);
  }
}
