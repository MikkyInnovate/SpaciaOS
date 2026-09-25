import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ResendNotificationAdapter } from "./adapters/resend-notification.adapter";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [ResendNotificationAdapter, NotificationsService],
  exports: [NotificationsService, ResendNotificationAdapter],
})
export class NotificationsModule {}
