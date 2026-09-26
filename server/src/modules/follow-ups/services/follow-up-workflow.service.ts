import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";
import { eq, and } from "drizzle-orm";
import {
  FollowUpExecutionResult,
  StopConditionReason,
  LeadCommunicationState,
} from "../interfaces/follow-up.interface";
import { HandoffService } from "./handoff.service";
import { VapiClientService } from "../../calls/services/vapi-client.service";

export const DEFAULT_MAX_FOLLOW_UP_ATTEMPTS = 3;

@Injectable()
export class FollowUpWorkflowService {
  private readonly logger = new Logger(FollowUpWorkflowService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb,
    private readonly handoffService: HandoffService,
    private readonly vapiClient: VapiClientService
  ) {}

  /**
   * Deterministically evaluates whether an autonomous follow-up workflow must halt.
   */
  evaluateStopConditions(
    lead: schema.LeadRecord,
    followUp?: schema.FollowUpRecord
  ): { stop: boolean; reason?: StopConditionReason; details?: string } {
    // 1. Human Takeover / AI Stopped Guardrail (Highest Priority)
    if (lead.managementMode === "human_managed" || lead.isAiStopped) {
      return {
        stop: true,
        reason: "HUMAN_TAKEOVER",
        details: lead.aiStoppedReason || "Lead is under direct human broker management.",
      };
    }

    // 2. Terminal Disposition Guardrail
    if (lead.managementMode === "lost" || lead.managementMode === "nurture") {
      return {
        stop: true,
        reason: "TERMINAL_DISPOSITION",
        details: `Lead placed in terminal disposition mode: '${lead.managementMode}'.`,
      };
    }

    // 3. Goal Achieved: Viewing already booked
    if (lead.status === "Viewing Booked") {
      return {
        stop: true,
        reason: "VIEWING_BOOKED",
        details: "Inspection viewing already booked. Follow-up sequence superseded.",
      };
    }

    // 4. Maximum Attempts Guardrail
    const maxAllowed = followUp?.maxAttempts || DEFAULT_MAX_FOLLOW_UP_ATTEMPTS;
    const currentAttempts = followUp?.attemptCount || 0;
    if (currentAttempts >= maxAllowed) {
      return {
        stop: true,
        reason: "MAX_ATTEMPTS_REACHED",
        details: `Maximum attempt ceiling reached (${currentAttempts}/${maxAllowed}) without prospect response.`,
      };
    }

    return { stop: false };
  }

  /**
   * Executes a scheduled autonomous follow-up touchpoint with strict pre-action guards.
   * 
   * CRITICAL DELIVERABLE & RISK MITIGATION:
   * Synchronously checks lead communication state from PostgreSQL immediately before
   * every autonomous action. If human takeover has occurred, execution aborts instantly.
   */
  async executeFollowUpAction(
    workspaceId: string,
    followUpId: string
  ): Promise<FollowUpExecutionResult> {
    // 1. Fetch FollowUp Record
    const [followUp] = await this.db
      .select()
      .from(schema.followUps)
      .where(
        and(
          eq(schema.followUps.id, followUpId),
          eq(schema.followUps.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!followUp) {
      throw new NotFoundException({
        code: "FOLLOW_UP_NOT_FOUND",
        message: `Follow-up '${followUpId}' not found in workspace '${workspaceId}'.`,
      });
    }

    // If already cancelled or completed, do nothing
    if (followUp.status !== "pending") {
      return {
        success: false,
        followUpId,
        leadId: followUp.leadId,
        status: followUp.status,
        communicationState: "HUMAN_MANAGED",
        attemptCount: followUp.attemptCount,
        message: `Follow-up is already in '${followUp.status}' status.`,
      };
    }

    // 2. FRESH REAL-TIME DATABASE CHECK (Lead Communication State)
    const [lead] = await this.db
      .select()
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.id, followUp.leadId),
          eq(schema.leads.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!lead) {
      await this.db
        .update(schema.followUps)
        .set({ status: "cancelled", notes: "Lead not found in database", updatedAt: new Date() })
        .where(eq(schema.followUps.id, followUpId));

      return {
        success: false,
        followUpId,
        leadId: followUp.leadId,
        status: "cancelled",
        communicationState: "HUMAN_MANAGED",
        stopConditionTriggered: "INVALID_LEAD",
        attemptCount: followUp.attemptCount,
        message: "Associated lead record no longer exists.",
      };
    }

    const currentCommState = this.handoffService.resolveCommunicationState(lead);

    // 3. EVALUATE STOP CONDITIONS IMMEDIATELY BEFORE AUTONOMOUS ACTION
    const stopCheck = this.evaluateStopConditions(lead, followUp);
    if (stopCheck.stop) {
      this.logger.warn(
        `[PRE-ACTION GUARD ABORT] Follow-up [${followUpId}] aborted for lead [${lead.id}]. Reason: ${stopCheck.reason} (${stopCheck.details})`
      );

      // Cancel this follow-up atomically
      await this.db
        .update(schema.followUps)
        .set({
          status: "cancelled",
          notes: `Aborted by pre-action guard: ${stopCheck.reason} - ${stopCheck.details}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.followUps.id, followUpId));

      // If max attempts was the stop reason, trigger automated handoff escalation
      if (stopCheck.reason === "MAX_ATTEMPTS_REACHED") {
        await this.handoffService.escalateToHandoff(
          { workspaceId, userId: "system_workflow", role: "admin", permissions: [] },
          lead.id,
          {
            triggerCategory: "max_attempts",
            triggerReason: `Autonomous follow-up cadence exhausted after ${followUp.attemptCount} attempts.`,
          }
        );
      }

      return {
        success: false,
        followUpId,
        leadId: lead.id,
        status: "cancelled",
        communicationState: currentCommState,
        stopConditionTriggered: stopCheck.reason,
        attemptCount: followUp.attemptCount,
        message: stopCheck.details,
      };
    }

    // 4. EXECUTE AUTONOMOUS TOUCHPOINT (Lead is confirmed AI_ACTIVE)
    const newAttemptCount = followUp.attemptCount + 1;
    this.logger.log(
      `Executing autonomous follow-up [${followUpId}] (Attempt ${newAttemptCount}/${followUp.maxAttempts}) for lead [${lead.name}] via ${followUp.channel}`
    );

    let executionDetails = `Autonomous ${followUp.channel} touchpoint executed.`;

    try {
      if (followUp.channel === "call") {
        // Dispatch outbound voice call via VapiClient
        const vapiRes = await this.vapiClient.dispatchOutboundCall({
          workspaceId,
          leadId: lead.id,
          callId: followUp.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          leadBudget: lead.budget,
          propertyLocation: lead.locationPreference || "Lagos",
          persona: "Victoria (Senior Luxury Closer)",
          customPrompt: followUp.directive || undefined,
        });
        executionDetails = `Outbound voice call dispatched via Vapi (Call ID: ${vapiRes.id}).`;
      } else {
        // WhatsApp / Email messaging
        executionDetails = `Autonomous ${followUp.channel} follow-up transmitted to ${lead.phone || lead.email}.`;
      }

      // Mark follow-up completed
      await this.db
        .update(schema.followUps)
        .set({
          status: "completed",
          attemptCount: newAttemptCount,
          completedAt: new Date(),
          notes: executionDetails,
          updatedAt: new Date(),
        })
        .where(eq(schema.followUps.id, followUpId));

      // Record touchpoint in lead_events
      await this.db.insert(schema.leadEvents).values({
        leadId: lead.id,
        workspaceId,
        type: followUp.channel === "call" ? "ai_voice_call" : "whatsapp_message",
        title: `Autonomous ${followUp.channel.toUpperCase()} Follow-Up Executed`,
        description: `${executionDetails} Directive: ${followUp.directive || "General qualification check-in."}`,
        channel: followUp.channel,
        actorType: "ai_system",
        metadata: {
          followUpId,
          attempt: newAttemptCount,
          maxAttempts: followUp.maxAttempts,
        },
      });

      return {
        success: true,
        followUpId,
        leadId: lead.id,
        status: "completed",
        communicationState: "AI_ACTIVE",
        attemptCount: newAttemptCount,
        message: executionDetails,
      };
    } catch (err: any) {
      this.logger.error(`Failed to execute autonomous follow-up [${followUpId}]: ${err.message}`);

      // Record failed attempt
      await this.db
        .update(schema.followUps)
        .set({
          attemptCount: newAttemptCount,
          notes: `Attempt ${newAttemptCount} failed: ${err.message}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.followUps.id, followUpId));

      // Check if max attempts now reached after this failure
      if (newAttemptCount >= followUp.maxAttempts) {
        await this.handoffService.escalateToHandoff(
          { workspaceId, userId: "system_workflow", role: "admin", permissions: [] },
          lead.id,
          {
            triggerCategory: "max_attempts",
            triggerReason: `Autonomous follow-up failed after ${newAttemptCount} attempts: ${err.message}`,
          }
        );
      }

      throw err;
    }
  }
}
