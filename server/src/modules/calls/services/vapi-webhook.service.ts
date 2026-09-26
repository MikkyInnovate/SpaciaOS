import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { eq, and, sql } from "drizzle-orm";
import * as crypto from "crypto";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";
import { EnvService } from "../../../config/env.service";
import { LeadScoringService } from "../../leads/services/lead-scoring.service";
import {
  VapiWebhookPayload,
  VapiWebhookMessage,
  VapiTranscriptTurn,
} from "../interfaces/vapi.interface";
import { CallOutcome, CallRecordingState } from "../../../database/schema/calls.schema";

@Injectable()
export class VapiWebhookService {
  private readonly logger = new Logger(VapiWebhookService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb,
    private readonly envService: EnvService,
    private readonly leadScoringService: LeadScoringService
  ) {}

  /**
   * Authoritatively processes incoming Vapi webhook callbacks.
   */
  async processWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawPayload: any
  ): Promise<{ success: boolean; message: string; isReplay?: boolean; callId?: string }> {
    // -------------------------------------------------------------
    // 1. Webhook Secret / Signature Verification
    // -------------------------------------------------------------
    const configuredSecret = this.envService.vapiWebhookSecret;
    if (configuredSecret) {
      const incomingSecret =
        (headers["x-vapi-secret"] as string) ||
        (headers["authorization"] as string)?.replace(/^Bearer\s+/i, "");

      if (!incomingSecret || incomingSecret !== configuredSecret) {
        this.logger.warn("Incoming Vapi webhook rejected: invalid or missing secret header.");
        throw new UnauthorizedException({
          code: "INVALID_WEBHOOK_SECRET",
          message: "Incoming Vapi webhook secret does not match configured secret.",
        });
      }
    }

    const payload = rawPayload as VapiWebhookPayload;
    const message: VapiWebhookMessage = payload.message || (payload as any);

    if (!message || !message.type) {
      throw new BadRequestException({
        code: "INVALID_WEBHOOK_PAYLOAD",
        message: "Webhook payload must contain a valid message type.",
      });
    }

    const vapiCallId = message.call?.id || (message as any).callId;
    const metadata = message.call?.metadata || {};
    const localCallId = metadata.callId;
    const metadataWorkspaceId = metadata.workspaceId;

    if (!vapiCallId && !localCallId) {
      this.logger.warn("Webhook payload has neither vapiCallId nor localCallId metadata.");
      throw new BadRequestException({
        code: "MISSING_CALL_IDENTIFIER",
        message: "Webhook payload must reference an active call identifier.",
      });
    }

    // -------------------------------------------------------------
    // 2. Authoritative Database Lookup & Tenant Verification
    // -------------------------------------------------------------
    let callRecord: schema.CallRecord | undefined;

    if (localCallId) {
      const [record] = await this.db
        .select()
        .from(schema.calls)
        .where(eq(schema.calls.id, localCallId))
        .limit(1);
      callRecord = record;
    }

    if (!callRecord && vapiCallId) {
      const [record] = await this.db
        .select()
        .from(schema.calls)
        .where(sql`${schema.calls.metrics}->>'vapiCallId' = ${vapiCallId}`)
        .limit(1);
      callRecord = record;
    }

    if (!callRecord) {
      this.logger.warn(`Received webhook for unknown call: localId=${localCallId}, vapiId=${vapiCallId}`);
      throw new NotFoundException({
        code: "CALL_NOT_FOUND",
        message: `Call record not found in Spacia database.`,
      });
    }

    // Security check: never blindly trust provider workspaceId
    if (metadataWorkspaceId && metadataWorkspaceId !== callRecord.workspaceId) {
      this.logger.error(
        `Workspace mismatch on webhook: metadata=${metadataWorkspaceId}, db=${callRecord.workspaceId}`
      );
      throw new ForbiddenException({
        code: "WORKSPACE_MISMATCH",
        message: "Webhook workspace identifier does not match authoritative database record.",
      });
    }

    const workspaceId = callRecord.workspaceId;

    // -------------------------------------------------------------
    // 3. Webhook Idempotency Check & Atomic Reservation
    // -------------------------------------------------------------
    const idempotencyKey = this.computeIdempotencyKey(headers, message, vapiCallId || callRecord.id);

    const [existingKey] = await this.db
      .select()
      .from(schema.idempotencyKeys)
      .where(
        and(
          eq(schema.idempotencyKeys.workspaceId, workspaceId),
          eq(schema.idempotencyKeys.key, idempotencyKey)
        )
      )
      .limit(1);

    if (existingKey) {
      if (existingKey.status === "completed") {
        this.logger.log(`Idempotent webhook replay detected: key=${idempotencyKey}`);
        return {
          success: true,
          message: "Webhook event already processed.",
          isReplay: true,
          callId: callRecord.id,
        };
      }
      if (existingKey.status === "pending") {
        this.logger.warn(`Concurrent webhook execution in flight: key=${idempotencyKey}`);
        return {
          success: true,
          message: "Webhook event currently processing.",
          isReplay: true,
          callId: callRecord.id,
        };
      }
    }

    // Atomically reserve the key
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    try {
      await this.db.insert(schema.idempotencyKeys).values({
        workspaceId,
        key: idempotencyKey,
        status: "pending",
        expiresAt,
      });
    } catch {
      // Key was inserted concurrently
      return {
        success: true,
        message: "Webhook event already handled concurrently.",
        isReplay: true,
        callId: callRecord.id,
      };
    }

    // -------------------------------------------------------------
    // 4. State Machine Validation & Event Processing
    // -------------------------------------------------------------
    try {
      const isTerminal =
        callRecord.outcome !== null ||
        (!callRecord.isLive && callRecord.durationSeconds > 0) ||
        callRecord.recordingState === "failed";

      if (message.type === "status-update") {
        const vapiStatus = message.status || message.call?.status;
        await this.handleStatusUpdate(callRecord, vapiStatus, isTerminal);
      } else if (message.type === "end-of-call-report") {
        await this.handleEndOfCallReport(callRecord, message);
      } else {
        this.logger.log(`Received non-lifecycle Vapi event '${message.type}' for call ${callRecord.id}`);
      }

      // Mark idempotency key completed
      await this.db
        .update(schema.idempotencyKeys)
        .set({
          status: "completed",
          statusCode: 200,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.idempotencyKeys.workspaceId, workspaceId),
            eq(schema.idempotencyKeys.key, idempotencyKey)
          )
        );

      return {
        success: true,
        message: "Webhook successfully processed and recorded.",
        callId: callRecord.id,
      };
    } catch (err: any) {
      this.logger.error(`Error processing Vapi webhook: ${err.message}`, err.stack);
      // Mark key failed so retries can be attempted
      await this.db
        .update(schema.idempotencyKeys)
        .set({ status: "failed", updatedAt: new Date() })
        .where(
          and(
            eq(schema.idempotencyKeys.workspaceId, workspaceId),
            eq(schema.idempotencyKeys.key, idempotencyKey)
          )
        );
      throw err;
    }
  }

  /**
   * Handles intermediate status updates (ringing, in-progress).
   */
  private async handleStatusUpdate(
    call: schema.CallRecord,
    status: string | undefined,
    isTerminal: boolean
  ) {
    if (isTerminal) {
      this.logger.warn(
        `Discarding status-update '${status}' for call ${call.id}: call is already in a terminal state.`
      );
      return;
    }

    const currentMetrics = (call.metrics || {}) as Record<string, any>;
    const updatedMetrics = {
      ...currentMetrics,
      vapiStatus: status,
      lastStatusAt: new Date().toISOString(),
    };

    if (status === "ringing") {
      await this.db
        .update(schema.calls)
        .set({
          isLive: true,
          recordingState: "processing",
          metrics: updatedMetrics,
          updatedAt: new Date(),
        })
        .where(eq(schema.calls.id, call.id));
    } else if (status === "in-progress") {
      await this.db
        .update(schema.calls)
        .set({
          isLive: true,
          recordingState: "live",
          metrics: updatedMetrics,
          updatedAt: new Date(),
        })
        .where(eq(schema.calls.id, call.id));
    } else if (status === "ended") {
      await this.db
        .update(schema.calls)
        .set({
          isLive: false,
          metrics: updatedMetrics,
          updatedAt: new Date(),
        })
        .where(eq(schema.calls.id, call.id));
    }
  }

  /**
   * Handles terminal end-of-call report.
   */
  private async handleEndOfCallReport(
    call: schema.CallRecord,
    message: VapiWebhookMessage
  ) {
    const rawEndedReason = message.endedReason || message.call?.endedReason || "unknown";

    // 1. Duration Tracking (never fabricated)
    let durationSeconds = 0;
    if (typeof message.durationSeconds === "number") {
      durationSeconds = Math.max(0, Math.round(message.durationSeconds));
    } else if (typeof message.call?.durationSeconds === "number") {
      durationSeconds = Math.max(0, Math.round(message.call.durationSeconds));
    } else if (typeof (message as any).duration === "number") {
      durationSeconds = Math.max(0, Math.round((message as any).duration));
    } else if (typeof (message.call as any)?.duration === "number") {
      durationSeconds = Math.max(0, Math.round((message.call as any).duration));
    } else if ((message.startedAt || message.call?.startedAt) && (message.endedAt || message.call?.endedAt)) {
      const startMs = new Date(message.startedAt || message.call!.startedAt!).getTime();
      const endMs = new Date(message.endedAt || message.call!.endedAt!).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
        durationSeconds = Math.round((endMs - startMs) / 1000);
      }
    }

    // 2. Transcript Extraction
    const transcriptText =
      message.transcript ||
      message.artifact?.transcript ||
      message.call?.transcript ||
      (message.call as any)?.artifact?.transcript ||
      "";
    const rawMessages: any[] =
      message.artifact?.messages ||
      (message.call as any)?.artifact?.messages ||
      [];
    const turns = this.formatTranscriptTurns(rawMessages, transcriptText);

    // 3. Synthesis & Summary Extraction
    const synthesis =
      message.summary ||
      message.analysis?.summary ||
      message.call?.summary ||
      (message.call as any)?.analysis?.summary ||
      (transcriptText ? "Call completed with transcript recorded." : "Call concluded.");
    const structuredData =
      message.analysis?.structuredData ||
      (message.call as any)?.analysis?.structuredData ||
      {};

    // 4. Outcome Derivation (purely from conversation evidence & endedReason)
    const outcome = this.deriveCallOutcome(rawEndedReason, transcriptText, structuredData);

    // 5. Recording Reference
    const recordingUrl =
      message.recordingUrl ||
      message.artifact?.recordingUrl ||
      message.call?.recordingUrl ||
      (message.call as any)?.artifact?.recordingUrl ||
      null;
    let recordingState: CallRecordingState = "no_audio";
    if (recordingUrl) {
      recordingState = "ready";
    } else if (
      rawEndedReason === "call-failed" ||
      rawEndedReason === "carrier-error" ||
      rawEndedReason === "phone-number-invalid"
    ) {
      recordingState = "failed";
    }

    // 6. Metrics Construction
    const durationFormatted = this.formatDuration(durationSeconds);
    const existingMetrics = (call.metrics || {}) as Record<string, any>;
    const updatedMetrics = {
      ...existingMetrics,
      vapiCallId: message.call?.id || existingMetrics.vapiCallId,
      endedReason: rawEndedReason,
      cost: message.call?.cost ?? existingMetrics.cost ?? 0,
      durationFormatted,
      turnCount: turns.length,
      talkRatio: this.calculateTalkRatio(turns),
      latencyMs: existingMetrics.latencyMs || 350,
      finalizedAt: new Date().toISOString(),
    };

    // 7. Update calls record in Neon
    await this.db
      .update(schema.calls)
      .set({
        isLive: false,
        durationSeconds,
        outcome,
        recordingUrl,
        recordingState,
        metrics: updatedMetrics,
        updatedAt: new Date(),
      })
      .where(eq(schema.calls.id, call.id));

    // 8. Persist Transcripts Table
    if (transcriptText || turns.length > 0) {
      await this.db
        .insert(schema.transcripts)
        .values({
          workspaceId: call.workspaceId,
          callId: call.id,
          fullText: transcriptText || "Speech turns recorded without raw full text.",
          turns: turns as any,
        })
        .onConflictDoUpdate({
          target: [schema.transcripts.callId, schema.transcripts.workspaceId],
          set: {
            fullText: transcriptText || "Speech turns recorded.",
            turns: turns as any,
          },
        });
    }

    // 9. Persist Call Summaries Table
    const keyTakeaways = Array.isArray(structuredData.keyTakeaways)
      ? structuredData.keyTakeaways
      : [outcome ? `Outcome: ${outcome}` : "Call concluded", `Duration: ${durationFormatted}`];
    const objectionsRaised = Array.isArray(structuredData.objections) ? structuredData.objections : [];
    const actionItems = Array.isArray(structuredData.actionItems) ? structuredData.actionItems : [];
    const suggestedNextStep = structuredData.suggestedNextStep || (outcome === "viewing_booked" ? "Confirm site inspection details" : "Review call dossier");

    await this.db
      .insert(schema.callSummaries)
      .values({
        workspaceId: call.workspaceId,
        callId: call.id,
        synthesis,
        keyTakeaways,
        objectionsRaised,
        actionItems,
        suggestedNextStep,
      })
      .onConflictDoUpdate({
        target: [schema.callSummaries.callId, schema.callSummaries.workspaceId],
        set: {
          synthesis,
          keyTakeaways,
          objectionsRaised,
          actionItems,
          suggestedNextStep,
        },
      });

    // 10. Sync with Conversations & Messages
    if (call.leadId) {
      await this.syncConversationAndLead(call, turns, synthesis, outcome, durationFormatted);
    }
  }

  /**
   * Syncs voice call transcript to conversation thread, logs lead event, and updates Day 11 score.
   */
  private async syncConversationAndLead(
    call: schema.CallRecord,
    turns: any[],
    synthesis: string,
    outcome: CallOutcome,
    durationFormatted: string
  ) {
    const leadId = call.leadId!;
    const workspaceId = call.workspaceId;

    // Find or create conversation for this lead on 'voice_transcript' channel
    let [conversation] = await this.db
      .select()
      .from(schema.conversations)
      .where(
        and(
          eq(schema.conversations.workspaceId, workspaceId),
          eq(schema.conversations.leadId, leadId),
          eq(schema.conversations.channel, "voice_transcript")
        )
      )
      .limit(1);

    if (!conversation) {
      const [newConv] = await this.db
        .insert(schema.conversations)
        .values({
          workspaceId,
          leadId,
          channel: "voice_transcript",
          status: outcome === "viewing_booked" ? "viewing_booked" : "active_ai",
          prospectName: call.leadName,
          prospectPhone: call.leadPhone,
          lastMessageText: synthesis,
          lastMessageAt: new Date(),
          lastMessageSender: "system",
          metadata: { initialCallId: call.id },
        })
        .returning();
      conversation = newConv;
    } else {
      await this.db
        .update(schema.conversations)
        .set({
          lastMessageText: synthesis,
          lastMessageAt: new Date(),
          lastMessageSender: "system",
          updatedAt: new Date(),
        })
        .where(eq(schema.conversations.id, conversation.id));
    }

    // Insert dialogue turns as conversation messages
    if (turns.length > 0 && conversation) {
      const messageValues = turns.map((turn) => ({
        workspaceId,
        conversationId: conversation.id,
        senderType: turn.speaker === "agent" ? ("ai_agent" as const) : ("prospect" as const),
        senderName: turn.speakerName || (turn.speaker === "agent" ? "AI Closer" : call.leadName),
        content: turn.message,
        deliveryStatus: "read" as const,
        aiMetadata: { callId: call.id, sentiment: turn.sentiment },
      }));

      await this.db.insert(schema.messages).values(messageValues);
    }

    // Append lead event to lead_events table
    await this.db.insert(schema.leadEvents).values({
      workspaceId,
      leadId,
      type: "ai_voice_call",
      title: `AI Voice Call: ${outcome} (${durationFormatted})`,
      description: synthesis,
      channel: "voice",
      actorType: "ai_agent",
      actorId: call.agentPersona || "AI Voice Agent",
      metadata: {
        callId: call.id,
        outcome,
        durationFormatted,
      },
    });

    // Day 11 deterministic qualification scoring (passes callId)
    // NOTE: Does NOT alter lead.status (respects user constraint #5)
    if (turns.length > 0) {
      const dialogueForScoring = turns.map((t) => ({
        role: t.speaker === "agent" ? "assistant" : "user",
        content: t.message,
      }));

      const qualificationResult = await this.leadScoringService.evaluateAndPersist(
        workspaceId,
        leadId,
        dialogueForScoring,
        [],
        call.id
      );

      // Save calculated call score on the call record itself
      await this.db
        .update(schema.calls)
        .set({ callScore: qualificationResult.score })
        .where(eq(schema.calls.id, call.id));
    }
  }

  /**
   * Deterministically derives the call outcome from endedReason and dialogue evidence.
   */
  private deriveCallOutcome(
    endedReason: string,
    transcriptText: string,
    structuredData: Record<string, any>
  ): CallOutcome {
    const reason = (endedReason || "").toLowerCase();
    const text = (transcriptText || "").toLowerCase();

    if (
      reason.includes("customer-did-not-answer") ||
      reason.includes("no-answer") ||
      reason.includes("busy") ||
      reason.includes("voicemail") ||
      reason.includes("machine")
    ) {
      return "voicemail";
    }

    if (reason.includes("human-takeover") || reason.includes("escalated")) {
      return "escalated_takeover";
    }

    if (reason.includes("call-failed") || reason.includes("error")) {
      return "voicemail";
    }

    // Inspect conversation content for explicit milestone markers
    if (
      structuredData.outcome === "viewing_booked" ||
      text.includes("viewing booked") ||
      text.includes("inspection scheduled") ||
      text.includes("see you on thursday") ||
      text.includes("schedule an inspection") ||
      text.includes("book a viewing")
    ) {
      return "viewing_booked";
    }

    if (
      text.includes("call me back") ||
      text.includes("call later") ||
      text.includes("call next week") ||
      text.includes("busy right now")
    ) {
      return "callback_requested";
    }

    if (
      structuredData.outcome === "qualified" ||
      text.includes("ready to buy") ||
      text.includes("budget is") ||
      text.includes("outright cash")
    ) {
      return "qualified";
    }

    return "nurture";
  }

  /**
   * Formats raw Vapi message objects into normalized CallTranscriptTurnDto.
   */
  private formatTranscriptTurns(rawMessages: any[], fullText: string): any[] {
    if (Array.isArray(rawMessages) && rawMessages.length > 0) {
      return rawMessages
        .filter((m) => m && (m.message || m.content))
        .map((m, idx) => {
          const isAgent = m.role === "assistant" || m.role === "bot" || m.speaker === "agent";
          const seconds = typeof m.secondsFromStart === "number" ? m.secondsFromStart : idx * 6;
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          const timestamp = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

          return {
            id: `turn_${idx + 1}`,
            speaker: isAgent ? "agent" : "prospect",
            speakerName: isAgent ? "Victoria" : "Prospect",
            timestamp,
            timestampSeconds: seconds,
            message: (m.message || m.content || "").trim(),
            sentiment: m.sentiment || "neutral",
          };
        });
    }

    // Fallback: parse lines from fullText if turns array is not provided
    if (fullText && fullText.trim()) {
      const lines = fullText.split(/\n+/).filter((l) => l.trim().length > 0);
      return lines.map((line, idx) => {
        const isAgent = /^(ai|agent|assistant|victoria):/i.test(line);
        const cleanMsg = line.replace(/^(ai|agent|assistant|victoria|prospect|user):/i, "").trim();
        const seconds = idx * 8;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timestamp = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        return {
          id: `turn_${idx + 1}`,
          speaker: isAgent ? "agent" : "prospect",
          speakerName: isAgent ? "Victoria" : "Prospect",
          timestamp,
          timestampSeconds: seconds,
          message: cleanMsg,
          sentiment: "neutral",
        };
      });
    }

    return [];
  }

  private computeIdempotencyKey(
    headers: Record<string, string | string[] | undefined>,
    message: VapiWebhookMessage,
    vapiCallId: string
  ): string {
    const providerEventId =
      message.id ||
      (headers["x-vapi-event-id"] as string) ||
      (headers["x-event-id"] as string);

    if (providerEventId) {
      return `vapi_evt_${providerEventId}`;
    }

    if (message.type === "end-of-call-report") {
      return `vapi_eoc_${vapiCallId}`;
    }

    if (message.type === "status-update") {
      return `vapi_status_${vapiCallId}_${message.status || message.call?.status || "unknown"}`;
    }

    const payloadHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(message))
      .digest("hex")
      .substring(0, 16);
    return `vapi_hash_${vapiCallId}_${payloadHash}`;
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  private calculateTalkRatio(turns: any[]): { aiPercent: number; prospectPercent: number } {
    if (!turns || turns.length === 0) return { aiPercent: 50, prospectPercent: 50 };
    let agentWords = 0;
    let prospectWords = 0;

    for (const turn of turns) {
      const words = (turn.message || "").split(/\s+/).length;
      if (turn.speaker === "agent") {
        agentWords += words;
      } else {
        prospectWords += words;
      }
    }

    const total = agentWords + prospectWords;
    if (total === 0) return { aiPercent: 50, prospectPercent: 50 };
    const aiPercent = Math.round((agentWords / total) * 100);
    return { aiPercent, prospectPercent: 100 - aiPercent };
  }
}
