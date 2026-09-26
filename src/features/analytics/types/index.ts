export interface FunnelStage {
  stage: string;
  label: string;
  description: string;
  count: number;
  percentageOfTop: number;
  stepConversionRate: number;
  dropOffCount: number;
  dropOffRate: number;
}

export interface AnalyticsFunnelResponse {
  stages: FunnelStage[];
  totalLeads: number;
  wonCount: number;
  overallConversionRate: number;
}

export type RevenuePathCategory =
  | "ingestion"
  | "qualification"
  | "voice"
  | "scheduling"
  | "closing";

export type RevenuePathStatus = "operational" | "active" | "standby";

export interface RevenuePathNode {
  step: number;
  key: string;
  label: string;
  description: string;
  category: RevenuePathCategory;
  status: RevenuePathStatus;
  verifiedMilestone: string;
  eventsRecorded: number;
}

export interface RevenuePathResponse {
  operationalNodes: number;
  totalNodes: number;
  readinessPercentage: number;
  nodes: RevenuePathNode[];
}

export interface MetricItem {
  value: string;
  numericValue?: number;
  percentage?: number;
  rawNaira?: number;
  trend?: string;
  subtext: string;
  isPositive?: boolean;
}

export interface AnalyticsOverviewMetrics {
  grossInbound: MetricItem;
  qualificationRate: MetricItem;
  bookedViewings: MetricItem;
  pipelinePotential: MetricItem;
  speedToLead: {
    value: string;
    subtext: string;
  };
  autonomousResolutionRate: {
    value: string;
    subtext: string;
  };
}

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "mtd" | "all";

export interface QueryAnalyticsParams {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
}
