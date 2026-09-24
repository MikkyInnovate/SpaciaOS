import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { eq, and, desc } from "drizzle-orm";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { ScheduleFollowUpDto } from "./dto/schedule-follow-up.dto";
import { FollowUpWorkflowService } from "./services/follow-up-workflow.service";
import { HandoffService } from "./services/handoff.service";
import { FollowUpExecutionResult } from "./interfaces/follow-up.interface";

@Injectable()
export class FollowUpsService {
  private readonly logger = new Logger(FollowUpsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb,
    private readonly workflowService: FollowUpWorkflowService,
    private readonly handoffService: HandoffService
  ) {}

  /**
   * Schedules a new autonomous follow-up touchpoint for a lead.
   */
  async scheduleFollowUp(
    tenant: TenantContext,
    dto: ScheduleFollowUpDto
  ): Promise<schema.FollowUpRecord> {
    const [lead] = await this.db
      .select()
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.id, dto.leadId),
          eq(schema.leads.workspaceId, tenant.workspaceId)
        )
      )
      .limit(1);

    if (!lead) {
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: `Lead with ID '${dto.leadId}' not found in active workspace.`,
      });
    }

    // Stop Condition / Guard Check:
    // If the lead is already under human management or AI is stopped, warn and reject autonomous scheduling
    if (lead.managementMode === "human_managed" || lead.isAiStopped) {
      throw new BadRequestException({
        code: "LEAD_HUMAN_MANAGED",
        message: `Cannot schedule autonomous follow-up: Lead '${lead.name}' is under direct human broker management (AI Stopped: ${lead.isAiStopped}).`,
      });
    }

    const scheduledDate = new Date(dto.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException({
        code: "INVALID_SCHEDULE_DATE",
        message: "scheduledAt must be a valid ISO-8601 date string.",
      });
    }

    const [createdFollowUp] = await this.db
      .insert(schema.followUps)
      .values({
        workspaceId: tenant.workspaceId,
        leadId: lead.id,
        scheduledAt: scheduledDate,
        channel: dto.channel || "call",
        cadence: dto.cadence || "once",
        status: "pending",
        priority: dto.priority || "scheduled",
        directive: dto.directive || "Follow up on property inquiry and inspection availability.",
        notes: dto.notes || null,
        attemptCount: 0,
        maxAttempts: dto.maxAttempts || 3,
        metadata: {
          scheduledByUserId: tenant.userId,
          scheduledAtTimestamp: new Date().toISOString(),
        },
      })
      .returning();

    this.logger.log(
      `Scheduled follow-up [${createdFollowUp.id}] for lead [${lead.name}] via ${createdFollowUp.channel} at ${createdFollowUp.scheduledAt.toISOString()}`
    );

    return createdFollowUp;
  }

  /**
   * Retrieves all follow-ups for a specific lead.
   */
  async getFollowUpsForLead(
    tenant: TenantContext,
    leadId: string
  ): Promise<schema.FollowUpRecord[]> {
    return this.db
      .select()
      .from(schema.followUps)
      .where(
        and(
          eq(schema.followUps.leadId, leadId),
          eq(schema.followUps.workspaceId, tenant.workspaceId)
        )
      )
      .orderBy(desc(schema.followUps.scheduledAt));
  }

  /**
   * Executes a scheduled follow-up with real-time pre-action state verification.
   */
  async executeFollowUp(
    tenant: TenantContext,
    followUpId: string
  ): Promise<FollowUpExecutionResult> {
    return this.workflowService.executeFollowUpAction(tenant.workspaceId, followUpId);
  }

  /**
   * Cancels a pending follow-up touchpoint.
   */
  async cancelFollowUp(
    tenant: TenantContext,
    followUpId: string,
    reason?: string
  ): Promise<schema.FollowUpRecord> {
    const [existing] = await this.db
      .select()
      .from(schema.followUps)
      .where(
        and(
          eq(schema.followUps.id, followUpId),
          eq(schema.followUps.workspaceId, tenant.workspaceId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundException({
        code: "FOLLOW_UP_NOT_FOUND",
        message: `Follow-up '${followUpId}' not found in active workspace.`,
      });
    }

    const [cancelled] = await this.db
      .update(schema.followUps)
      .set({
        status: "cancelled",
        notes: reason || "Cancelled by broker operator",
        updatedAt: new Date(),
      })
      .where(eq(schema.followUps.id, followUpId))
      .returning();

    return cancelled;
  }
}
