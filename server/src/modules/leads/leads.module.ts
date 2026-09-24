import { Module } from "@nestjs/common";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { QueueModule } from "../queue/queue.module";
import { LeadsIngestController } from "./leads-ingest.controller";
import { LeadsIngestService } from "./leads-ingest.service";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";
import { LeadIdempotencyService } from "./services/lead-idempotency.service";
import { LeadDeduplicationService } from "./services/lead-deduplication.service";
import { LeadWorkflowQueueService } from "./services/lead-workflow-queue.service";
import { LeadScoringService } from "./services/lead-scoring.service";

@Module({
  imports: [WorkspacesModule, QueueModule],
  controllers: [LeadsIngestController, LeadsController],
  providers: [
    LeadsIngestService,
    LeadsService,
    LeadIdempotencyService,
    LeadDeduplicationService,
    LeadWorkflowQueueService,
    LeadScoringService,
  ],
  exports: [
    LeadsIngestService,
    LeadsService,
    LeadIdempotencyService,
    LeadDeduplicationService,
    LeadWorkflowQueueService,
    LeadScoringService,
  ],
})
export class LeadsModule {}
