import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";
import { eq, and } from "drizzle-orm";
import { TenantContext } from "../../../common/tenant/tenant-context.interface";
import {
  HandoffContext,
  HandoffTriggerCategory,
  HandoffRecommendedAction,
  LeadCommunicationState,
} from "../interfaces/follow-up.interface";
import { EscalateLeadDto } from "../dto/escalate-lead.dto";
import { TakeoverLeadDto } from "../dto/takeover-lead.dto";

@Injectable()
export class HandoffService {
  private readonly logger = new Logger(HandoffService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb) {}

  /**
   * Resolves the deterministic communication state of a lead.
   */
  resolveCommunicationState(lead: schema.LeadRecord): LeadCommunicationState {
    const meta = (lead.metadata || {}) as Record<string, any>;
    if (meta.communicationState === "HUMAN_HANDOFF") {
      return "HUMAN_HANDOFF";
    }
    if (lead.managementMode === "human_managed" || lead.isAiStopped) {
      return "HUMAN_MANAGED";
    }
    return "AI_ACTIVE";
  }

  /**
   * Synthesizes actionable, structured handoff context for broker supervision.
   */
  generateHandoffContext(params: {
    lead: schema.LeadRecord;
    triggerCategory: HandoffTriggerCategory;
    triggerReason: string;
    brokerName?: string;
    synthesis?: string;
    keyQuotes?: string[];
    unresolvedObjections?: string[];
  }): HandoffContext {
    const { lead, triggerCategory, triggerReason, brokerName } = params;

    let defaultSynthesis =
      params.synthesis ||
      `Autonomous session escalated for ${lead.name}. Catalyst: ${triggerReason}.`;
    let defaultQuotes = params.keyQuotes || [];
    let defaultObjections = params.unresolvedObjections || [];
    let recommendedAction: HandoffRecommendedAction;

    switch (triggerCategory) {
      case "negotiation":
        defaultSynthesis =
          params.synthesis ||
          `Prospect requested pricing concessions or commission adjustments for ${lead.locationPreference || "portfolio assets"} exceeding autonomous thresholds.`;
        if (defaultQuotes.length === 0) {
          defaultQuotes = ["Can we structure a 10% cash discount if payment clears this week?"];
        }
        if (defaultObjections.length === 0) {
          defaultObjections = ["Statutory commission split and outright payment discount"];
        }
        recommendedAction = {
          title: "Executive Pricing & Contract Negotiation",
          directive: "Broker review gross margin threshold and present structured 2-milestone settlement plan.",
          priority: "immediate",
          suggestedChannel: "call",
          actionProtocol: "Review deal margin with Managing Director before extending formal offer letter.",
          dueTimeFormatted: "Within 30 mins",
        };
        break;

      case "high_value":
        defaultSynthesis =
          params.synthesis ||
          `High-net-worth inquiry verified with liquid budget exceeding luxury milestone tier (${lead.budget || "₦1.0B+"}).`;
        recommendedAction = {
          title: "Private VIP Boardroom Presentation",
          directive: "Dispatch bespoke confidential investment prospectus and arrange in-person partner inspection.",
          priority: "immediate",
          suggestedChannel: "in_person",
          actionProtocol: "Prepare title search documents, deed of assignment, and Governor's Consent copy.",
          dueTimeFormatted: "Today",
        };
        break;

      case "prospect_request":
        defaultSynthesis =
          params.synthesis ||
          `Prospect explicitly stated a preference to speak directly with an authorized human sales director.`;
        if (defaultQuotes.length === 0) {
          defaultQuotes = ["I prefer speaking with your lead commercial broker regarding title conveyance."];
        }
        recommendedAction = {
          title: "Priority Broker Call-Back",
          directive: "Initiate direct phone conversation to address specialized inquiries.",
          priority: "immediate",
          suggestedChannel: "call",
          actionProtocol: "Acknowledge AI introduction and transition to senior advisory dialogue.",
          dueTimeFormatted: "Within 15 mins",
        };
        break;

      case "max_attempts":
        defaultSynthesis =
          params.synthesis ||
          `Autonomous follow-up cadence completed maximum allowable attempts without prospect engagement.`;
        recommendedAction = {
          title: "Nurture Re-assignment Review",
          directive: "Evaluate lead contact channel viability or transition to 60-day quarterly market digest nurture.",
          priority: "routine",
          suggestedChannel: "email",
          actionProtocol: "Audit phone validity and queue soft re-engagement drip.",
          dueTimeFormatted: "Next 48 hours",
        };
        break;

      case "manual_broker":
      default:
        recommendedAction = {
          title: "Direct Broker Engagement",
          directive: "Human broker has claimed full authority. AI communication is completely silenced.",
          priority: "scheduled",
          suggestedChannel: "call",
          actionProtocol: "Engage prospect directly; record updates in lead dossier.",
          dueTimeFormatted: "As scheduled",
        };
        break;
    }

    return {
      triggerReason,
      triggerCategory,
      synthesis: defaultSynthesis,
      keyQuotes: defaultQuotes,
      unresolvedObjections: defaultObjections,
      handedOffAt: new Date().toISOString(),
      brokerName: brokerName || "Assigned Broker",
      recommendedAction,
    };
  }

  /**
   * Escalates a lead to HUMAN_HANDOFF mode and cancels all pending autonomous jobs.
   */
  async escalateToHandoff(
    tenant: TenantContext,
    leadId: string,
    dto: EscalateLeadDto
  ): Promise<{ lead: schema.LeadRecord; handoffContext: HandoffContext; cancelledJobsCount: number }> {
    const [lead] = await this.db
      .select()
      .from(schema.leads)
      .where(and(eq(schema.leads.id, leadId), eq(schema.leads.workspaceId, tenant.workspaceId)))
      .limit(1);

    if (!lead) {
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: `Lead '${leadId}' not found in active workspace.`,
      });
    }

    const handoffContext = this.generateHandoffContext({
      lead,
      triggerCategory: dto.triggerCategory,
      triggerReason: dto.triggerReason,
      synthesis: dto.synthesis,
      keyQuotes: dto.keyQuotes,
      unresolvedObjections: dto.unresolvedObjections,
    });

    const updatedMetadata = {
      ...((lead.metadata as Record<string, any>) || {}),
      handoffContext,
      communicationState: "HUMAN_HANDOFF",
      escalatedAt: new Date().toISOString(),
    };

    // Update lead record to human_managed with AI stopped
    const [updatedLead] = await this.db
      .update(schema.leads)
      .set({
        managementMode: "human_managed",
        status: "Human Managed",
        isAiStopped: true,
        aiStoppedReason: `Escalated: ${dto.triggerReason}`,
        metadata: updatedMetadata,
        updatedAt: new Date(),
      })
      .where(eq(schema.leads.id, leadId))
      .returning();

    // CANCEL ALL PENDING AUTONOMOUS JOBS & FOLLOW-UPS
    const cancelledJobsCount = await this.cancelPendingFollowUpsForLead(
      leadId,
      tenant.workspaceId,
      `Cancelled due to escalation: ${dto.triggerReason}`
    );

    // Record immutable audit event
    await this.db.insert(schema.leadEvents).values({
      leadId,
      workspaceId: tenant.workspaceId,
      type: "status_change",
      title: "AI Escalated to Human Handoff",
      description: `Autonomous outreach paused. Reason: ${dto.triggerReason}. Handoff context synthesized for broker.`,
      channel: "system",
      actorType: "ai_system",
      metadata: {
        previousState: this.resolveCommunicationState(lead),
        newState: "HUMAN_HANDOFF",
        handoffCategory: dto.triggerCategory,
        cancelledJobsCount,
      },
    });

    this.logger.log(
      `Lead [${leadId}] transitioned to HUMAN_HANDOFF (${dto.triggerCategory}). Cancelled ${cancelledJobsCount} pending follow-ups.`
    );

    return { lead: updatedLead, handoffContext, cancelledJobsCount };
  }

  /**
   * Executes 1-click human broker takeover (HUMAN_MANAGED).
   * Hard deliverable: Cancels all pending autonomous jobs and halts AI communications.
   */
  async executeTakeover(
    tenant: TenantContext,
    leadId: string,
    dto: TakeoverLeadDto
  ): Promise<{ lead: schema.LeadRecord; handoffContext: HandoffContext; cancelledJobsCount: number }> {
    const [lead] = await this.db
      .select()
      .from(schema.leads)
      .where(and(eq(schema.leads.id, leadId), eq(schema.leads.workspaceId, tenant.workspaceId)))
      .limit(1);

    if (!lead) {
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: `Lead '${leadId}' not found in active workspace.`,
      });
    }

    const brokerName = dto.brokerName || tenant.userId || "Executive Broker";
    const reason = dto.reason || dto.note || "Broker manual takeover from control cockpit";

    const handoffContext = this.generateHandoffContext({
      lead,
      triggerCategory: "manual_broker",
      triggerReason: reason,
      brokerName,
    });

    const updatedMetadata = {
      ...((lead.metadata as Record<string, any>) || {}),
      handoffContext,
      communicationState: "HUMAN_MANAGED",
      takenOverAt: new Date().toISOString(),
      takenOverBy: brokerName,
    };

    // Update lead record
    const [updatedLead] = await this.db
      .update(schema.leads)
      .set({
        managementMode: "human_managed",
        status: "Human Managed",
        isAiStopped: true,
        aiStoppedReason: reason,
        metadata: updatedMetadata,
        updatedAt: new Date(),
      })
      .where(eq(schema.leads.id, leadId))
      .returning();

    // CANCEL ALL PENDING AUTONOMOUS JOBS & FOLLOW-UPS IMMEDIATELY
    const cancelledJobsCount = await this.cancelPendingFollowUpsForLead(
      leadId,
      tenant.workspaceId,
      `Cancelled due to human takeover by ${brokerName}`
    );

    // Record immutable audit event
    await this.db.insert(schema.leadEvents).values({
      leadId,
      workspaceId: tenant.workspaceId,
      type: "status_change",
      title: "Human Takeover Activated",
      description: `Broker '${brokerName}' assumed direct management. AI autonomy disengaged. All ${cancelledJobsCount} pending autonomous follow-ups cancelled.`,
      channel: "system",
      actorType: "human_broker",
      actorId: tenant.userId,
      metadata: {
        brokerName,
        reason,
        cancelledJobsCount,
        communicationState: "HUMAN_MANAGED",
      },
    });

    this.logger.log(
      `Broker Takeover completed for Lead [${leadId}] by '${brokerName}'. ${cancelledJobsCount} pending follow-ups cancelled.`
    );

    return { lead: updatedLead, handoffContext, cancelledJobsCount };
  }

  /**
   * Stops AI immediately for a lead without changing ownership.
   */
  async stopAi(
    tenant: TenantContext,
    leadId: string,
    reason?: string
  ): Promise<{ lead: schema.LeadRecord; cancelledJobsCount: number }> {
    const [lead] = await this.db
      .select()
      .from(schema.leads)
      .where(and(eq(schema.leads.id, leadId), eq(schema.leads.workspaceId, tenant.workspaceId)))
      .limit(1);

    if (!lead) {
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: `Lead '${leadId}' not found in active workspace.`,
      });
    }

    const stopReason = reason || "Emergency AI killswitch activated";

    const [updatedLead] = await this.db
      .update(schema.leads)
      .set({
        isAiStopped: true,
        aiStoppedReason: stopReason,
        updatedAt: new Date(),
      })
      .where(eq(schema.leads.id, leadId))
      .returning();

    const cancelledJobsCount = await this.cancelPendingFollowUpsForLead(
      leadId,
      tenant.workspaceId,
      `Cancelled: ${stopReason}`
    );

    await this.db.insert(schema.leadEvents).values({
      leadId,
      workspaceId: tenant.workspaceId,
      type: "status_change",
      title: "AI Autonomy Suspended",
      description: `Autonomous actions halted: ${stopReason}.`,
      channel: "system",
      actorType: "human_broker",
      actorId: tenant.userId,
    });

    return { lead: updatedLead, cancelledJobsCount };
  }

  /**
   * Resumes AI autonomy for a lead (transition to AI_ACTIVE).
   */
  async resumeAi(tenant: TenantContext, leadId: string): Promise<schema.LeadRecord> {
    const [lead] = await this.db
      .select()
      .from(schema.leads)
      .where(and(eq(schema.leads.id, leadId), eq(schema.leads.workspaceId, tenant.workspaceId)))
      .limit(1);

    if (!lead) {
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: `Lead '${leadId}' not found in active workspace.`,
      });
    }

    const currentMeta = (lead.metadata || {}) as Record<string, any>;
    const updatedMetadata = {
      ...currentMeta,
      communicationState: "AI_ACTIVE",
      resumedAt: new Date().toISOString(),
    };

    const [updatedLead] = await this.db
      .update(schema.leads)
      .set({
        managementMode: "ai_autonomous",
        isAiStopped: false,
        aiStoppedReason: null,
        metadata: updatedMetadata,
        updatedAt: new Date(),
      })
      .where(eq(schema.leads.id, leadId))
      .returning();

    await this.db.insert(schema.leadEvents).values({
      leadId,
      workspaceId: tenant.workspaceId,
      type: "status_change",
      title: "AI Autonomy Resumed",
      description: "Autonomous qualification and follow-up sequencing re-engaged.",
      channel: "system",
      actorType: "human_broker",
      actorId: tenant.userId,
      metadata: { communicationState: "AI_ACTIVE" },
    });

    return updatedLead;
  }

  /**
   * Atomically marks all pending follow-ups for a lead as cancelled in Neon.
   */
  async cancelPendingFollowUpsForLead(
    leadId: string,
    workspaceId: string,
    reason: string
  ): Promise<number> {
    const pendingFollowUps = await this.db
      .select({ id: schema.followUps.id, notes: schema.followUps.notes })
      .from(schema.followUps)
      .where(
        and(
          eq(schema.followUps.leadId, leadId),
          eq(schema.followUps.workspaceId, workspaceId),
          eq(schema.followUps.status, "pending")
        )
      );

    if (pendingFollowUps.length === 0) {
      return 0;
    }

    await this.db
      .update(schema.followUps)
      .set({
        status: "cancelled",
        notes: reason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.followUps.leadId, leadId),
          eq(schema.followUps.workspaceId, workspaceId),
          eq(schema.followUps.status, "pending")
        )
      );

    return pendingFollowUps.length;
  }
}
