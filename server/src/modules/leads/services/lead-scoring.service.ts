import { Injectable, Inject, Logger } from "@nestjs/common";
import { eq, desc, and } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";
import {
  BantBreakdown,
  DeterministicQualificationResult,
  ExtractedSignals,
  NextActionDirective,
  ScoreFactor,
} from "../interfaces/qualification.interface";

@Injectable()
export class LeadScoringService {
  private readonly logger = new Logger(LeadScoringService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb
  ) {}

  /**
   * Main entrypoint: Extracts signals, calculates deterministic BANT score & factors,
   * generates recommended next action, and records qualification snapshot and append-only score history.
   */
  async evaluateAndPersist(
    workspaceId: string,
    leadId: string | undefined,
    conversationHistory: Array<{ role: string; content: string | null }>,
    executedTools: Array<{ toolName: string; parameters?: any; success?: boolean }> = [],
    callId?: string
  ): Promise<DeterministicQualificationResult> {
    // 1. Extract signals deterministically from dialogue + trusted Day 9 tool execution traces
    const signals = this.extractSignals(conversationHistory, executedTools);

    // 2. Separate AI Evidentiary Confidence from commercial underwriting
    const aiConfidence = this.calculateAiConfidence(signals);

    // 3. Compute deterministic 100-point BANT underwriting score
    const { totalScore, bantBreakdown, positiveFactors, riskFactors } =
      this.calculateBantScore(signals, executedTools);

    const scoreCategory: (typeof schema.leadScoreCategoryEnum.enumValues)[number] =
      totalScore >= 80 ? "HOT" : totalScore >= 60 ? "WARM" : "COLD";

    // 4. Deterministically generate prioritized next action directive
    const recommendedNextAction = this.generateNextAction(
      totalScore,
      scoreCategory,
      signals,
      executedTools
    );

    const result: DeterministicQualificationResult = {
      score: totalScore,
      scoreCategory,
      leadIntent: {
        buyerIntent: signals.buyerIntent,
        decisionReadiness: signals.decisionReadiness,
        intentSignals: signals.intentSignals,
        targetTransaction: signals.targetTransaction,
      },
      aiConfidence,
      budgetAnalysis: {
        declared: signals.declaredBudget,
        paymentStructure: "Outright",
        stretchCategory: "Within Budget",
      },
      timeline: {
        window: signals.timelineWindow,
        urgency: signals.timelineUrgency,
      },
      objections: signals.objections,
      bantBreakdown,
      factors: {
        positiveFactors,
        riskFactors,
      },
      recommendedNextAction,
    };

    // 5. Persist to Neon PostgreSQL if leadId is present
    if (leadId) {
      await this.persistEvaluation(workspaceId, leadId, result, callId);
    }

    return result;
  }

  /**
   * Deterministic signal extractor across conversation history and Day 9 tool execution traces.
   */
  extractSignals(
    conversationHistory: Array<{ role: string; content: string | null }>,
    executedTools: Array<{ toolName: string; parameters?: any; success?: boolean }> = []
  ): ExtractedSignals {
    const userTexts = conversationHistory
      .filter((m) => m.role === "user" && m.content)
      .map((m) => m.content!.toLowerCase())
      .join(" ");

    const intentSignals: string[] = [];

    // --- A. Budget Extraction ---
    let declaredBudget: string | undefined;
    let numericBudget: number | undefined;
    let budgetConfidence: "explicit" | "inferred" | "none" = "none";

    const budgetRegexes = [
      /(?:₦|ngn|\$)\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:m|million|b|billion)?|\d+(?:\.\d+)?\s*(?:m|million|b|billion)?)/i,
      /\b(\d+(?:\.\d+)?\s*(?:m|million|b|billion))\b/i,
      /\b(\d{1,3}(?:,\d{3}){2,})\b/,
      /\bbudget\s*(?:of|is)?\s*([₦\$]?\s*[\d,]+(?:\.\d+)?\s*(?:m|million|b|billion)?)/i,
    ];

    let budgetMatch: RegExpMatchArray | null = null;
    for (const rx of budgetRegexes) {
      budgetMatch = userTexts.match(rx);
      if (budgetMatch) break;
    }

    if (budgetMatch) {
      declaredBudget = budgetMatch[0].trim();
      budgetConfidence = "explicit";
      intentSignals.push(`Declared budget parameter: ${declaredBudget}`);

      // Parse numerical magnitude
      const clean = declaredBudget.replace(/[^0-9.mb]/gi, "").toLowerCase();
      if (clean.includes("b")) {
        numericBudget = parseFloat(clean.replace("b", "")) * 1_000_000_000;
      } else if (clean.includes("m")) {
        numericBudget = parseFloat(clean.replace("m", "")) * 1_000_000;
      } else {
        numericBudget = parseFloat(clean.replace(/,/g, ""));
      }
    }

    // --- B. Buyer Intent & Need ---
    let buyerIntent: ExtractedSignals["buyerIntent"] = "exploratory";
    let intentConfidence: "explicit" | "inferred" | "none" = "none";
    let targetTransaction: "Purchase" | "Rental" | "Investment" = "Purchase";

    if (
      userTexts.includes("invest") ||
      userTexts.includes("yield") ||
      userTexts.includes("roi") ||
      userTexts.includes("rental income")
    ) {
      buyerIntent = "investment_yield_seeking";
      targetTransaction = "Investment";
      intentConfidence = "explicit";
      intentSignals.push("Yield & ROI orientation");
    } else if (
      userTexts.includes("relocat") ||
      userTexts.includes("moving") ||
      userTexts.includes("family")
    ) {
      buyerIntent = "luxury_relocation";
      targetTransaction = "Purchase";
      intentConfidence = "explicit";
      intentSignals.push("Family luxury relocation");
    } else if (
      userTexts.includes("buy") ||
      userTexts.includes("purchase") ||
      userTexts.includes("outright") ||
      userTexts.includes("acquire")
    ) {
      buyerIntent = "high_purchase_intent";
      targetTransaction = "Purchase";
      intentConfidence = "explicit";
      intentSignals.push("Active purchase intent");
    } else if (userTexts.includes("rent") || userTexts.includes("lease")) {
      targetTransaction = "Rental";
      intentConfidence = "explicit";
    }

    // Property specs
    let propertyType: string | undefined;
    let bedrooms: number | undefined;
    let location: string | undefined;

    if (userTexts.includes("duplex")) propertyType = "Duplex";
    if (userTexts.includes("terrace")) propertyType = "Terrace Duplex";
    if (userTexts.includes("penthouse")) propertyType = "Penthouse";
    if (userTexts.includes("villa") || userTexts.includes("mansion")) propertyType = "Luxury Villa";

    const bedMatch = userTexts.match(/(\d+)\s*(?:bed|bedroom)/i);
    if (bedMatch) {
      bedrooms = parseInt(bedMatch[1], 10);
    }

    const locations = ["ikoyi", "banana island", "victoria island", "eko atlantic", "lekki phase 1", "ikeja gra"];
    for (const loc of locations) {
      if (userTexts.includes(loc)) {
        location = loc.charAt(0).toUpperCase() + loc.slice(1);
        break;
      }
    }

    // --- C. Decision Readiness & Authority ---
    let decisionReadiness: ExtractedSignals["decisionReadiness"] = "exploratory";
    let readinessConfidence: "explicit" | "inferred" | "none" = "none";

    if (
      userTexts.includes("ready to buy") ||
      userTexts.includes("inspect this week") ||
      userTexts.includes("outright cash") ||
      userTexts.includes("close this week") ||
      userTexts.includes("ready now")
    ) {
      decisionReadiness = "immediate_close";
      readinessConfidence = "explicit";
      intentSignals.push("Immediate close readiness");
    } else if (
      userTexts.includes("shortlist") ||
      userTexts.includes("comparing") ||
      userTexts.includes("options")
    ) {
      decisionReadiness = "evaluating_shortlist";
      readinessConfidence = "explicit";
      intentSignals.push("Evaluating property shortlist");
    } else if (
      userTexts.includes("wife") ||
      userTexts.includes("husband") ||
      userTexts.includes("partner") ||
      userTexts.includes("board")
    ) {
      decisionReadiness = "spousal_board_review";
      readinessConfidence = "explicit";
      intentSignals.push("Multi-stakeholder review required");
    }

    // --- D. Timeline & Urgency ---
    let timelineWindow = "exploratory";
    let timelineUrgency: "urgent" | "near_term" | "flexible" = "flexible";
    let timelineConfidence: "explicit" | "inferred" | "none" = "none";

    if (
      userTexts.includes("immediately") ||
      userTexts.includes("this month") ||
      userTexts.includes("asap") ||
      userTexts.includes("urgent") ||
      userTexts.includes("within 30 days") ||
      userTexts.includes("this week")
    ) {
      timelineWindow = "< 30 days";
      timelineUrgency = "urgent";
      timelineConfidence = "explicit";
      intentSignals.push("Urgent acquisition timeline (< 30 days)");
    } else if (
      userTexts.includes("1-3 months") ||
      userTexts.includes("this quarter") ||
      userTexts.includes("next month") ||
      userTexts.includes("soon")
    ) {
      timelineWindow = "1-3 months";
      timelineUrgency = "near_term";
      timelineConfidence = "explicit";
      intentSignals.push("Near-term acquisition timeline");
    } else if (
      userTexts.includes("3-6 months") ||
      userTexts.includes("few months") ||
      userTexts.includes("mid-term")
    ) {
      timelineWindow = "3-6 months";
      timelineUrgency = "flexible";
      timelineConfidence = "inferred";
      intentSignals.push("Mid-term acquisition timeline");
    }

    // --- E. Inspection / Viewing Action Request ---
    let viewingRequested = false;
    if (
      userTexts.includes("inspect") ||
      userTexts.includes("viewing") ||
      userTexts.includes("schedule a tour") ||
      userTexts.includes("schedule tour") ||
      userTexts.includes("schedule inspection") ||
      userTexts.includes("visit the property") ||
      userTexts.includes("see the place") ||
      userTexts.includes("come for inspection")
    ) {
      viewingRequested = true;
      intentSignals.push("In-person viewing requested");
    }

    // --- F. Day 9 Tool Traces (System Evidence) ---
    let specificPropertyId: string | undefined;
    let specificPropertyTitle: string | undefined;
    let hasSpecificPropertyFocus = false;
    let availabilityChecked = false;
    let priceChecked = false;
    let policyChecked = false;

    for (const tool of executedTools) {
      if (tool.toolName === "get_property" && tool.success) {
        hasSpecificPropertyFocus = true;
        specificPropertyId = tool.parameters?.propertyId;
        intentSignals.push("Verified property dossier hydrated");
      }
      if (tool.toolName === "check_property_availability") {
        availabilityChecked = true;
        intentSignals.push("Unit availability verified");
      }
      if (tool.toolName === "get_property_price") {
        priceChecked = true;
        intentSignals.push("Commercial pricing & payment plan reviewed");
      }
      if (tool.toolName === "get_company_policy") {
        policyChecked = true;
      }
    }

    if (!hasSpecificPropertyFocus && (propertyType || bedrooms || location)) {
      hasSpecificPropertyFocus = true;
    }

    // --- G. Objections ---
    const objections: ExtractedSignals["objections"] = [];
    if (
      userTexts.includes("expensive") ||
      userTexts.includes("too high") ||
      userTexts.includes("costly") ||
      userTexts.includes("discount")
    ) {
      objections.push({
        title: "Price sensitivity",
        severity: "medium",
        detail: "Prospect questioned price point or requested discount",
      });
    }
    if (
      userTexts.includes("title") ||
      userTexts.includes("c of o") ||
      userTexts.includes("governor") ||
      userTexts.includes("deed")
    ) {
      objections.push({
        title: "Title deed inquiry",
        severity: "high",
        detail: "Governor's Consent / title document verification requested",
      });
    }

    return {
      declaredBudget,
      numericBudget,
      budgetConfidence,
      buyerIntent,
      intentConfidence,
      decisionReadiness,
      readinessConfidence,
      timelineWindow,
      timelineUrgency,
      timelineConfidence,
      targetTransaction,
      propertyType,
      bedrooms,
      location,
      viewingRequested,
      specificPropertyId,
      specificPropertyTitle,
      hasSpecificPropertyFocus,
      availabilityChecked,
      priceChecked,
      policyChecked,
      objections,
      intentSignals,
    };
  }

  /**
   * Separates AI Evidentiary Confidence from commercial underwriting.
   * Evaluates how complete and explicit the signals gathered from the prospect were.
   */
  calculateAiConfidence(signals: ExtractedSignals) {
    let score = 25; // Baseline floor
    let explicitCount = 0;

    if (signals.budgetConfidence === "explicit") {
      score += 25;
      explicitCount++;
    }
    if (signals.timelineConfidence === "explicit") {
      score += 20;
      explicitCount++;
    }
    if (signals.intentConfidence === "explicit") {
      score += 15;
      explicitCount++;
    }
    if (signals.hasSpecificPropertyFocus) {
      score += 10;
      explicitCount++;
    }
    if (signals.viewingRequested) {
      score += 10;
      explicitCount++;
    }

    score = Math.min(95, Math.max(25, score));

    let confidenceGrade: "high" | "moderate" | "provisional" =
      score >= 75 ? "high" : score >= 60 ? "moderate" : "provisional";

    // If both critical qualification pillars (budget and timeline) are unconfirmed, confidence is provisional
    if (signals.budgetConfidence !== "explicit" && signals.timelineConfidence !== "explicit") {
      confidenceGrade = "provisional";
      score = Math.min(50, score);
    }

    return {
      confidenceScore: score,
      confidenceGrade,
      signalsCount: explicitCount,
      reasoning: `${explicitCount} explicit domain signals validated (${confidenceGrade} evidentiary ground truth)`,
    };
  }

  /**
   * Calculates the deterministic 100-point BANT underwriting score and compiles explainable factors.
   */
  calculateBantScore(
    signals: ExtractedSignals,
    executedTools: Array<{ toolName: string; parameters?: any; success?: boolean }> = []
  ): {
    totalScore: number;
    bantBreakdown: BantBreakdown;
    positiveFactors: ScoreFactor[];
    riskFactors: ScoreFactor[];
  } {
    const positiveFactors: ScoreFactor[] = [];
    const riskFactors: ScoreFactor[] = [];

    // ==========================================
    // 1. BUDGET (Max 25 pts)
    // ==========================================
    let budgetScore = 0;
    let budgetNote = "No budget declared";

    if (
      signals.budgetConfidence === "explicit" &&
      (signals.numericBudget === undefined || signals.numericBudget >= 100_000_000)
    ) {
      budgetScore = 25;
      budgetNote = `Confirmed budget alignment: ${signals.declaredBudget}`;
      positiveFactors.push({
        label: "+ Budget confirmed",
        impact: 25,
        category: "budget",
        detail: `Declared budget ${signals.declaredBudget} aligns with luxury inventory pricing`,
      });
    } else if (signals.numericBudget && signals.numericBudget >= 50_000_000) {
      budgetScore = 18;
      budgetNote = `Declared budget: ${signals.declaredBudget} (moderate stretch)`;
      positiveFactors.push({
        label: "+ Moderate budget declared",
        impact: 18,
        category: "budget",
        detail: `Declared budget ${signals.declaredBudget}`,
      });
    } else if (signals.declaredBudget) {
      budgetScore = 10;
      budgetNote = `Approximate budget: ${signals.declaredBudget}`;
    } else {
      budgetScore = 0;
      riskFactors.push({
        label: "- Budget unconfirmed",
        impact: 0,
        category: "budget",
        detail: "Prospect has not stated an acquisition budget",
      });
    }

    // ==========================================
    // 2. AUTHORITY (Max 15 pts)
    // ==========================================
    let authorityScore = 3;
    let authorityNote = "Unstated authority";

    if (signals.decisionReadiness === "spousal_board_review") {
      authorityScore = 10;
      authorityNote = "Primary buyer with spousal/partner joint review";
      positiveFactors.push({
        label: "+ Decision committee identified",
        impact: 10,
        category: "authority",
        detail: "Spousal/partner review required for final sign-off",
      });
    } else if (
      signals.decisionReadiness === "immediate_close" ||
      signals.buyerIntent === "high_purchase_intent" ||
      signals.buyerIntent === "luxury_relocation" ||
      signals.buyerIntent === "investment_yield_seeking"
    ) {
      authorityScore = 15;
      authorityNote = "Confirmed sole decision maker";
      positiveFactors.push({
        label: "+ Sole decision maker",
        impact: 15,
        category: "authority",
        detail: "Principal decision maker transacting directly",
      });
    } else {
      authorityScore = 3;
    }

    // ==========================================
    // 3. NEED (Max 25 pts)
    // ==========================================
    let needScore = 5;
    let needNote = "General browsing";

    if (
      signals.buyerIntent === "investment_yield_seeking" ||
      signals.buyerIntent === "luxury_relocation"
    ) {
      needScore = 20;
      needNote =
        signals.buyerIntent === "investment_yield_seeking"
          ? "High-yield investment and capital appreciation"
          : "Primary luxury residential relocation";
      positiveFactors.push({
        label: "+ Purchase intent",
        impact: 20,
        category: "need",
        detail: needNote,
      });
    } else if (
      signals.buyerIntent === "high_purchase_intent" &&
      (signals.propertyType || signals.bedrooms || signals.location)
    ) {
      needScore = 17;
      needNote = `Active purchase intent: ${signals.bedrooms ? signals.bedrooms + "-bed " : ""}${signals.propertyType || "Property"}${signals.location ? " in " + signals.location : ""}`;
      positiveFactors.push({
        label: "+ Purchase intent",
        impact: 17,
        category: "need",
        detail: needNote,
      });
    } else if (signals.buyerIntent === "high_purchase_intent") {
      needScore = 12;
      needNote = "Active purchase intent";
      positiveFactors.push({
        label: "+ Purchase intent",
        impact: 12,
        category: "need",
        detail: "High acquisition intent stated",
      });
    }

    // ==========================================
    // 4. TIMELINE (Max 20 pts)
    // ==========================================
    let timelineScore = 3;
    let timelineNote = "Exploratory timeline (> 6 months)";

    if (
      signals.timelineUrgency === "urgent" ||
      signals.timelineWindow === "< 30 days" ||
      signals.decisionReadiness === "immediate_close"
    ) {
      timelineScore = 20;
      timelineNote = "Immediate acquisition window (< 30 days)";
      positiveFactors.push({
        label: "+ Timeline under 30 days",
        impact: 20,
        category: "timeline",
        detail: "Ready to transact and inspect within 30 days",
      });
    } else if (signals.timelineUrgency === "near_term") {
      timelineScore = 14;
      timelineNote = "Near-term acquisition (1-3 months)";
      positiveFactors.push({
        label: "+ Near-term timeline",
        impact: 14,
        category: "timeline",
        detail: "Targeting closing within 1-3 months",
      });
    } else if (signals.timelineWindow === "3-6 months") {
      timelineScore = 8;
      timelineNote = "Mid-term acquisition (3-6 months)";
    } else {
      timelineScore = 3;
      riskFactors.push({
        label: "- Extended timeline",
        impact: 0,
        category: "timeline",
        detail: "Timeline is exploratory (> 6 months)",
      });
    }

    // ==========================================
    // 5. PROPERTY FIT & ENGAGEMENT CATALYSTS (Max 15 pts)
    // Cumulative sub-components capped at max 15 points
    // ==========================================
    let specificityPoints = 0;
    if (signals.hasSpecificPropertyFocus) {
      specificityPoints = 7;
      positiveFactors.push({
        label: "+ Specific property",
        impact: 7,
        category: "property_fit",
        detail: "Targeted criteria matched against verified inventory",
      });
    } else if (executedTools.some((t) => t.toolName === "search_properties")) {
      specificityPoints = 2;
    }

    let engagementPoints = 0;
    if (signals.viewingRequested) {
      engagementPoints = 8;
      positiveFactors.push({
        label: "+ Viewing requested",
        impact: 8,
        category: "property_fit",
        detail: "In-person property inspection requested by prospect",
      });
    } else if (signals.availabilityChecked) {
      engagementPoints = 4;
      positiveFactors.push({
        label: "+ Availability verified",
        impact: 4,
        category: "property_fit",
        detail: "Real-time inventory availability verified",
      });
    } else if (signals.priceChecked) {
      engagementPoints = 3;
      positiveFactors.push({
        label: "+ Price evaluated",
        impact: 3,
        category: "property_fit",
        detail: "Commercial terms and payment plan checked",
      });
    }

    const propertyFitScore = Math.min(15, specificityPoints + engagementPoints);
    const propertyFitNote = signals.viewingRequested
      ? "Specific property viewing requested"
      : signals.hasSpecificPropertyFocus
      ? "High criteria match against inventory"
      : "Broad exploratory inventory browsing";

    // ==========================================
    // 6. OBJECTION DEDUCTIONS (-5 to -15 pts)
    // ==========================================
    let penalty = 0;
    for (const obj of signals.objections) {
      if (obj.title.includes("Price")) {
        penalty += 5;
        riskFactors.push({
          label: "- Price sensitivity",
          impact: -5,
          category: "objection",
          detail: obj.detail,
        });
      }
      if (obj.title.includes("Title")) {
        penalty += 5;
        riskFactors.push({
          label: "- Title deed inquiry",
          impact: -5,
          category: "objection",
          detail: obj.detail,
        });
      }
    }

    const rawTotal =
      budgetScore + authorityScore + needScore + timelineScore + propertyFitScore - penalty;
    const totalScore = Math.min(100, Math.max(0, rawTotal));

    const bantBreakdown: BantBreakdown = {
      budgetScore,
      budgetNote,
      authorityScore,
      authorityNote,
      needScore,
      needNote,
      timelineScore,
      timelineNote,
      propertyFitScore,
      propertyFitNote,
    };

    return {
      totalScore,
      bantBreakdown,
      positiveFactors,
      riskFactors,
    };
  }

  /**
   * Generates a deterministic NextActionDirective based on qualification score,
   * objections, and viewing requests.
   */
  generateNextAction(
    score: number,
    scoreCategory: "HOT" | "WARM" | "COLD",
    signals: ExtractedSignals,
    executedTools: Array<{ toolName: string }> = []
  ): { summary: string; directive: NextActionDirective } {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const twoDays = new Date();
    twoDays.setDate(twoDays.getDate() + 2);

    if (scoreCategory === "HOT" && signals.viewingRequested) {
      const summary = "Schedule in-person property inspection within 24 hours";
      return {
        summary,
        directive: {
          action: summary,
          assignedTo: "Senior Sales Broker",
          priority: "Immediate",
          dueDate: tomorrow.toISOString(),
          protocolRecommendation:
            "Assign broker, send calendar invitation, provide property brochure and gate access pass",
        },
      };
    }

    if (scoreCategory === "HOT") {
      const summary = "Contact prospect immediately to confirm inspection & payment structure";
      return {
        summary,
        directive: {
          action: summary,
          assignedTo: "Senior Sales Broker",
          priority: "Immediate",
          dueDate: tomorrow.toISOString(),
          protocolRecommendation:
            "Conduct direct telephone outreach, review buyer liquidity, and offer curated inspection slots",
        },
      };
    }

    if (scoreCategory === "WARM") {
      const summary = "Send curated property shortlist and follow up in 48 hours";
      return {
        summary,
        directive: {
          action: summary,
          assignedTo: "Sales Agent",
          priority: "Scheduled",
          dueDate: twoDays.toISOString(),
          protocolRecommendation:
            "Deliver PDF dossier of 3 verified options matching declared criteria and schedule follow-up call",
        },
      };
    }

    // COLD
    const summary = "Enroll prospect in automated luxury email nurture and quarterly market report";
    return {
      summary,
      directive: {
        action: summary,
        assignedTo: "AI Sales Engine",
        priority: "Routine",
        protocolRecommendation:
          "Maintain non-intrusive monthly newsletter touchpoint until acquisition urgency shifts",
      },
    };
  }

  /**
   * Persists qualification snapshot and append-only score history to Neon PostgreSQL.
   */
  private async persistEvaluation(
    workspaceId: string,
    leadId: string,
    result: DeterministicQualificationResult,
    callId?: string
  ): Promise<void> {
    try {
      // 1. Snapshot in qualification_results
      await this.db.insert(schema.qualificationResults).values({
        workspaceId,
        leadId,
        callId: callId || undefined,
        confidenceScore: result.aiConfidence.confidenceScore,
        buyerIntent: result.leadIntent.buyerIntent,
        decisionReadiness: result.leadIntent.decisionReadiness,
        motivation: result.leadIntent.intentSignals.join("; ") || "Luxury property inquiry",
        timelineWindow: result.timeline.window,
        timelineUrgency: result.timeline.urgency,
        budgetDeclared: result.budgetAnalysis.declared || undefined,
        paymentStructure: result.budgetAnalysis.paymentStructure,
        budgetStretchCategory: result.budgetAnalysis.stretchCategory,
        objections: result.objections,
        intentSignals: result.leadIntent.intentSignals,
      });

      // 2. Append-only entry in lead_scores (Historical Score Log)
      await this.db.insert(schema.leadScores).values({
        workspaceId,
        leadId,
        score: result.score,
        scoreCategory: result.scoreCategory,
        budgetScore: result.bantBreakdown.budgetScore,
        authorityScore: result.bantBreakdown.authorityScore,
        needScore: result.bantBreakdown.needScore,
        timelineScore: result.bantBreakdown.timelineScore,
        propertyFitScore: result.bantBreakdown.propertyFitScore,
        factors: {
          positiveFactors: result.factors.positiveFactors,
          riskFactors: result.factors.riskFactors,
          notes: {
            budgetNote: result.bantBreakdown.budgetNote,
            authorityNote: result.bantBreakdown.authorityNote,
            needNote: result.bantBreakdown.needNote,
            timelineNote: result.bantBreakdown.timelineNote,
            propertyFitNote: result.bantBreakdown.propertyFitNote,
          },
          aiConfidence: result.aiConfidence,
        },
        calculatedAt: new Date(),
      });

      // 3. Update active lead record
      const [existingLead] = await this.db
        .select()
        .from(schema.leads)
        .where(and(eq(schema.leads.id, leadId), eq(schema.leads.workspaceId, workspaceId)))
        .limit(1);

      if (existingLead) {
        const currentMeta = (existingLead.metadata || {}) as Record<string, any>;
        const updatedMeta = {
          ...currentMeta,
          nextActionDirective: result.recommendedNextAction.directive,
          bantBreakdown: result.bantBreakdown,
          factors: result.factors,
        };

        const oldScoreCategory = existingLead.scoreCategory;

        await this.db
          .update(schema.leads)
          .set({
            score: result.score,
            scoreCategory: result.scoreCategory,
            nextAction: result.recommendedNextAction.summary,
            timeline: result.timeline.window,
            budget: result.budgetAnalysis.declared || existingLead.budget,
            metadata: updatedMeta,
            updatedAt: new Date(),
          })
          .where(and(eq(schema.leads.id, leadId), eq(schema.leads.workspaceId, workspaceId)));

        // 4. If category changed, log timeline event in lead_events
        if (oldScoreCategory !== result.scoreCategory) {
          await this.db.insert(schema.leadEvents).values({
            workspaceId,
            leadId,
            type: "status_change",
            title: `Lead Score Upgraded: ${result.score} (${result.scoreCategory})`,
            description: `Underwriting score adjusted to ${result.score}/100. Factors: ${result.factors.positiveFactors.map((f) => f.label).join(", ") || "General signals"}`,
            actorType: "system",
            metadata: {
              previousCategory: oldScoreCategory,
              newCategory: result.scoreCategory,
              score: result.score,
            },
          });
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to persist qualification and score for lead [${leadId}] in workspace [${workspaceId}]: ${err.message}`,
        err.stack
      );
      throw err;
    }
  }

  /**
   * Retrieves append-only score history for a lead strictly isolated by workspace.
   */
  async getScoreHistory(workspaceId: string, leadId: string) {
    return this.db
      .select()
      .from(schema.leadScores)
      .where(
        and(eq(schema.leadScores.leadId, leadId), eq(schema.leadScores.workspaceId, workspaceId))
      )
      .orderBy(desc(schema.leadScores.calculatedAt));
  }
}
