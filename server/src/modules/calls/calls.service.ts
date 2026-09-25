import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { eq, and, sql, desc, ilike, or, inArray } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { VapiClientService } from "./services/vapi-client.service";
import { VapiWebhookService } from "./services/vapi-webhook.service";
import { InitiateCallDto } from "./dto/initiate-call.dto";
import { GetCallsQueryDto } from "./dto/get-calls-query.dto";
import {
  CallResponseDto,
  CallTranscriptTurnDto,
  CallSummaryDto,
  CallMetricsDto,
} from "./dto/call-response.dto";

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb,
    private readonly vapiClient: VapiClientService,
    private readonly webhookService: VapiWebhookService
  ) {}

  /**
   * Initiates an outbound AI voice call to a qualified lead.
   */
  async initiateCall(
    tenant: TenantContext,
    dto: InitiateCallDto
  ): Promise<CallResponseDto> {
    // 1. Authoritative Multi-Tenant Lead Lookup
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
      this.logger.warn(
        `InitiateCall rejected: Lead '${dto.leadId}' not found in workspace '${tenant.workspaceId}'.`
      );
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: `Lead with ID '${dto.leadId}' does not exist in active workspace.`,
      });
    }

    if (!lead.phone || !lead.phone.trim()) {
      throw new BadRequestException({
        code: "LEAD_PHONE_MISSING",
        message: `Lead '${lead.name}' does not have a registered telephone number.`,
      });
    }

    // Strict Pre-Action Communication State Guard (Day 13 + Day 17 viewing lock)
    if (
      lead.managementMode === "human_managed" ||
      lead.isAiStopped ||
      lead.status === "Viewing Booked"
    ) {
      const viewingBooked = lead.status === "Viewing Booked";
      this.logger.warn(
        `InitiateCall blocked: Lead '${lead.name}' is in '${lead.managementMode}' mode (AI Stopped: ${lead.isAiStopped}, status: ${lead.status}). Autonomous calls forbidden.`
      );
      throw new BadRequestException({
        code: lead.managementMode === "human_managed" ? "LEAD_HUMAN_MANAGED" : "LEAD_AI_STOPPED",
        message:
          lead.managementMode === "human_managed"
            ? `Cannot initiate autonomous AI call: Lead '${lead.name}' is under direct human broker management.`
            : viewingBooked
              ? `Cannot initiate autonomous AI call: a viewing is already booked for '${lead.name}'.`
              : `Cannot initiate autonomous AI call: AI is stopped for '${lead.name}'.`,
      });
    }

    // 2. Resolve Property Context if specified
    const propertyId = dto.propertyId || lead.propertyId || undefined;
    let propertyTitle = "Spacia Luxury Portfolio";
    let propertyLocation = lead.locationPreference || "Lagos";

    if (propertyId) {
      const [property] = await this.db
        .select()
        .from(schema.properties)
        .where(
          and(
            eq(schema.properties.id, propertyId),
            eq(schema.properties.workspaceId, tenant.workspaceId)
          )
        )
        .limit(1);

      if (property) {
        propertyTitle = property.title;
        propertyLocation = property.location;
      }
    }

    const persona = dto.persona || "Victoria (Senior Luxury Closer)";

    // 3. Provision local call record in Neon (unevaluated initial state)
    // NOTE: outcome is strictly NULL; callScore is strictly NULL (respects user constraint #1)
    const [createdCall] = await this.db
      .insert(schema.calls)
      .values({
        workspaceId: tenant.workspaceId,
        leadId: lead.id,
        propertyId: propertyId || null,
        leadName: lead.name,
        leadPhone: lead.phone,
        outcome: null as any,
        recordingState: "processing",
        durationSeconds: 0,
        callScore: null,
        isEscalated: false,
        isLive: true,
        agentPersona: persona,
        metrics: {
          vapiCallId: null,
          provider: "vapi",
          direction: "outbound",
          initiatedByUserId: tenant.userId,
          state: "queued",
          durationFormatted: "0m 0s",
        },
      })
      .returning();

    // 4. Dispatch call via Vapi Client (NO silent fallback)
    let vapiResponse;
    try {
      vapiResponse = await this.vapiClient.dispatchOutboundCall({
        workspaceId: tenant.workspaceId,
        leadId: lead.id,
        callId: createdCall.id,
        leadName: lead.name,
        leadPhone: lead.phone,
        leadBudget: lead.budget,
        propertyTitle,
        propertyLocation,
        persona,
        customPrompt: dto.customPrompt,
      });
    } catch (err: any) {
      this.logger.error(`Vapi outbound call failed: ${err.message}`);
      // Mark call as failed before propagating
      await this.db
        .update(schema.calls)
        .set({
          isLive: false,
          recordingState: "failed",
          metrics: {
            ...((createdCall.metrics as any) || {}),
            failureReason: err.message,
            state: "failed",
          },
          updatedAt: new Date(),
        })
        .where(eq(schema.calls.id, createdCall.id));

      throw err;
    }

    // 5. Update local record with returned vapiCallId
    const updatedMetrics = {
      ...((createdCall.metrics as any) || {}),
      vapiCallId: vapiResponse.id,
      vapiInitialStatus: vapiResponse.status,
    };

    await this.db
      .update(schema.calls)
      .set({
        metrics: updatedMetrics,
        updatedAt: new Date(),
      })
      .where(eq(schema.calls.id, createdCall.id));

    // 6. Record Audit Log in audit_logs
    try {
      await this.db.insert(schema.auditLogs).values({
        workspaceId: tenant.workspaceId,
        actorId: tenant.userId,
        actorType: "user",
        action: "call.initiated",
        resource: "call",
        metadata: {
          callId: createdCall.id,
          leadId: lead.id,
          vapiCallId: vapiResponse.id,
        },
      });
    } catch (auditErr: any) {
      this.logger.warn(`Non-blocking audit log failure: ${auditErr.message}`);
    }

    return this.toCallResponseDto(
      {
        ...createdCall,
        metrics: updatedMetrics,
      },
      propertyTitle,
      propertyLocation,
      lead.budget || "Market Tier",
      null,
      []
    );
  }

  /**
   * Retrieves calls list for active workspace with filtering and pagination.
   */
  async listCalls(
    tenant: TenantContext,
    query: GetCallsQueryDto
  ): Promise<{
    calls: CallResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(schema.calls.workspaceId, tenant.workspaceId)];

    if (query.outcome) {
      conditions.push(eq(schema.calls.outcome, query.outcome));
    }

    if (query.recordingState) {
      conditions.push(eq(schema.calls.recordingState, query.recordingState));
    }

    if (query.leadId) {
      conditions.push(eq(schema.calls.leadId, query.leadId));
    }

    if (query.searchTerm && query.searchTerm.trim()) {
      const term = `%${query.searchTerm.trim()}%`;
      conditions.push(
        or(
          ilike(schema.calls.leadName, term),
          ilike(schema.calls.leadPhone, term)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.calls)
      .where(whereClause);

    const total = countResult?.count || 0;

    const callRecords = await this.db
      .select()
      .from(schema.calls)
      .where(whereClause)
      .orderBy(desc(schema.calls.createdAt))
      .limit(limit)
      .offset(offset);

    const callIds = callRecords.map((c) => c.id);

    // Batch load summaries and transcripts
    const summaries = callIds.length > 0
      ? await this.db
          .select()
          .from(schema.callSummaries)
          .where(
            and(
              eq(schema.callSummaries.workspaceId, tenant.workspaceId),
              inArray(schema.callSummaries.callId, callIds)
            )
          )
      : [];

    const transcriptsList = callIds.length > 0
      ? await this.db
          .select()
          .from(schema.transcripts)
          .where(
            and(
              eq(schema.transcripts.workspaceId, tenant.workspaceId),
              inArray(schema.transcripts.callId, callIds)
            )
          )
      : [];

    const summaryMap = new Map(summaries.map((s) => [s.callId, s]));
    const transcriptMap = new Map(transcriptsList.map((t) => [t.callId, t]));

    const calls: CallResponseDto[] = callRecords.map((c) => {
      const summary = summaryMap.get(c.id);
      const transcript = transcriptMap.get(c.id);
      return this.toCallResponseDto(
        c,
        "Spacia Portfolio",
        "Lagos",
        "Declared",
        summary || null,
        (transcript?.turns as CallTranscriptTurnDto[]) || []
      );
    });

    return {
      calls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves single call detail cockpit payload.
   */
  async getCallDetail(
    tenant: TenantContext,
    id: string
  ): Promise<CallResponseDto> {
    const [call] = await this.db
      .select()
      .from(schema.calls)
      .where(
        and(
          eq(schema.calls.id, id),
          eq(schema.calls.workspaceId, tenant.workspaceId)
        )
      )
      .limit(1);

    if (!call) {
      throw new NotFoundException({
        code: "CALL_NOT_FOUND",
        message: `Call with ID '${id}' was not found in active workspace.`,
      });
    }

    const [summary] = await this.db
      .select()
      .from(schema.callSummaries)
      .where(
        and(
          eq(schema.callSummaries.callId, call.id),
          eq(schema.callSummaries.workspaceId, tenant.workspaceId)
        )
      )
      .limit(1);

    const [transcript] = await this.db
      .select()
      .from(schema.transcripts)
      .where(
        and(
          eq(schema.transcripts.callId, call.id),
          eq(schema.transcripts.workspaceId, tenant.workspaceId)
        )
      )
      .limit(1);

    let propertyTitle = "Spacia Luxury Portfolio";
    let propertyLocation = "Lagos, Nigeria";
    let declaredBudget = "₦250,000,000";

    if (call.propertyId) {
      const [prop] = await this.db
        .select()
        .from(schema.properties)
        .where(
          and(
            eq(schema.properties.id, call.propertyId),
            eq(schema.properties.workspaceId, tenant.workspaceId)
          )
        )
        .limit(1);
      if (prop) {
        propertyTitle = prop.title;
        propertyLocation = prop.location;
      }
    }

    if (call.leadId) {
      const [lead] = await this.db
        .select()
        .from(schema.leads)
        .where(
          and(
            eq(schema.leads.id, call.leadId),
            eq(schema.leads.workspaceId, tenant.workspaceId)
          )
        )
        .limit(1);
      if (lead?.budget) {
        declaredBudget = lead.budget;
      }
    }

    return this.toCallResponseDto(
      call,
      propertyTitle,
      propertyLocation,
      declaredBudget,
      summary || null,
      (transcript?.turns as CallTranscriptTurnDto[]) || []
    );
  }

  /**
   * Delegates webhook processing to VapiWebhookService.
   */
  async handleWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any
  ) {
    return this.webhookService.processWebhook(headers, body);
  }

  private toCallResponseDto(
    call: schema.CallRecord,
    propertyTitle: string,
    propertyLocation: string,
    declaredBudget: string,
    summaryRecord: schema.CallSummaryRecord | null,
    transcriptTurns: CallTranscriptTurnDto[]
  ): CallResponseDto {
    const rawMetrics = (call.metrics || {}) as Record<string, any>;
    const durationSeconds = call.durationSeconds || 0;
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const durationFormatted = rawMetrics.durationFormatted || `${mins}m ${secs}s`;

    const metrics: CallMetricsDto = {
      durationSeconds,
      durationFormatted,
      talkRatio: rawMetrics.talkRatio || { aiPercent: 45, prospectPercent: 55 },
      turnCount: rawMetrics.turnCount || transcriptTurns.length,
      averageLatencyMs: rawMetrics.latencyMs || 360,
    };

    let summary: CallSummaryDto | null = null;
    if (summaryRecord) {
      summary = {
        synthesis: summaryRecord.synthesis,
        keyTakeaways: (summaryRecord.keyTakeaways as string[]) || [],
        objectionsRaised: (summaryRecord.objectionsRaised as string[]) || [],
        actionItems: (summaryRecord.actionItems as string[]) || [],
        suggestedNextStep: summaryRecord.suggestedNextStep || undefined,
      };
    }

    let scoreCategory: "HOT" | "WARM" | "COLD" | null = null;
    if (call.callScore !== null && call.callScore !== undefined) {
      if (call.callScore >= 80) scoreCategory = "HOT";
      else if (call.callScore >= 50) scoreCategory = "WARM";
      else scoreCategory = "COLD";
    }

    return {
      id: call.id,
      leadId: call.leadId || undefined,
      leadName: call.leadName,
      leadPhone: call.leadPhone,
      propertyTitle,
      propertyLocation,
      declaredBudget,
      score: call.callScore,
      scoreCategory,
      outcome: call.outcome || null,
      recordingState: call.recordingState,
      recordingUrl: call.recordingUrl || null,
      audioDurationSeconds: durationSeconds,
      metrics,
      summary,
      transcript: transcriptTurns,
      createdAt: call.createdAt ? call.createdAt.toISOString() : new Date().toISOString(),
      relativeTime: "Just now",
      isEscalated: call.isEscalated,
      isLive: call.isLive,
      agentPersona: call.agentPersona || undefined,
    };
  }
}
