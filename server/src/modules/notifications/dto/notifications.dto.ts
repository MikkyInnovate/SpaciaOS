import { IsOptional, IsString, IsIn, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class GetNotificationsQueryDto {
  @IsOptional()
  @IsIn(["all", "unread"])
  filter?: "all" | "unread";

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface FormattedNotificationDto {
  id: string;
  workspaceId: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  isRead: boolean;
  timestamp: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export interface NotificationsListResponseDto {
  notifications: FormattedNotificationDto[];
  unreadCount: number;
  count: number;
}
