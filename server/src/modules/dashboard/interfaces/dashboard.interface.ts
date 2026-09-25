export interface MetricSummary {
  total: number;
  today: number;
  trend?: string;
  changePercent?: number;
}

export interface CallsMetricSummary extends MetricSummary {
  avgDurationSeconds: number;
  formattedAvgDuration: string;
  outcomes: Record<string, number>;
}

export interface QualifiedMetricSummary extends MetricSummary {
  conversionRate: number;
  formattedRate: string;
}

export interface HotMetricSummary {
  total: number;
  unbookedCount: number;
  urgentAttentionCount: number;
}

export interface ViewingsMetricSummary extends MetricSummary {
  upcomingThisWeek: number;
  confirmedCount: number;
  completedCount: number;
}

export interface HandoffsMetricSummary extends MetricSummary {
  pendingActionCount: number;
  aiStoppedCount: number;
}

export interface FollowUpsMetricSummary extends MetricSummary {
  scheduledToday: number;
  pendingCount: number;
  completedCount: number;
}

export interface DashboardMetrics {
  leads: MetricSummary;
  calls: CallsMetricSummary;
  qualified: QualifiedMetricSummary;
  hot: HotMetricSummary;
  viewings: ViewingsMetricSummary;
  handoffs: HandoffsMetricSummary;
  followUps: FollowUpsMetricSummary;
  lastUpdated: string;
}

export type AttentionCategory =
  | "urgent_handoff"
  | "hot_unbooked"
  | "viewing_today"
  | "overdue_followup";

export interface AttentionItem {
  id: string;
  category: AttentionCategory;
  severity: "critical" | "high" | "medium";
  title: string;
  description: string;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  propertyId?: string;
  propertyTitle?: string;
  actionUrl: string;
  actionLabel: string;
  timestamp: string;
}

export interface DashboardFeedItem {
  id: string;
  type:
    | "lead_captured"
    | "lead_qualified"
    | "call_completed"
    | "viewing_booked"
    | "human_takeover"
    | "notification_sent"
    | "followup_scheduled";
  title: string;
  description: string;
  leadId?: string;
  leadName?: string;
  propertyTitle?: string;
  actor?: string;
  badge?: string;
  timestamp: string;
}

export interface PipelineFunnelStage {
  id: string;
  label: string;
  count: number;
  conversionRate: number;
  color?: string;
}
