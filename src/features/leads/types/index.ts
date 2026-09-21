import type { Property } from "@/features/properties";
import type { BuyerIntentCategory, IntentSignal } from "@/features/ai-agent";

export type LeadScoreCategory = "HOT" | "WARM" | "COLD";

export type LeadStatus =
  | "New"
  | "Contacting"
  | "In Conversation"
  | "Qualified"
  | "Follow-up"
  | "Viewing Booked"
  | "Human Managed"
  | "Nurture"
  | "Lost";

export interface PropertyDetails {
  propertyTitle: string;
  location: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  targetPrice: string;
  budgetMatch: "Within Budget" | "Budget Stretch" | "Sub-Budget";
  developmentStage?: string;
  estateName?: string;
  featuredImage?: string;
  images?: string[];
}

export interface BantBreakdown {
  budgetScore: number;
  budgetNote: string;
  authorityScore: number;
  authorityNote: string;
  needScore: number;
  needNote: string;
  timelineScore: number;
  timelineNote: string;
  propertyFitScore: number;
  propertyFitNote: string;
}

/**
 * DAY 11 — Qualification Domain Models
 */

export type DecisionReadinessStage =
  | "immediate_close"
  | "evaluating_shortlist"
  | "spousal_board_review"
  | "asset_liquidation"
  | "exploratory";

export interface ObjectionItem {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  status: "open" | "resolved";
  resolutionNote?: string;
  resolvedAt?: string;
}

export interface ScoreFactor {
  label: string;
  impact: number; // positive (+15) or negative (-10)
  category: "liquidity" | "timeline" | "authority" | "property_fit" | "objection";
  detail?: string;
}

export interface BudgetAnalysis {
  declared: string;
  verifiedLiquidity?: string;
  paymentStructure: "Outright" | "Milestone Plan" | "Mortgage";
  targetAskingPrice?: string;
  budgetStretchPercentage: number;
  stretchCategory: "Within Budget" | "Moderate Stretch" | "High Stretch" | "Sub-Budget";
}

export interface QualificationProfile {
  confidenceScore: number; // 0 - 100
  buyerIntent: BuyerIntentCategory;
  intentSignals: IntentSignal[];
  motivation: string;
  decisionReadiness: DecisionReadinessStage;
  readinessNote: string;
  timelineWindow: string; // e.g. "< 30 days"
  timelineUrgency: "urgent" | "near_term" | "flexible";
  targetClosingDate?: string;
  budgetAnalysis: BudgetAnalysis;
  objections: ObjectionItem[];
  explainableBreakdown: {
    baseScore: number;
    positiveFactors: ScoreFactor[];
    riskFactors: ScoreFactor[];
  };
}

import type {
  WorkflowExecutionStatus,
  WorkflowActor,
  RetryPolicy,
  FailureDiagnostic,
} from "@/features/events";

export type ActivityType =
  | "inbound_capture"
  | "ai_voice_call"
  | "whatsapp_message"
  | "viewing_scheduled"
  | "human_note"
  | "status_change";

export interface LeadActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  channel?: string;
  status?: WorkflowExecutionStatus;
  actor?: WorkflowActor;
  retry?: RetryPolicy;
  failure?: FailureDiagnostic;
  meta?: {
    duration?: string;
    outcome?: string;
    brokerName?: string;
    viewingDate?: string;
    imageUrl?: string;
    imageCaption?: string;
    transcriptSnippet?: string;
  };
}

export interface NextActionDirective {
  action: string;
  assignedTo: string;
  priority: "Immediate" | "Scheduled" | "Routine";
  dueDate?: string;
  protocolRecommendation?: string;
}

/**
 * DAY 13 — Human-in-the-Loop & Autonomous Supervision Models
 */

export type ManagementMode =
  | "ai_autonomous"
  | "human_managed"
  | "nurture"
  | "lost";

export type HandoffTriggerCategory =
  | "negotiation"
  | "objection"
  | "high_value"
  | "manual_broker"
  | "prospect_request";

export interface HandoffContext {
  triggerReason: string;
  triggerCategory: HandoffTriggerCategory;
  synthesis: string;
  keyQuotes: string[];
  unresolvedObjections: string[];
  handedOffAt: string;
  brokerName?: string;
}

export interface RecommendedAction {
  title: string;
  directive: string;
  priority: "Immediate" | "Scheduled" | "Routine";
  suggestedChannel: "call" | "whatsapp" | "email" | "in_person";
  actionProtocol: string;
  dueTimeFormatted?: string;
}

export interface FollowUpSchedule {
  scheduledAt: string;
  scheduledFormatted: string;
  relativeCountdown: string;
  channel: "call" | "whatsapp" | "email";
  cadence: "once" | "daily" | "weekly" | "biweekly" | "monthly";
  notes?: string;
}

export type LossReasonCategory =
  | "budget_mismatch"
  | "purchased_competitor"
  | "unresponsive"
  | "unrealistic_criteria"
  | "title_deed_dispute"
  | "other";

export interface LossDetails {
  reason: LossReasonCategory;
  reasonLabel: string;
  notes?: string;
  lostAt: string;
}

export interface Lead {
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
  source?: string;
  assignedBroker?: string;
  propertyId?: string;
  property?: Property;
  propertyDetails?: PropertyDetails;
  bantBreakdown?: BantBreakdown;
  qualificationProfile?: QualificationProfile;
  activities?: LeadActivity[];
  nextActionDirective?: NextActionDirective;

  // Day 13: Human-in-the-Loop Supervision Extensions
  managementMode?: ManagementMode;
  isAiStopped?: boolean;
  aiStoppedReason?: string;
  handoffContext?: HandoffContext;
  recommendedAction?: RecommendedAction;
  followUpSchedule?: FollowUpSchedule;
  lossDetails?: LossDetails;
}

export interface DuplicateMatch {
  leadId: string;
  leadName: string;
  phone: string;
  email: string;
  score: number;
  scoreCategory: LeadScoreCategory;
  status: LeadStatus;
  propertyTitle: string;
  matchType: "phone" | "email" | "both";
  relativeTime: string;
}

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  matches: DuplicateMatch[];
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  source: string;
  budget: string;
  propertyTitle: string;
  location?: string;
  intent?: "Purchase" | "Rental" | "Investment";
  timeline?: string;
  notes?: string;
  forceDuplicate?: boolean;
}

export interface AiToolExecutionStep {
  tool: string;
  input: string;
  output: string;
  durationMs: number;
  timestamp: string;
}

export interface LeadFilterParams {
  search?: string;
  scoreCategory?: LeadScoreCategory | "ALL";
  status?: LeadStatus | "ALL";
  managementMode?: ManagementMode | "ALL";
}

export interface LeadsApiResponse {
  leads: Lead[];
  total: number;
}

