import { Module, Global } from "@nestjs/common";
import { WorkspacesController } from "./workspaces.controller";
import { WorkspacesService } from "./workspaces.service";
import { WorkspacesRepository } from "./workspaces.repository";
import { SystemEventsService } from "./system-events.service";
import { SystemEventsRepository } from "./system-events.repository";
import { WorkspaceMembersRepository } from "./workspace-members.repository";
import { WorkspaceMembersService } from "./workspace-members.service";
import { ProvisioningService } from "./provisioning.service";

@Global()
@Module({
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    WorkspacesRepository,
    SystemEventsService,
    SystemEventsRepository,
    WorkspaceMembersRepository,
    WorkspaceMembersService,
    ProvisioningService,
  ],
  exports: [
    WorkspacesService,
    WorkspacesRepository,
    SystemEventsService,
    SystemEventsRepository,
    WorkspaceMembersRepository,
    WorkspaceMembersService,
    ProvisioningService,
  ],
})
export class WorkspacesModule {}
