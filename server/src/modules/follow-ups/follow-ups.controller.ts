import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { FollowUpsService } from "./follow-ups.service";
import { HandoffService } from "./services/handoff.service";
import { FollowUpWorkflowService } from "./services/follow-up-workflow.service";
import { TakeoverLeadDto } from "./dto/takeover-lead.dto";
import { EscalateLeadDto } from "./dto/escalate-lead.dto";
import { ScheduleFollowUpDto } from "./dto/schedule-follow-up.dto";

@Controller()
export class FollowUpsController {
  constructor(
    private readonly followUpsService: FollowUpsService,
    private readonly handoffService: HandoffService,
    private readonly workflowService: FollowUpWorkflowService
  ) {}

  /**
   * 1-Click Human Broker Takeover (HUMAN_MANAGED).
   * Cancels all pending autonomous follow-ups and halts AI actions.
   */
  @Post("leads/:id/takeover")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("leads:write")
  async takeoverLead(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) leadId: string,
    @Body() dto: TakeoverLeadDto
  ) {
    return this.handoffService.executeTakeover(tenant, leadId, dto);
  }

  /**
   * Escalates lead to HUMAN_HANDOFF mode.
   * Synthesizes structured handoff context and pauses autonomous sequencing.
   */
  @Post("leads/:id/escalate")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("leads:write")
  async escalateLead(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) leadId: string,
    @Body() dto: EscalateLeadDto
  ) {
    return this.handoffService.escalateToHandoff(tenant, leadId, dto);
  }

  /**
   * Emergency Killswitch: Suspends AI autonomy immediately.
   */
  @Post("leads/:id/stop-ai")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("leads:write")
  async stopAi(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) leadId: string,
    @Body("reason") reason?: string
  ) {
    return this.handoffService.stopAi(tenant, leadId, reason);
  }

  /**
   * Resumes AI autonomy for a lead (AI_ACTIVE).
   */
  @Post("leads/:id/resume-ai")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("leads:write")
  async resumeAi(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) leadId: string
  ) {
    return this.handoffService.resumeAi(tenant, leadId);
  }

  /**
   * Schedules a new follow-up touchpoint for a lead.
   */
  @Post("leads/:id/follow-ups")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("leads:write")
  async scheduleFollowUp(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) leadId: string,
    @Body() dto: Omit<ScheduleFollowUpDto, "leadId">
  ) {
    return this.followUpsService.scheduleFollowUp(tenant, {
      ...dto,
      leadId,
    });
  }

  /**
   * Retrieves all scheduled and historical follow-ups for a lead.
   */
  @Get("leads/:id/follow-ups")
  @RequirePermissions("leads:read")
  async getFollowUps(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) leadId: string
  ) {
    return this.followUpsService.getFollowUpsForLead(tenant, leadId);
  }

  /**
   * Triggers execution of a specific follow-up with real-time pre-action guards.
   */
  @Post("follow-ups/:id/execute")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("leads:write")
  async executeFollowUp(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) followUpId: string
  ) {
    return this.followUpsService.executeFollowUp(tenant, followUpId);
  }

  /**
   * Cancels a pending follow-up touchpoint.
   */
  @Post("follow-ups/:id/cancel")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("leads:write")
  async cancelFollowUp(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) followUpId: string,
    @Body("reason") reason?: string
  ) {
    return this.followUpsService.cancelFollowUp(tenant, followUpId, reason);
  }
}
