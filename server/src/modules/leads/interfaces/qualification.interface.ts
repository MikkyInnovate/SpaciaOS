import * as schema from "../../../database/schema";

export type BuyerIntentCategory = (typeof schema.buyerIntentCategoryEnum.enumValues)[number];
export type DecisionReadinessStage = (typeof schema.decisionReadinessStageEnum.enumValues)[number];
export type LeadScoreCategory = (typeof schema.leadScoreCategoryEnum.enumValues)[number];

export interface ScoreFactor {
  label: string;
  impact: number;
  category: "budget" | "authority" | "need" | "timeline" | "property_fit" | "objection";
  detail?: string;
}

export interface BantBreakdown {
  budgetScore: number; // 0 - 25
  budgetNote: string;
  authorityScore: number; // 0 - 15
  authorityNote: string;
  needScore: number; // 0 - 25
  needNote: string;
  timelineScore: number; // 0 - 20
  timelineNote: string;
  propertyFitScore: number; // 0 - 15
  propertyFitNote: string;
}

export interface NextActionDirective {
  action: string;
  assignedTo: string;
  priority: "Immediate" | "Scheduled" | "Routine";
  dueDate?: string;
  protocolRecommendation?: string;
}

export interface LeadIntentProfile {
  buyerIntent: BuyerIntentCategory;
  decisionReadiness: DecisionReadinessStage;
  intentSignals: string[];
  targetTransaction: "Purchase" | "Rental" | "Investment";
}

export interface AiConfidenceProfile {
  confidenceScore: number; // 0 - 100
  confidenceGrade: "high" | "moderate" | "provisional";
  signalsCount: number;
  reasoning: string;
}

export interface ExtractedSignals {
  declaredBudget?: string;
  numericBudget?: number;
  budgetConfidence: "explicit" | "inferred" | "none";
  buyerIntent: BuyerIntentCategory;
  intentConfidence: "explicit" | "inferred" | "none";
  decisionReadiness: DecisionReadinessStage;
  readinessConfidence: "explicit" | "inferred" | "none";
  timelineWindow: string;
  timelineUrgency: "urgent" | "near_term" | "flexible";
  timelineConfidence: "explicit" | "inferred" | "none";
  targetTransaction: "Purchase" | "Rental" | "Investment";
  propertyType?: string;
  bedrooms?: number;
  location?: string;
  viewingRequested: boolean;
  specificPropertyId?: string;
  specificPropertyTitle?: string;
  hasSpecificPropertyFocus: boolean;
  availabilityChecked: boolean;
  priceChecked: boolean;
  policyChecked: boolean;
  objections: Array<{
    title: string;
    severity: "high" | "medium" | "low";
    detail?: string;
  }>;
  intentSignals: string[];
}

export interface DeterministicQualificationResult {
  score: number; // 0 - 100
  scoreCategory: LeadScoreCategory;
  leadIntent: LeadIntentProfile;
  aiConfidence: AiConfidenceProfile;
  budgetAnalysis: {
    declared?: string;
    verifiedLiquidity?: string;
    paymentStructure: "Outright" | "Milestone Plan" | "Mortgage";
    stretchCategory: "Within Budget" | "Moderate Stretch" | "High Stretch" | "Sub-Budget";
  };
  timeline: {
    window: string;
    urgency: "urgent" | "near_term" | "flexible";
  };
  objections: Array<{
    title: string;
    severity: "high" | "medium" | "low";
    detail?: string;
  }>;
  bantBreakdown: BantBreakdown;
  factors: {
    positiveFactors: ScoreFactor[];
    riskFactors: ScoreFactor[];
  };
  recommendedNextAction: {
    summary: string;
    directive: NextActionDirective;
  };
}
