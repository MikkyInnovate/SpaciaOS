import { Injectable, Inject, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";

export interface WorkspaceContextInfo {
  workspaceId: string;
  workspaceName?: string;
  primaryMarket?: string;
  tier?: string;
}

export interface LeadContextInfo {
  leadId?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  declaredInterest?: string;
  budgetRange?: string;
  preferredLocation?: string;
  propertyId?: string;
  channel?: string;
}

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb
  ) {}

  /**
   * Resolves trusted workspace context from database.
   */
  async resolveWorkspaceContext(workspaceId: string): Promise<WorkspaceContextInfo> {
    try {
      const [ws] = await this.db
        .select()
        .from(schema.workspaces)
        .where(eq(schema.workspaces.id, workspaceId))
        .limit(1);

      if (ws) {
        return {
          workspaceId: ws.id,
          workspaceName: ws.name,
          primaryMarket: ws.primaryMarket || "Lagos Prime Luxury",
          tier: ws.tier,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch workspace [${workspaceId}]: ${err.message}`);
    }

    return {
      workspaceId,
      workspaceName: "Spacia Premier Realty",
      primaryMarket: "Lagos Prime Luxury",
      tier: "starter",
    };
  }

  /**
   * Resolves trusted lead context from database if leadId provided.
   */
  async resolveLeadContext(workspaceId: string, leadId?: string): Promise<LeadContextInfo | null> {
    if (!leadId) return null;

    try {
      const [lead] = await this.db
        .select()
        .from(schema.leads)
        .where(eq(schema.leads.id, leadId))
        .limit(1);

      if (lead && lead.workspaceId === workspaceId) {
        return {
          leadId: lead.id,
          fullName: lead.name,
          phone: lead.phone,
          email: lead.email || undefined,
          declaredInterest: lead.intent || undefined,
          budgetRange: lead.budget || undefined,
          preferredLocation: lead.locationPreference || undefined,
          propertyId: lead.propertyId || undefined,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch lead [${leadId}]: ${err.message}`);
    }

    return null;
  }

  /**
   * Resolves active workspace AI configuration from database.
   */
  async resolveAiConfig(workspaceId: string): Promise<schema.AiAgentConfigRecord | null> {
    try {
      const [cfg] = await this.db
        .select()
        .from(schema.aiAgentConfigs)
        .where(eq(schema.aiAgentConfigs.workspaceId, workspaceId))
        .limit(1);

      return cfg || null;
    } catch (err: any) {
      this.logger.warn(`Could not fetch AI config [${workspaceId}]: ${err.message}`);
      return null;
    }
  }

  /**
   * Constructs the authoritative system prompt with all anti-hallucination,
   * policy guardrails, and injected workspace AI configuration.
   */
  buildSystemPrompt(
    workspace: WorkspaceContextInfo,
    lead?: LeadContextInfo | null,
    channel = "web_chat",
    aiConfig?: schema.AiAgentConfigRecord | null
  ): string {
    const agencyName = workspace.workspaceName || "Spacia Premier Realty";
    const market = workspace.primaryMarket || "Lagos Prime Luxury";
    const agentName = aiConfig?.name || "Amara";
    const tone = aiConfig?.tone || "luxury_professional";
    const language = aiConfig?.language || "en-NG";

    let toneGuidance = "Refined, discreet, articulate, and deeply respectful. Speak with the understated elegance suitable for High-Net-Worth individuals.";
    if (tone === "consultative") {
      toneGuidance = "Consultative, advisory, and diagnostic. Act as an expert real estate advisor uncovering client criteria through thoughtful questions.";
    } else if (tone === "assertive") {
      toneGuidance = "Direct, decisive, energetic, and velocity-driven. Emphasize exclusive inventory scarcity and swift viewing arrangements.";
    } else if (tone === "warm_friendly") {
      toneGuidance = "Warm, welcoming, encouraging, and hospitable while maintaining complete factual precision.";
    }

    const promptParts = [
      `You are ${agentName}, the autonomous AI Sales Executive for ${agencyName}, an elite luxury real estate brokerage specializing in ${market}.`,
      `Communication Tone: ${toneGuidance}`,
      `Primary Operating Language: ${language} (Nigerian Prime Real Estate English).`,
      ``,
    ];

    if (aiConfig?.greeting) {
      promptParts.push(
        `APPROVED OPENING SCRIPT / GREETING BASELINE:`,
        `"${aiConfig.greeting}"`,
        ``
      );
    }

    // Business Hours Context
    if (aiConfig?.businessHours) {
      const bh = aiConfig.businessHours;
      promptParts.push(
        `OPERATIONAL BUSINESS HOURS SCHEDULE:`,
        `- Active Window: ${bh.start} to ${bh.end} (${bh.timezone || "Africa/Lagos"})`,
        `- Operating Days: ${(bh.days || []).join(", ")}`,
        `- Protocol: If responding outside scheduled hours, assure the prospect that a senior partner will prioritize follow-up first thing in the morning.`,
        ``
      );
    }

    // Human Escalation Directives
    if (aiConfig?.escalationRules) {
      const esc = aiConfig.escalationRules;
      promptParts.push(
        `CRITICAL HUMAN ESCALATION & HANDOVER DIRECTIVES:`,
        `- Keywords requiring immediate human handoff: ${(esc.humanTakeoverKeywords || []).join(", ")}`,
        `- High-Value Escalation Threshold: ₦${(esc.budgetThresholdNaira || 500000000).toLocaleString()}`,
        `- Escalation Policy: If prospect demands human assistance, expresses legal disputes, or requests custom contracts, gracefully initiate a handoff.`,
        ``
      );
    }

    // Follow-up Policy Context
    if (aiConfig?.followUpRules) {
      const fu = aiConfig.followUpRules;
      promptParts.push(
        `FOLLOW-UP & ENGAGEMENT RULES:`,
        `- Max Follow-up Sequences: ${fu.maxAttempts} attempts spaced by ${fu.intervalHours} hours.`,
        `- Authorized Follow-up Channels: ${(fu.channelOrder || ["whatsapp", "sms", "voice"]).join(", ")}`,
        ``
      );
    }

    promptParts.push(
      `================================================================================`,
      `CRITICAL ANTI-HALLUCINATION GUARDRAILS (ZERO TOLERANCE FOR FABRICATION):`,
      `1. You must NEVER invent, assume, or fabricate property prices, availability, square footage, features, titles, fees, or commissions.`,
      `2. Any listing information MUST come directly from an approved tool invocation (search_properties, get_property, check_property_availability, get_property_price).`,
      `3. If a prospective buyer asks about a property feature (such as a private helipad, dock, pool, smart home automation, elevator) and it is NOT explicitly present in verified tool output, you MUST state: "I don't have a verified record of that feature for this property. Let me confirm that directly with our listing partner."`,
      `4. Never make guarantees, fictitious unit holds, or promise unauthorized discounts.`,
      `================================================================================`,
      ``,
      `================================================================================`,
      `REGULATORY & POLICY GUARDRAILS:`,
      `1. When discussing commission fees, agency terms, escrow, viewing notice, or cancellation rules, DO NOT cite unverified numbers. You must call [get_company_policy] to retrieve the legally binding policy.`,
      `2. Lagos State Real Estate Regulatory Authority (LASRERA) statutory rules are non-negotiable.`,
      `================================================================================`,
      ``,
      `================================================================================`,
      `NIGERIAN PRIME MARKET REAL ESTATE CONTEXT:`,
      `- Core Territories: Ikoyi, Banana Island, Victoria Island, Lekki Phase 1, Eko Atlantic.`,
      `- Currency: Nigerian Naira (₦ / NGN). Always format high amounts clearly (e.g. ₦85,000,000 / ₦450,000,000).`,
      `- Land & Title Terms: Governor's Consent, Certificate of Occupancy (C of O), Gazette, Deed of Assignment.`,
      `- Commercial Terms: Annual service charge is distinct from purchase price and covers 24/7 power, security, and facility maintenance.`,
      `================================================================================`,
      ``,
      `ACTIVE CONTEXT & LEAD DOSSIER:`,
      `- Operating Workspace: ${agencyName} [ID: ${workspace.workspaceId}]`,
      `- Interaction Channel: ${channel}`
    );

    if (lead) {
      promptParts.push(
        `- Prospect Name: ${lead.fullName || "Inquiring Buyer"}`,
        `- Declared Interest: ${lead.declaredInterest || "Luxury Acquisition"}`,
        `- Preferred Location: ${lead.preferredLocation || "Lagos Prime"}`,
        `- Budget Parameter: ${lead.budgetRange || "Pending qualification"}`
      );
    } else {
      promptParts.push(`- Prospect Profile: New prospective client inquiry.`);
    }

    promptParts.push(
      ``,
      `OBJECTIVE:`,
      `Greet the prospect gracefully, understand their acquisition or leasing criteria, use your approved tools to query real listings and verified pricing, and guide qualified buyers toward a private inspection.`
    );

    return promptParts.join("\n");
  }
}
