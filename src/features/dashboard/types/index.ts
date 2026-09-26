export type LeadScoreCategory = "HOT" | "WARM" | "COLD";

export type LeadStatus =
  | "New"
  | "Contacting"
  | "In Conversation"
  | "Qualified"
  | "Follow-up"
  | "Viewing Booked"
  | "Human Managed";

export interface DashboardLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyTitle: string;
  location: string;
  budget: string;
  score: number;
  scoreCategory: LeadScoreCategory;
  status: LeadStatus;
  intent: "Purchase" | "Rental" | "Investment";
  timeline: string;
  nextAction: string;
  createdAt: string;
  aiNotes?: string;
}

export interface DashboardViewing {
  id: string;
  prospectName: string;
  propertyTitle: string;
  agentName: string;
  date: string;
  time: string;
  status: "Confirmed" | "Scheduled" | "Pending";
  leadScore: number;
}

export interface CallTranscriptMessage {
  speaker: "agent" | "prospect";
  speakerName: string;
  time: string;
  message: string;
}

export interface DashboardAICallEvent {
  id: string;
  leadName: string;
  propertyTitle: string;
  location?: string;
  budget?: string;
  phone?: string;
  email?: string;
  score?: number;
  scoreCategory?: LeadScoreCategory;
  duration: string;
  outcome: "Qualified" | "In Conversation" | "Viewing Requested" | "Voicemail" | "Contacting" | "Follow-up";
  summary: string;
  timestamp: string;
  isEscalated?: boolean;
  transcript?: CallTranscriptMessage[];
}

export interface DashboardFunnelStage {
  label: string;
  count: number;
  percentage: number;
  highlight?: boolean;
}

// Day 20 — Command Center Aggregate Metrics Types
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

export interface PipelineFunnelStageItem {
  id: string;
  label: string;
  count: number;
  conversionRate: number;
  color?: string;
}

