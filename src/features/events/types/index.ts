/**
 * DAY 8 — Event System & Automation Foundation
 * Strongly-typed domain models for asynchronous workflows, sales activities,
 * AI and human actor attribution, failure diagnostics, and retry mechanics.
 */

export type WorkflowExecutionStatus =
  | "idle"
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "retrying"
  | "blocked"
  | "cancelled";

export type ActorType = "ai_agent" | "human_broker" | "system";

export type EventCategory =
  | "voice_call"
  | "whatsapp"
  | "calendar"
  | "underwriting"
  | "scoring"
  | "broker_note"
  | "status_transition"
  | "system_webhook"
  | "sms"
  | "email";

export interface AIActorDetails {
  type: "ai_agent";
  name: string;
  role: string;
  modelIdentifier: string; // e.g. "Spacia Neural Voice Core v2.4"
  latencyMs?: number;
  confidenceScore?: number; // 0-100
  isStreaming?: boolean;
}

export interface HumanActorDetails {
  type: "human_broker";
  name: string;
  role: string;
  avatarUrl?: string;
  territory?: string;
  verifiedBadge?: boolean;
  takeoverReason?: string;
}

export interface SystemActorDetails {
  type: "system";
  name: string;
  subsystem: string; // e.g. "Calendar Sync Engine", "Webhook Listener"
}

export type WorkflowActor = AIActorDetails | HumanActorDetails | SystemActorDetails;

export interface RetryPolicy {
  currentAttempt: number;
  maxRetries: number;
  nextRetryAt?: string;
  backoffSeconds?: number;
  isRetrying: boolean;
  canManuallyRetry?: boolean;
}

export interface FailureDiagnostic {
  errorCode: string; // e.g. "SIP_486_BUSY", "WHATSAPP_RATE_LIMIT", "CALENDAR_SLOT_COLLISION"
  errorMessage: string;
  technicalDetails?: string;
  recoverable: boolean;
  suggestedAction?: string;
  failedAt: string;
}

export interface ActivityPayloadDetails {
  duration?: string;
  transcriptSnippet?: string;
  audioUrl?: string;
  outcome?: string;
  deliveryStatus?: "sent" | "delivered" | "read" | "failed";
  viewingSlot?: string;
  propertyTitle?: string;
  scoreChange?: {
    previous: number;
    current: number;
    category: string;
  };
  attachments?: Array<{
    url: string;
    name: string;
    type: "image" | "document";
  }>;
  rawPayloadJson?: string;
}

export interface WorkflowActivityEvent {
  id: string;
  workflowId: string;
  entityId?: string; // e.g. leadId
  entityType?: "lead" | "call" | "appointment" | "property";
  title: string;
  description: string;
  category: EventCategory;
  status: WorkflowExecutionStatus;
  actor: WorkflowActor;
  timestamp: string;
  channel?: string; // e.g. "Voice Synthesizer", "WhatsApp Business", "Google Calendar"
  retry?: RetryPolicy;
  failure?: FailureDiagnostic;
  payload?: ActivityPayloadDetails;
}

export interface EventFilterParams {
  entityId?: string;
  actorType?: ActorType | "ALL";
  status?: WorkflowExecutionStatus | "ALL";
  category?: EventCategory | "ALL";
  search?: string;
}

export interface EventsApiResponse {
  events: WorkflowActivityEvent[];
  total: number;
}
