import { Injectable, Inject, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";

export interface ExtractedQualification {
  buyerIntent: (typeof schema.buyerIntentCategoryEnum.enumValues)[number];
  decisionReadiness: (typeof schema.decisionReadinessStageEnum.enumValues)[number];
  confidenceScore: number;
  budgetDeclared?: string;
  timelineWindow?: string;
  motivation?: string;
  objections: string[];
  intentSignals: string[];
}

@Injectable()
export class StructuredExtractionService {
  private readonly logger = new Logger(StructuredExtractionService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb
  ) {}

  /**
   * Fast, reliable structured extraction over dialogue signals.
   * Avoids spawning a slow, redundant secondary LLM call per turn.
   */
  async extractAndPersist(
    workspaceId: string,
    leadId: string | undefined,
    conversationHistory: Array<{ role: string; content: string | null }>,
    callId?: string
  ): Promise<ExtractedQualification> {
    const userTexts = conversationHistory
      .filter((m) => m.role === "user" && m.content)
      .map((m) => m.content!.toLowerCase())
      .join(" ");

    // 1. Buyer Intent Detection
    let buyerIntent: ExtractedQualification["buyerIntent"] = "exploratory";
    const intentSignals: string[] = [];

    if (userTexts.includes("invest") || userTexts.includes("yield") || userTexts.includes("roi") || userTexts.includes("rental income")) {
      buyerIntent = "investment_yield_seeking";
      intentSignals.push("Yield & ROI orientation");
    } else if (userTexts.includes("relocat") || userTexts.includes("moving") || userTexts.includes("family")) {
      buyerIntent = "luxury_relocation";
      intentSignals.push("Family luxury relocation");
    } else if (
      userTexts.includes("buy") ||
      userTexts.includes("purchase") ||
      userTexts.includes("outright") ||
      userTexts.includes("inspect") ||
      userTexts.includes("tour") ||
      userTexts.includes("viewing")
    ) {
      buyerIntent = "high_purchase_intent";
      intentSignals.push("Active purchase / tour inquiry");
    }

    // 2. Decision Readiness
    let decisionReadiness: ExtractedQualification["decisionReadiness"] = "exploratory";
    if (userTexts.includes("ready to buy") || userTexts.includes("inspect this week") || userTexts.includes("outright cash") || userTexts.includes("close")) {
      decisionReadiness = "immediate_close";
    } else if (userTexts.includes("shortlist") || userTexts.includes("comparing") || userTexts.includes("options")) {
      decisionReadiness = "evaluating_shortlist";
    } else if (userTexts.includes("wife") || userTexts.includes("husband") || userTexts.includes("partner") || userTexts.includes("board")) {
      decisionReadiness = "spousal_board_review";
    }

    // 3. Budget Detection (e.g. 85m, ₦100,000,000, 50-100 million)
    let budgetDeclared: string | undefined;
    const budgetMatch = userTexts.match(/(?:₦|n|ngn|\$)?\s*(\d{1,3}(?:[,\.]\d{3})*(?:\s*m|\s*million|\s*b)?|\d+\s*m)/i);
    if (budgetMatch) {
      budgetDeclared = budgetMatch[0].trim();
      intentSignals.push(`Declared budget parameter: ${budgetDeclared}`);
    }

    // 4. Timeline Detection
    let timelineWindow = "3-6 months";
    if (userTexts.includes("immediately") || userTexts.includes("this month") || userTexts.includes("asap") || userTexts.includes("urgent")) {
      timelineWindow = "Immediate (0-30 days)";
      intentSignals.push("Urgent acquisition timeline");
    } else if (userTexts.includes("this quarter") || userTexts.includes("few months") || userTexts.includes("soon")) {
      timelineWindow = "1-3 months";
    }

    // 5. Objection Detection
    const objections: string[] = [];
    if (userTexts.includes("expensive") || userTexts.includes("too high") || userTexts.includes("costly")) {
      objections.push("Price sensitivity");
    }
    if (userTexts.includes("traffic") || userTexts.includes("flood") || userTexts.includes("noise")) {
      objections.push("Location / infrastructure concern");
    }
    if (userTexts.includes("title") || userTexts.includes("c of o") || userTexts.includes("governor")) {
      objections.push("Title deed / legal verification inquiry");
    }

    // 6. Confidence Score
    let confidenceScore = 50;
    if (buyerIntent !== "exploratory") confidenceScore += 20;
    if (budgetDeclared) confidenceScore += 15;
    if (decisionReadiness === "immediate_close") confidenceScore += 15;
    confidenceScore = Math.min(95, Math.max(30, confidenceScore));

    const result: ExtractedQualification = {
      buyerIntent,
      decisionReadiness,
      confidenceScore,
      budgetDeclared,
      timelineWindow,
      motivation: intentSignals.join("; ") || "General luxury property inquiry",
      objections,
      intentSignals,
    };

    // Persist to Neon PostgreSQL qualification_results table if leadId exists
    if (leadId) {
      try {
        await this.db.insert(schema.qualificationResults).values({
          workspaceId,
          leadId,
          callId: callId || undefined,
          confidenceScore: result.confidenceScore,
          buyerIntent: result.buyerIntent,
          decisionReadiness: result.decisionReadiness,
          motivation: result.motivation,
          timelineWindow: result.timelineWindow,
          budgetDeclared: result.budgetDeclared || undefined,
          objections: result.objections,
          intentSignals: result.intentSignals,
        });

        // Also update lead score if lead exists
        await this.db
          .update(schema.leads)
          .set({
            score: result.confidenceScore,
            scoreCategory: result.confidenceScore >= 80 ? "HOT" : result.confidenceScore >= 60 ? "WARM" : "COLD",
            updatedAt: new Date(),
          })
          .where(eq(schema.leads.id, leadId));
      } catch (err: any) {
        this.logger.warn(`Could not persist qualification_results for lead [${leadId}]: ${err.message}`);
      }
    }

    return result;
  }
}
