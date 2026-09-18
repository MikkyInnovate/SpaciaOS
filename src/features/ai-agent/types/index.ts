/**
 * DAY 9 — AI Sales Agent Interface
 * Strongly-typed domain models for agent engine status, telemetry,
 * voice persona configuration, BANT qualification gates, buyer intent,
 * and real-time execution activities.
 */

export type AIAgentEngineStatus =
  | "online"
  | "active_call"
  | "idle"
  | "calibrating"
  | "paused"
  | "offline";

export type BuyerIntentCategory =
  | "high_purchase_intent"
  | "investment_yield_seeking"
  | "luxury_relocation"
  | "exploratory"
  | "unqualified";

export interface AIAgentStatusTelemetry {
  status: AIAgentEngineStatus;
  statusLabel: string;
  uptime: string;
  activeLines: number;
  maxConcurrency: number;
  averageLatencyMs: number;
  callsHandledToday: number;
  qualificationRate: number;
  bookedAppointmentsToday: number;
  lastTrainedAt: string;
  isOutboundPaused: boolean;
  engineStatus?: "active" | "paused" | "offline";
}

export interface AIAgentVoicePersona {
  name: string;
  identityTitle: string;
  voiceModel: string;
  accent: string;
  greeting: string;
  temperature: number; // 0.0 - 1.0
  interruptionToleranceMs: number;
  speechSpeed: number; // e.g. 1.0x
  truthPolicy: "strict_verified_only" | "flexible";
}

export interface AIAgentQualificationGates {
  minimumBudgetNaira: number;
  formattedMinimumBudget: string;
  targetTimelineDays: number;
  requiredTitleDeeds: string[];
  immediateEscalationKeywords: string[];
}

export interface AIAgentGuardrails {
  maxOutboundAttempts: number;
  quietHoursStart: string; // e.g. "20:00"
  quietHoursEnd: string;   // e.g. "08:00"
  dncEnforced: boolean;
  autoHandoffOnNegotiation: boolean;
  autoDispatchBookings?: boolean;
}

export interface AIAgentConfiguration {
  persona: AIAgentVoicePersona;
  qualificationGates: AIAgentQualificationGates;
  guardrails: AIAgentGuardrails;
}

export interface IntentSignal {
  id: string;
  type: "budget" | "timeline" | "authority" | "property_fit" | "objection";
  text?: string;
  label?: string;
  strength: "high" | "medium" | "low";
  evidence?: string;
  extractedAt?: string;
}

export interface BuyerIntentEvaluation {
  id: string;
  leadId: string;
  leadName: string;
  category: BuyerIntentCategory;
  categoryLabel?: string;
  intentCategory?: BuyerIntentCategory;
  confidenceScore: number; // 0 - 100
  summary: string;
  signals?: IntentSignal[];
  intentSignals: IntentSignal[];
  recommendedAction: string;
  nextRecommendedAction?: string;
  evaluatedAt: string;
  scheduledEvent?: {
    type: "inspection" | "followup_call" | "virtual_tour";
    title: string;
    scheduledTime: string;
    calendarSynced: boolean;
    assignedBroker?: string;
  };
  humanActionStage?: "inspection_scheduled" | "awaiting_closing_payment" | "nurture_followup";
}

export interface ActiveCallTelemetry {
  callId: string;
  lineNumber?: number;
  leadId: string;
  leadName: string;
  leadPhone: string;
  propertyTitle: string;
  score?: number;
  budget?: string;
  executiveSummary?: string;
  durationSeconds: number;
  currentStep:
    | "greeting"
    | "listening"
    | "synthesizing_speech"
    | "evaluating_bant"
    | "booking_calendar"
    | "wrapping_up";
  waveformLevels: number[]; // Simulated audio amplitudes [0.2, 0.8, 0.5, ...]
  liveTranscript: Array<{
    speaker: "ai" | "prospect";
    text: string;
    timestamp: string;
  }>;
}

export interface AIAgentRecentActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "call_completed" | "viewing_booked" | "hot_qualified" | "handoff_escalated" | "dropped_retry";
  outcomeTag: string;
  leadName: string;
  propertyTitle?: string;
}
