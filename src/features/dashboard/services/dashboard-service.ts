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
      leads: { total: 142, today: 18, trend: "+18.4% today", changePercent: 18.4 },
      calls: {
        total: 89,
        today: 14,
        avgDurationSeconds: 222,
        formattedAvgDuration: "3m 42s",
        outcomes: { viewing_booked: 24, qualified: 38, voicemail: 15, nurture: 12 },
      },
      qualified: {
        total: 54,
        today: 9,
        conversionRate: 38.0,
        formattedRate: "38.0%",
      },
      hot: { total: 12, unbookedCount: 4, urgentAttentionCount: 4 },
      viewings: {
        total: 31,
        today: 5,
        upcomingThisWeek: 12,
        confirmedCount: 18,
        completedCount: 9,
      },
      handoffs: {
        total: 7,
        today: 2,
        pendingActionCount: 3,
        aiStoppedCount: 2,
      },
      followUps: {
        total: 26,
        today: 8,
        scheduledToday: 8,
        pendingCount: 14,
        completedCount: 12,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private getFallbackAttentionItems(): AttentionItem[] {
    const now = new Date();
    return [
      {
        id: "attn_01",
        category: "urgent_handoff",
        severity: "critical",
        title: "Human Takeover: Senator Okonjo",
        description: "Prospect requested immediate senior partner call regarding title documentation for Bourdillon Sky Penthouse.",
        leadId: "lead_okonjo",
        leadName: "Senator Okonjo",
        leadPhone: "+2348039876543",
        propertyTitle: "Bourdillon Sky Penthouse",
        actionUrl: "/leads",
        actionLabel: "Open Lead Dossier",
        timestamp: new Date(now.getTime() - 18 * 60000).toISOString(),
      },
      {
        id: "attn_02",
        category: "hot_unbooked",
        severity: "high",
        title: "High-Liquidity Prospect: Chief Adeleke (Score: 92/100)",
        description: "₦1,200,000,000 budget verified. BANT qualified without a scheduled property walkthrough.",
        leadId: "lead_adeleke",
        leadName: "Chief Adeleke",
        leadPhone: "+2348023456789",
        propertyTitle: "The Grand Waterfront Villa",
        actionUrl: "/appointments",
        actionLabel: "Schedule Inspection",
        timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
      },
      {
        id: "attn_03",
        category: "viewing_today",
        severity: "high",
        title: "Inspection Today at 2:00 PM: The Grand Waterfront Villa",
        description: "Banana Island Zone A. Gate clearance pass active. Closer on-site: Ade Admin.",
        propertyTitle: "The Grand Waterfront Villa",
        actionUrl: "/appointments",
        actionLabel: "View Appointment",
        timestamp: new Date(now.getTime() + 120 * 60000).toISOString(),
      },
      {
        id: "attn_04",
        category: "overdue_followup",
        severity: "medium",
        title: "Deed Follow-up Due: Alhaji Danjuma",
        description: "Pre-contract due diligence follow-up promised within 24 hours.",
        leadId: "lead_danjuma",
        leadName: "Alhaji Danjuma",
        actionUrl: "/leads",
        actionLabel: "Complete Follow-up",
        timestamp: new Date(now.getTime() - 180 * 60000).toISOString(),
      },
    ];
  }

  private getFallbackFeed(): DashboardFeedItem[] {
    const now = Date.now();
    return [
      {
        id: "feed_01",
        type: "viewing_booked",
        title: "Inspection Booked: Alhaji Danjuma",
        description: "Confirmed VIP Walkthrough for The Grand Waterfront Villa, Banana Island.",
        badge: "CALENDAR",
        propertyTitle: "The Grand Waterfront Villa",
        leadName: "Alhaji Danjuma",
        timestamp: new Date(now - 14 * 60000).toISOString(),
      },
      {
        id: "feed_02",
        type: "call_completed",
        title: "Vapi Voice Call Completed: Chief Adeleke",
        description: "Inbound voice session. BANT scored 92/100 (HOT). Outright purchase liquidity verified.",
        badge: "VOICE",
        leadName: "Chief Adeleke",
        timestamp: new Date(now - 38 * 60000).toISOString(),
      },
      {
        id: "feed_03",
        type: "notification_sent",
        title: "Resend Viewing Confirmation Dispatched",
        description: "Viewing details with Google Calendar invite dispatched to prospect & listing broker.",
        badge: "RESEND",
        timestamp: new Date(now - 65 * 60000).toISOString(),
      },
      {
        id: "feed_04",
        type: "human_takeover",
        title: "Human Takeover Triggered",
        description: "AI communication stopped for Senator Okonjo upon request for title consultation.",
        badge: "HANDOFF",
        leadName: "Senator Okonjo",
        timestamp: new Date(now - 110 * 60000).toISOString(),
      },
      {
        id: "feed_05",
        type: "lead_captured",
        title: "Inbound Lead Captured",
        description: "Sarah Jenkins submitted interest for Bourdillon Sky Penthouse via web portal.",
        badge: "WEBSITE",
        leadName: "Sarah Jenkins",
        timestamp: new Date(now - 165 * 60000).toISOString(),
      },
    ];
  }

  private getFallbackFunnel(): PipelineFunnelStageItem[] {
    return [
      { id: "stage_inbound", label: "Inbound Inquiries", count: 142, conversionRate: 100, color: "#38bdf8" },
      { id: "stage_contacted", label: "AI First Contact", count: 118, conversionRate: 83, color: "#fbbf24" },
      { id: "stage_qualified", label: "Qualified Intent", count: 48, conversionRate: 34, color: "#10b981" },
      { id: "stage_viewing", label: "Booked Viewings", count: 19, conversionRate: 13, color: "#6366f1" },
      { id: "stage_closing", label: "Closer Underwriting", count: 8, conversionRate: 6, color: "#0d4a36" },
    ];
  }
}

export const dashboardService = new DashboardService();
