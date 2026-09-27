export interface OpsOverview {
  totalWorkspaces: number;
  totalLeads: number;
  activeWorkflows: number;
  failedWorkflows: number;
  totalCalls: number;
  totalAppointments: number;
  totalErrors: number;
  integrationsHealth: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    total: number;
  };
  aiDialerPaused: boolean;
  systemStatus: "operational" | "degraded" | "critical";
  lastUpdated: string;
}

export interface OpsWorkspaceItem {
  id: string;
  name: string;
  slug: string;
  tier: string;
  primaryMarket?: string | null;
  memberCount: number;
  leadCount: number;
  callCount: number;
  aiStatus: "active" | "paused";
  createdAt: string;
}

export interface OpsLeadItem {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  fullName: string;
  email?: string | null;
  phone: string;
  status: string;
  score?: number | null;
  budget?: number | null;
  currency?: string | null;
  createdAt: string;
}

export interface OpsWorkflowItem {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  eventName: string;
  aggregateType: string;
  aggregateId: string;
  status: "emitted" | "processing" | "completed" | "failed";
  payload: Record<string, any>;
  createdAt: string;
  lastError?: string;
}

export interface OpsCallItem {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  leadName: string;
  leadPhone: string;
  outcome?: string | null;
  durationSeconds: number;
  isEscalated: boolean;
  callScore?: number | null;
  recordingUrl?: string | null;
  createdAt: string;
}

export interface OpsAppointmentItem {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  leadName?: string;
  propertyName?: string;
  title: string;
  type: string;
  status: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  meetingUrl?: string | null;
  location: string;
  createdAt: string;
}

export interface OpsErrorItem {
  id: string;
  workspaceId: string;
  source: "workflow" | "integration" | "call" | "system";
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  errorDetails?: any;
  retryable: boolean;
  entityId?: string;
  createdAt: string;
}

export interface OpsIntegrationItem {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  type: string;
  name: string;
  category: string;
  status: string;
  healthStatus: "healthy" | "degraded" | "unhealthy" | "untested";
  latencyMs?: number | null;
  failureCount: number;
  lastTestedAt?: string | null;
  lastError?: string | null;
}

export interface OpsAuditItem {
  id: string;
  workspaceId: string;
  actorId: string;
  actorType: string;
  action: string;
  resource: string;
  severity: "info" | "warning" | "critical";
  metadata?: any;
  ipAddress?: string | null;
  createdAt: string;
}
