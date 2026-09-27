import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { IntegrationsModule } from "../integrations/integrations.module";
import { AiAgentModule } from "../ai-agent/ai-agent.module";
import { UsersModule } from "../users/users.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { OpsController } from "./ops.controller";
import { OpsService } from "./ops.service";

@Module({
  imports: [
    DatabaseModule,
    IntegrationsModule,
    AiAgentModule,
    UsersModule,
    WorkspacesModule,
  ],
  controllers: [OpsController],
  providers: [OpsService],
  exports: [OpsService],
})
export class OpsModule {}
