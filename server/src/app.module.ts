import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./common/auth/auth.module";
import { ClerkAuthGuard } from "./common/auth/clerk-auth.guard";
import { WorkspaceMemberGuard } from "./common/auth/workspace-member.guard";
import { PermissionsGuard } from "./common/auth/permissions.guard";
import { HealthModule } from "./modules/health/health.module";
import { WorkspacesModule } from "./modules/workspaces/workspaces.module";
import { TesterModule } from "./modules/tester/tester.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { QueueModule } from "./modules/queue/queue.module";
import { AiToolsModule } from "./modules/ai-tools/ai-tools.module";
import { AiAgentModule } from "./modules/ai-agent/ai-agent.module";
import { CallsModule } from "./modules/calls/calls.module";
import { FollowUpsModule } from "./modules/follow-ups/follow-ups.module";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    HealthModule,
    WorkspacesModule,
    TesterModule,
    LeadsModule,
    PropertiesModule,
    QueueModule,
    AiToolsModule,
    AiAgentModule,
    CallsModule,
    FollowUpsModule,
    AppointmentsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: WorkspaceMemberGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
