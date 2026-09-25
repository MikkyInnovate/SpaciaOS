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
import { AnalyticsService } from "./analytics.service";
import { QueryAnalyticsDto } from "./dto/query-analytics.dto";

@Controller("analytics")
@UseGuards(ClerkAuthGuard, WorkspaceMemberGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * 1. GET /api/v1/analytics/funnel
   * Day 21 Basic Conversion Funnel:
   * Leads -> Contacted -> Conversations -> Qualified -> Hot -> Viewing Booked -> Viewing Completed -> Won
   */
  @Get("funnel")
  @RequirePermissions("leads:read")
  async getFunnel(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryAnalyticsDto
  ) {
    const data = await this.analyticsService.getFunnel(tenant, query);
    return { success: true, data };
  }

  /**
   * 2. GET /api/v1/analytics/metrics
   * MVP Operational Analytics & Revenue Velocity Overview
   */
  @Get("metrics")
  @RequirePermissions("leads:read")
  async getMetrics(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryAnalyticsDto
  ) {
    const data = await this.analyticsService.getOverviewMetrics(tenant, query);
    return { success: true, data };
  }

  /**
   * 3. GET /api/v1/analytics/revenue-path
   * 11. DAY 21 CHECKPOINT:
   * 17-point end-to-end revenue path operational audit from Website Lead to Human Handoff
   */
  @Get("revenue-path")
  @RequirePermissions("leads:read")
  async getRevenuePath(@CurrentTenant() tenant: TenantContext) {
    const data = await this.analyticsService.getRevenuePath(tenant);
    return { success: true, data };
  }
}
