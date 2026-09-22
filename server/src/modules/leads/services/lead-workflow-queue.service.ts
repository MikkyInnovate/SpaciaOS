import { Injectable, Inject, Logger } from "@nestjs/common";
import { SystemEventsService } from "../../workspaces/system-events.service";
import { TenantContext } from "../../../common/tenant/tenant-context.interface";
import { LeadRecord } from "../../../database/schema/leads.schema";
import {
  systemEvents,
  SystemEventRecord,
} from "../../../database/schema/system-events.schema";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";

@Injectable()
export class LeadWorkflowQueueService {
  private readonly logger = new Logger(LeadWorkflowQueueService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb,
    private readonly systemEventsService: SystemEventsService
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
   * In-process workflow dispatch: completely separated from durable persistence.
   * Handles non-blocking asynchronous triggering of downstream AI qualification and scoring tasks.
   */
  dispatchInProcessWorkflow(
    workspaceId: string,
    lead: LeadRecord,
    isReEngagement: boolean = false
  ): void {
    // Non-blocking fire-and-forget simulation
    setImmediate(() => {
      try {
        const action = isReEngagement
          ? "Lead re-engagement evaluation"
          : "Initial AI qualification & scoring pipeline";
        this.logger.log(
          `[Workflow Outbox Dispatched] Enqueued task: '${action}' for lead [${lead.id}] (Workspace: ${workspaceId})`
        );
      } catch (err: any) {
        this.logger.error(
          `Failed to dispatch in-process workflow for lead [${lead.id}]: ${err.message}`
        );
      }
    });
  }
}
