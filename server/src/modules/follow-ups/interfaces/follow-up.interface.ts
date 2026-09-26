export type LeadCommunicationState =
  | "AI_ACTIVE"
  | "HUMAN_HANDOFF"
  | "HUMAN_MANAGED";

export type HandoffTriggerCategory =
  | "negotiation"
  | "objection"
  | "high_value"
  | "manual_broker"
  | "prospect_request"
  | "max_attempts";

export interface HandoffRecommendedAction {
  title: string;
  directive: string;
  priority: "immediate" | "scheduled" | "routine";
  suggestedChannel: "call" | "whatsapp" | "email" | "in_person";
  actionProtocol: string;
  dueTimeFormatted?: string;
}

export interface HandoffContext {
  triggerReason: string;
  triggerCategory: HandoffTriggerCategory;
  synthesis: string;
  keyQuotes: string[];
  unresolvedObjections: string[];
  handedOffAt: string;
  brokerName?: string;
  recommendedAction?: HandoffRecommendedAction;
}

export type StopConditionReason =
  | "HUMAN_TAKEOVER"
  | "AI_STOPPED"
  | "MAX_ATTEMPTS_REACHED"
  | "VIEWING_BOOKED"
  | "TERMINAL_DISPOSITION"
  | "INVALID_LEAD";

export interface FollowUpExecutionResult {
  success: boolean;
  followUpId: string;
  leadId: string;
  status: "completed" | "cancelled" | "aborted" | "rescheduled";
  communicationState: LeadCommunicationState;
  stopConditionTriggered?: StopConditionReason;
  handoffTriggered?: boolean;
  attemptCount: number;
  message?: string;
}
