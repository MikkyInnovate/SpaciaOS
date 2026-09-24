import { Injectable, Logger } from "@nestjs/common";
import * as schema from "../../../database/schema";
import { LeadScoringService } from "../../leads/services/lead-scoring.service";
import {
  BantBreakdown,
  NextActionDirective,
  ScoreFactor,
} from "../../leads/interfaces/qualification.interface";

export interface ExtractedQualification {
  buyerIntent: (typeof schema.buyerIntentCategoryEnum.enumValues)[number];
  decisionReadiness: (typeof schema.decisionReadinessStageEnum.enumValues)[number];
  confidenceScore: number;
  budgetDeclared?: string;
  timelineWindow?: string;
  motivation?: string;
  objections: string[];
  intentSignals: string[];
  // Day 11 enhanced explainable underwriting outputs
  underwritingScore?: number;
  scoreCategory?: (typeof schema.leadScoreCategoryEnum.enumValues)[number];
  factors?: {
    positiveFactors: ScoreFactor[];
    riskFactors: ScoreFactor[];
  };
  bantBreakdown?: BantBreakdown;
  recommendedNextAction?: {
    summary: string;
    directive: NextActionDirective;
  };
}

@Injectable()
export class StructuredExtractionService {
  private readonly logger = new Logger(StructuredExtractionService.name);

  constructor(private readonly leadScoringService: LeadScoringService) {}

  /**
   * Fast, reliable structured extraction and underwriting scoring over dialogue signals and executed Day 9 tools.
   */
  async extractAndPersist(
    workspaceId: string,
    leadId: string | undefined,
    conversationHistory: Array<{ role: string; content: string | null }>,
    callId?: string,
    executedTools: Array<{ toolName: string; parameters?: any; success?: boolean }> = []
  ): Promise<ExtractedQualification> {
    const result = await this.leadScoringService.evaluateAndPersist(
      workspaceId,
      leadId,
      conversationHistory,
      executedTools,
      callId
    );

    return {
      buyerIntent: result.leadIntent.buyerIntent,
      decisionReadiness: result.leadIntent.decisionReadiness,
      confidenceScore: result.aiConfidence.confidenceScore,
      budgetDeclared: result.budgetAnalysis.declared,
      timelineWindow: result.timeline.window,
      motivation: result.leadIntent.intentSignals.join("; ") || "General luxury property inquiry",
      objections: result.objections.map((o) => o.title),
      intentSignals: result.leadIntent.intentSignals,
      underwritingScore: result.score,
      scoreCategory: result.scoreCategory,
      factors: result.factors,
      bantBreakdown: result.bantBreakdown,
      recommendedNextAction: result.recommendedNextAction,
    };
  }
}
