import { Module } from "@nestjs/common";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { LeadsIngestController } from "./leads-ingest.controller";
import { LeadsIngestService } from "./leads-ingest.service";
import { LeadIdempotencyService } from "./services/lead-idempotency.service";
import { LeadDeduplicationService } from "./services/lead-deduplication.service";
import { LeadWorkflowQueueService } from "./services/lead-workflow-queue.service";

@Module({
  imports: [WorkspacesModule],
  controllers: [LeadsIngestController],
  providers: [
    LeadsIngestService,
    LeadIdempotencyService,
    LeadDeduplicationService,
    LeadWorkflowQueueService,
  ],
  exports: [
    LeadsIngestService,
    LeadIdempotencyService,
    LeadDeduplicationService,
    LeadWorkflowQueueService,
  ],
})
export class LeadsModule {}
