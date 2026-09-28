import { apiClient } from "@/lib/api/client";
import type {
  AppNotification,
  NotificationsResponse,
} from "../types";

export function formatTimeAgo(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    if (diffMs < 0) return "just now";
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "recently";
  }
}

export function resolveNotificationTarget(item: AppNotification): string | null {
  if (item.targetUrl) return item.targetUrl;
  if (item.entityType === "lead" && item.entityId) {
    return `/leads?id=${item.entityId}`;
  }
  if (item.entityType === "appointment") {
    return `/appointments${item.entityId ? `?id=${item.entityId}` : ""}`;
  }
  if (item.entityType === "call" && item.entityId) {
    return `/calls?id=${item.entityId}`;
  }
  return null;
}

const INITIAL_FALLBACK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif_takeover_01",
    workspaceId: "ws_default",
    type: "takeover",
    title: "Urgent Human Takeover Recommended",
    message: "Michael Adeleke (₦85M budget) requested a live closer to finalize Banana Island viewing.",
    isRead: false,
    priority: "high",
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    entityType: "lead",
    entityId: "lead_01",
    targetUrl: "/leads?id=lead_01",
  },
  {
    id: "notif_viewing_02",
    workspaceId: "ws_default",
    type: "viewing",
    title: "Viewing Confirmed via AI Voice",
    message: "Sarah Jenkins booked Waterfront Penthouse inspection with Victoria Okon for Friday.",
    isRead: false,
    priority: "medium",
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    entityType: "appointment",
    entityId: "apt_03_jenkins",
    targetUrl: "/appointments",
  },
  {
    id: "notif_qualified_03",
    workspaceId: "ws_default",
    type: "qualified",
    title: "Autonomous Lead Qualified (HOT 94/100)",
    message: "Alhaji Danjuma verified commercial liquidity for The Grand Waterfront Villa (₦950M).",
    isRead: true,
    priority: "high",
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    entityType: "lead",
    entityId: "lead_01_danjuma",
    targetUrl: "/leads?id=lead_01_danjuma",
  },
  {
    id: "notif_reminder_04",
    workspaceId: "ws_default",
    type: "reminder",
    title: "Viewing Reminder Dispatched (24h)",
    message: "Automated Resend confirmation delivered to Chief Adeleke for Eko Atlantic inspection.",
    isRead: true,
    priority: "low",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    entityType: "appointment",
    entityId: "apt_02_adeleke",
    targetUrl: "/appointments",
  },
];

class NotificationsService {
  private cache: AppNotification[] = JSON.parse(
    JSON.stringify(INITIAL_FALLBACK_NOTIFICATIONS)
  );

  async getNotifications(filters?: {
    type?: string;
    isRead?: boolean;
    limit?: number;
  }): Promise<NotificationsResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.type && filters.type !== "all") {
        params.set("type", filters.type);
      }
      if (filters?.limit) {
        params.set("limit", String(filters.limit));
      }
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await apiClient.get<any>(`/api/v1/notifications${qs}`);

      let items: AppNotification[] = [];
      if (Array.isArray(res)) {
        items = res;
      } else if (res && Array.isArray(res.notifications)) {
        items = res.notifications;
      } else if (res && Array.isArray(res.data?.notifications)) {
        items = res.data.notifications;
      }

      if (items.length > 0) {
        // Map backend schema to AppNotification if needed
        const mapped = items.map((r: any) => ({
          id: r.id,
          workspaceId: r.workspaceId || "ws_default",
          type: r.type || "system",
          title: r.title || "Operational Alert",
          message: r.message || "",
          isRead: Boolean(r.isRead),
          priority: r.metadata?.priority || "medium",
          createdAt: r.createdAt || new Date().toISOString(),
          timeAgo: formatTimeAgo(r.createdAt || new Date().toISOString()),
          entityType: r.entityType || undefined,
          entityId: r.entityId || null,
          targetUrl: resolveNotificationTarget(r) ?? undefined,
          metadata: r.metadata,
        }));
        this.cache = mapped;
      }
    } catch {
      // Backend not yet reachable or in dev; rely on in-memory cache
    }

    let filtered = [...this.cache];
    if (filters?.type && filters.type !== "all") {
      filtered = filtered.filter((n) => n.type === filters.type);
    }
    if (filters?.isRead !== undefined) {
      filtered = filtered.filter((n) => n.isRead === filters.isRead);
    }

    const unreadCount = this.cache.filter((n) => !n.isRead).length;

    return {
      notifications: filtered.map((n) => ({
        ...n,
        timeAgo: formatTimeAgo(n.createdAt),
      })),
      unreadCount,
      total: this.cache.length,
    };
  }

  async markAsRead(id: string): Promise<boolean> {
    const item = this.cache.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
    }

    try {
      await apiClient.patch(`/api/v1/notifications/${id}/read`, {});
      return true;
    } catch {
      // Fallback optimistic update
      return true;
    }
  }

  async markAllAsRead(): Promise<boolean> {
    this.cache.forEach((n) => {
      n.isRead = true;
    });

    try {
      await apiClient.post("/api/v1/notifications/mark-all-read", {});
      return true;
    } catch {
      // Fallback optimistic update
      return true;
    }
  }

  getUnreadCount(): number {
    return this.cache.filter((n) => !n.isRead).length;
  }
}

export const notificationsService = new NotificationsService();
