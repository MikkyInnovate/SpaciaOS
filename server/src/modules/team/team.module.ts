import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { TeamController } from "./team.controller";
import { TeamService } from "./team.service";

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
