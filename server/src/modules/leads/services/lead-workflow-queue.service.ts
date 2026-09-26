import { Injectable, Inject, Logger } from "@nestjs/common";
import { SystemEventsService } from "../../workspaces/system-events.service";
import { LeadRecord } from "../../../database/schema/leads.schema";
import {
  systemEvents,
  SystemEventRecord,
} from "../../../database/schema/system-events.schema";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import { BullMQQueueService } from "../../queue/bullmq-queue.service";
import { NewLeadWorkflowPayload } from "../../queue/queue.interface";

@Injectable()
export class LeadWorkflowQueueService {
  private readonly logger = new Logger(LeadWorkflowQueueService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb,
    private readonly systemEventsService: SystemEventsService,
    private readonly bullmqQueueService: BullMQQueueService
  ) {}

  /**
   * Persists the durable 'NewLead' event into PostgreSQL `system_events` table (Transactional Outbox).
   * Supports executing within an interactive database transaction.
   */
  async recordDurableNewLeadEvent(
    workspaceId: string,
    lead: LeadRecord,
    additionalPayload: Record<string, any> = {},
    executor?: any
  ): Promise<SystemEventRecord> {
    const dbContext = executor || this.db;

    const [record] = await dbContext
      .insert(systemEvents)
      .values({
        workspaceId,
        eventName: "NewLead",
        aggregateType: "lead",
        aggregateId: lead.id,
        payload: {
          leadId: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          propertyId: lead.propertyId,
          source: lead.source,
          status: lead.status,
          scoreCategory: lead.scoreCategory,
          ...additionalPayload,
        },
        status: "emitted",
      })
      .returning();

    this.logger.log(
      `Durable system event 'NewLead' recorded: [${record.id}] for lead [${lead.id}] in workspace [${workspaceId}]`
    );

    return record;
  }

  /**
   * Dispatches the asynchronous lead workflow through the Queue Abstraction layer (BullMQ + Redis).
   * 
   * Strict Constraints:
   * 1. Preserves non-blocking lead ingestion: Does not execute or wait for downstream AI workflow.
   * 2. Uses minimal, domain-oriented payload (NewLeadWorkflowPayload).
   * 3. Deterministic duplicate-job protection via BullMQ jobId (`lead_wf_${workspaceId}_${leadId}`).
   * 4. Centralized retry with exponential backoff (3 attempts, 1s -> 2s -> 4s).
   * 5. Surfaces Redis infrastructure failure explicitly if unavailable (no silent in-memory fallback).
   */
  async dispatchLeadWorkflow(
    workspaceId: string,
    lead: LeadRecord,
    isReEngagement: boolean = false
  ): Promise<void> {
    const payload: NewLeadWorkflowPayload = {
      workspaceId,
      leadId: lead.id,
      phone: lead.phone,
      email: lead.email ?? undefined,
      source: lead.source,
      isReEngagement,
      metadata: {
        propertyId: lead.propertyId,
        scoreCategory: lead.scoreCategory,
        intent: lead.intent,
      },
    };

    try {
      await this.bullmqQueueService.dispatchLeadWorkflow(payload);
      this.logger.log(
        `[LeadWorkflowQueue] Enqueued 'process-new-lead' job for lead [${lead.id}] in workspace [${workspaceId}]`
      );
    } catch (err: any) {
      this.logger.error(
        `[LeadWorkflowQueue FAILED] Could not dispatch workflow for lead [${lead.id}] (Workspace: ${workspaceId}): ${err.message}`,
        err.stack
      );
      throw err;
    }
  }

  /**
   * Non-blocking workflow dispatch: Invoked post-transaction during lead ingestion.
   * Dispatches the job to BullMQ/Redis in the background without blocking the synchronous HTTP response.
   */
  dispatchInProcessWorkflow(
    workspaceId: string,
    lead: LeadRecord,
    isReEngagement: boolean = false
  ): void {
    // Fire-and-dispatch asynchronously so HTTP ingestion returns immediately
    this.dispatchLeadWorkflow(workspaceId, lead, isReEngagement).catch((err: any) => {
      this.logger.error(
        `[Asynchronous Queue Dispatch Error] Failed to enqueue lead [${lead.id}]: ${err.message}`
      );
    });
  }
}
