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

export interface RevenuePathNode {
  step: number;
  key: string;
  label: string;
  description: string;
  category: "ingestion" | "qualification" | "voice" | "scheduling" | "closing";
  status: "operational" | "active" | "standby";
  verifiedMilestone: string;
  eventsRecorded: number;
}

export interface RevenuePathResponse {
  operationalNodes: number;
  totalNodes: number;
  readinessPercentage: number;
  nodes: RevenuePathNode[];
}

export interface AnalyticsOverviewMetrics {
  grossInbound: {
    value: string;
    numericValue: number;
    trend: string;
    subtext: string;
    isPositive: boolean;
  };
  qualificationRate: {
    value: string;
    percentage: number;
    trend: string;
    subtext: string;
    isPositive: boolean;
  };
  bookedViewings: {
    value: string;
    numericValue: number;
    trend: string;
    subtext: string;
    isPositive: boolean;
  };
  pipelinePotential: {
    value: string;
    rawNaira: number;
    trend: string;
    subtext: string;
    isPositive: boolean;
  };
  speedToLead: {
    value: string;
    subtext: string;
  };
  autonomousResolutionRate: {
    value: string;
    subtext: string;
  };
}
