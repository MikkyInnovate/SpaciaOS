import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { LeadsService } from "./leads.service";
import { GetLeadsQueryDto } from "./dto/get-leads-query.dto";
import { UpdateLeadStatusDto } from "./dto/update-lead-status.dto";
import { CreateLeadActivityDto } from "./dto/create-lead-activity.dto";

@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /**
   * Retrieves a paginated list of leads with search, filtering, and sorting.
   * Scoped strictly to the active workspace.
   */
  @Get()
  @RequirePermissions("leads:read")
  async getLeads(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: GetLeadsQueryDto
  ) {
    return this.leadsService.getLeads(tenant, query);
  }

  /**
   * Retrieves full lead dossier details by ID.
   */
  @Get(":id")
  @RequirePermissions("leads:read")
  async getLeadById(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    return this.leadsService.getLeadById(tenant, id);
  }

  /**
   * Updates lead status and writes an immutable status_change audit event.
   */
  @Patch(":id/status")
  @RequirePermissions("leads:write")
  async updateLeadStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLeadStatusDto
  ) {
    return this.leadsService.updateLeadStatus(tenant, id, dto);
  }

  /**
   * Records a new activity or touchpoint event on the lead's timeline.
   */
  @Post(":id/activities")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("leads:write")
  async createLeadActivity(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CreateLeadActivityDto
  ) {
    return this.leadsService.createLeadActivity(tenant, id, dto);
  }

  /**
   * Retrieves chronological activities/events for a lead.
   */
  @Get(":id/activities")
  @RequirePermissions("leads:read")
  async getLeadActivities(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.leadsService.getLeadActivities(tenant, id, page, limit);
  }
}
