export type NotificationType =
  | "takeover"
  | "viewing"
  | "qualified"
  | "reminder"
  | "system";

export type NotificationPriority = "high" | "medium" | "low";

export interface AppNotification {
  id: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority?: NotificationPriority;
  createdAt: string;
  timeAgo?: string;
  entityType?: "lead" | "appointment" | "call" | "system";
  entityId?: string | null;
  targetUrl?: string;
  metadata?: Record<string, unknown>;
}

export type NotificationFilter = "all" | "unread";

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
  total: number;
}
