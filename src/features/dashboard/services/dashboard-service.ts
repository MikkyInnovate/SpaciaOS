import { apiClient } from "@/lib/api/client";
import type {
  DashboardMetrics,
  AttentionItem,
  DashboardFeedItem,
  PipelineFunnelStageItem,
} from "../types";

export class DashboardService {
  /**
   * 1. GET /api/v1/dashboard/metrics
   * Retrieves aggregated counts for all 7 command center dimensions:
   * Leads, Calls, Qualified, Hot, Viewings, Handoffs, Follow-ups
   */
  async getMetrics(params?: {
    range?: string;
    propertyId?: string;
  }): Promise<DashboardMetrics> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.range) searchParams.set("range", params.range);
      if (params?.propertyId) searchParams.set("propertyId", params.propertyId);

      const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
      const res = await apiClient.get<DashboardMetrics | { data: DashboardMetrics }>(
        `/api/v1/dashboard/metrics${qs}`
      );

      if (res && "leads" in res && "calls" in res) {
        return res as DashboardMetrics;
      }
      if (res && typeof res === "object" && "data" in res && (res as { data: DashboardMetrics }).data?.leads) {
        return (res as { data: DashboardMetrics }).data;
      }
    } catch (err) {
      console.warn("Dashboard metrics API failed, using fallback:", (err as Error).message);
    }

    return this.getFallbackMetrics();
  }

  /**
   * 2. GET /api/v1/dashboard/attention
   * Answers: "What requires attention?"
   * Retrieves high-priority operational items requiring immediate broker takeover or action
   */
  async getAttentionItems(): Promise<AttentionItem[]> {
    try {
      const res = await apiClient.get<AttentionItem[] | { data: AttentionItem[] }>(
        "/api/v1/dashboard/attention"
      );

      if (Array.isArray(res)) {
        return res;
      }
      if (res && typeof res === "object" && "data" in res && Array.isArray((res as { data: AttentionItem[] }).data)) {
        return (res as { data: AttentionItem[] }).data;
      }
    } catch (err) {
      console.warn("Dashboard attention API failed, using fallback:", (err as Error).message);
    }

    return this.getFallbackAttentionItems();
  }

  /**
   * 3. GET /api/v1/dashboard/feed
   * Answers: "What happened today?"
   * Chronological unified real-time operations activity feed
   */
  async getActivityFeed(): Promise<DashboardFeedItem[]> {
    try {
      const res = await apiClient.get<DashboardFeedItem[] | { data: DashboardFeedItem[] }>(
        "/api/v1/dashboard/feed"
      );

      if (Array.isArray(res)) {
        return res;
      }
      if (res && typeof res === "object" && "data" in res && Array.isArray((res as { data: DashboardFeedItem[] }).data)) {
        return (res as { data: DashboardFeedItem[] }).data;
      }
    } catch (err) {
      console.warn("Dashboard activity feed API failed, using fallback:", (err as Error).message);
    }

    return this.getFallbackFeed();
  }

  /**
   * 4. GET /api/v1/dashboard/funnel
   * Pipeline conversion stages & progression rates
   */
  async getPipelineFunnel(): Promise<PipelineFunnelStageItem[]> {
    try {
      const res = await apiClient.get<
        PipelineFunnelStageItem[] | { data: PipelineFunnelStageItem[] }
      >("/api/v1/dashboard/funnel");

      if (Array.isArray(res)) {
        return res;
      }
      if (
        res &&
        typeof res === "object" &&
        "data" in res &&
        Array.isArray((res as { data: PipelineFunnelStageItem[] }).data)
      ) {
        return (res as { data: PipelineFunnelStageItem[] }).data;
      }
    } catch (err) {
      console.warn("Dashboard funnel API failed, using fallback:", (err as Error).message);
    }

    return this.getFallbackFunnel();
  }

  // --- FALLBACK RESILIENCE FIXTURES ---

  private getFallbackMetrics(): DashboardMetrics {
    return {
      leads: { total: 0, today: 0, trend: "0.0% today", changePercent: 0 },
      calls: {
        total: 0,
        today: 0,
        avgDurationSeconds: 0,
        formattedAvgDuration: "0m 00s",
        outcomes: { viewing_booked: 0, qualified: 0, voicemail: 0, nurture: 0 },
      },
      qualified: {
        total: 0,
        today: 0,
        conversionRate: 0,
        formattedRate: "0.0%",
      },
      hot: { total: 0, unbookedCount: 0, urgentAttentionCount: 0 },
      viewings: {
        total: 0,
        today: 0,
        upcomingThisWeek: 0,
        confirmedCount: 0,
        completedCount: 0,
      },
      handoffs: {
        total: 0,
        today: 0,
        pendingActionCount: 0,
        aiStoppedCount: 0,
      },
      followUps: {
        total: 0,
        today: 0,
        scheduledToday: 0,
        pendingCount: 0,
        completedCount: 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private getFallbackAttentionItems(): AttentionItem[] {
    return [];
  }

  private getFallbackFeed(): DashboardFeedItem[] {
    return [];
  }

  private getFallbackFunnel(): PipelineFunnelStageItem[] {
    return [
      { id: "stage_inbound", label: "Inbound Inquiries", count: 0, conversionRate: 0, color: "#38bdf8" },
      { id: "stage_contacted", label: "AI First Contact", count: 0, conversionRate: 0, color: "#fbbf24" },
      { id: "stage_qualified", label: "Qualified Intent", count: 0, conversionRate: 0, color: "#10b981" },
      { id: "stage_viewing", label: "Booked Viewings", count: 0, conversionRate: 0, color: "#6366f1" },
      { id: "stage_closing", label: "Closer Underwriting", count: 0, conversionRate: 0, color: "#0d4a36" },
    ];
  }
}

export const dashboardService = new DashboardService();
