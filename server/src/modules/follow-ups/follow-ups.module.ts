import { Module } from "@nestjs/common";
import { CallsModule } from "../calls/calls.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { FollowUpsService } from "./follow-ups.service";
import { FollowUpWorkflowService } from "./services/follow-up-workflow.service";
import { HandoffService } from "./services/handoff.service";
import { FollowUpsController } from "./follow-ups.controller";

@Module({
  imports: [CallsModule, WorkspacesModule],
  controllers: [FollowUpsController],
  providers: [FollowUpsService, FollowUpWorkflowService, HandoffService],
  exports: [FollowUpsService, FollowUpWorkflowService, HandoffService],
})
export class FollowUpsModule {}
