import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";
import {
  AiAgentConfigRecord,
  BusinessHoursConfig,
  EscalationRulesConfig,
  FollowUpRulesConfig,
} from "../../../database/schema";
import { UpdateAiConfigDto } from "../dto/ai-config.dto";

export const DEFAULT_AI_CONFIG = {
  name: "Amara",
  voice: "en-NG-EzinneNeural",
  tone: "luxury_professional" as const,
  language: "en-NG" as const,
  greeting:
    "Good day. Thank you for contacting Spacia. I am Amara, your personal luxury real estate advisor. How may I assist your property acquisition today?",
  businessHours: {
    enabled: true,
    start: "08:00",
    end: "19:00",
    timezone: "Africa/Lagos",
    days: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ],
  } as BusinessHoursConfig,
  escalationRules: {
    humanTakeoverKeywords: [
      "human",
      "agent",
      "broker",
      "lawyer",
      "scam",
      "dispute",
      "litigation",
      "c-of-o query",
      "bank wire instructions",
      "fraud",
    ],
    budgetThresholdNaira: 500000000,
    maxNegativeSentiments: 2,
    requireHumanForContracts: true,
  } as EscalationRulesConfig,
  followUpRules: {
    maxAttempts: 3,
    intervalHours: 24,
    autoArchiveUnresponsiveDays: 7,
    channelOrder: ["whatsapp", "sms", "voice"],
  } as FollowUpRulesConfig,
  isActive: true,
};

@Injectable()
export class AiConfigService {
  private readonly logger = new Logger(AiConfigService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb
  ) {}

  /**
   * Retrieves active AI Agent configuration for the workspace,
   * or provisions a default baseline record if one does not exist yet.
   */
  async getOrCreateConfig(workspaceId: string): Promise<AiAgentConfigRecord> {
    if (!workspaceId) {
      throw new BadRequestException("Workspace ID is required to retrieve AI configuration.");
    }

    try {
      const [existing] = await this.db
        .select()
        .from(schema.aiAgentConfigs)
        .where(eq(schema.aiAgentConfigs.workspaceId, workspaceId))
        .limit(1);

      if (existing) {
        return existing;
      }

      // Provision default configuration for workspace
      this.logger.log(`Provisioning baseline AI configuration for workspace [${workspaceId}]`);
      const [created] = await this.db
        .insert(schema.aiAgentConfigs)
        .values({
          workspaceId,
          name: DEFAULT_AI_CONFIG.name,
          voice: DEFAULT_AI_CONFIG.voice,
          tone: DEFAULT_AI_CONFIG.tone,
          language: DEFAULT_AI_CONFIG.language,
          greeting: DEFAULT_AI_CONFIG.greeting,
          businessHours: DEFAULT_AI_CONFIG.businessHours,
          escalationRules: DEFAULT_AI_CONFIG.escalationRules,
          followUpRules: DEFAULT_AI_CONFIG.followUpRules,
          isActive: DEFAULT_AI_CONFIG.isActive,
        })
        .returning();

      // Ensure sync with legacy ai_agents table if present
      await this.syncLegacyAgentTable(workspaceId, created);

      return created;
    } catch (err: any) {
      this.logger.error(`Failed to get/create AI config for [${workspaceId}]: ${err.message}`);
      throw err;
    }
  }

  /**
   * Updates workspace-scoped AI configuration.
   * Guarantees tenant isolation and persists all 8 core configuration parameters.
   */
  async updateConfig(
    workspaceId: string,
    dto: UpdateAiConfigDto
  ): Promise<AiAgentConfigRecord> {
    const current = await this.getOrCreateConfig(workspaceId);

    // Merge nested configuration fields carefully
    const updatedBusinessHours: BusinessHoursConfig = dto.businessHours
      ? {
          ...current.businessHours,
          ...dto.businessHours,
        }
      : current.businessHours;

    const updatedEscalationRules: EscalationRulesConfig = dto.escalationRules
      ? {
          ...current.escalationRules,
          ...dto.escalationRules,
        }
      : current.escalationRules;

    const updatedFollowUpRules: FollowUpRulesConfig = dto.followUpRules
      ? {
          ...current.followUpRules,
          ...dto.followUpRules,
        }
      : current.followUpRules;

    const updateValues: Partial<schema.NewAiAgentConfigRecord> = {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.voice !== undefined && { voice: dto.voice.trim() }),
      ...(dto.tone !== undefined && { tone: dto.tone }),
      ...(dto.language !== undefined && { language: dto.language }),
      ...(dto.greeting !== undefined && { greeting: dto.greeting.trim() }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      businessHours: updatedBusinessHours,
      escalationRules: updatedEscalationRules,
      followUpRules: updatedFollowUpRules,
      updatedAt: new Date(),
    };

    const [updated] = await this.db
      .update(schema.aiAgentConfigs)
      .set(updateValues)
      .where(eq(schema.aiAgentConfigs.workspaceId, workspaceId))
      .returning();

    if (!updated) {
      throw new NotFoundException(`AI configuration for workspace [${workspaceId}] not found.`);
    }

    // Keep legacy table synchronized
    await this.syncLegacyAgentTable(workspaceId, updated);

    return updated;
  }

  /**
   * Resets workspace configuration back to Spacia luxury baseline defaults.
   */
  async resetConfig(workspaceId: string): Promise<AiAgentConfigRecord> {
    await this.getOrCreateConfig(workspaceId);

    const [reset] = await this.db
      .update(schema.aiAgentConfigs)
      .set({
        name: DEFAULT_AI_CONFIG.name,
        voice: DEFAULT_AI_CONFIG.voice,
        tone: DEFAULT_AI_CONFIG.tone,
        language: DEFAULT_AI_CONFIG.language,
        greeting: DEFAULT_AI_CONFIG.greeting,
        businessHours: DEFAULT_AI_CONFIG.businessHours,
        escalationRules: DEFAULT_AI_CONFIG.escalationRules,
        followUpRules: DEFAULT_AI_CONFIG.followUpRules,
        isActive: DEFAULT_AI_CONFIG.isActive,
        updatedAt: new Date(),
      })
      .where(eq(schema.aiAgentConfigs.workspaceId, workspaceId))
      .returning();

    await this.syncLegacyAgentTable(workspaceId, reset);
    return reset;
  }

  /**
   * Evaluates if a given time is currently within configured business hours.
   */
  isWithinBusinessHours(
    config: AiAgentConfigRecord,
    checkDate: Date = new Date()
  ): boolean {
    if (!config.businessHours?.enabled) {
      return true; // 24/7 if business hours are disabled
    }

    try {
      const timezone = config.businessHours.timezone || "Africa/Lagos";
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "long",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });

      const parts = formatter.formatToParts(checkDate);
      const weekday = parts.find((p) => p.type === "weekday")?.value.toLowerCase() || "";
      const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
      const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
      const currentMinutes = hour * 60 + minute;

      // Check day of week
      const activeDays = (config.businessHours.days || []).map((d) => d.toLowerCase());
      if (activeDays.length > 0 && !activeDays.includes(weekday)) {
        return false;
      }

      // Check time range
      const [startHour, startMin] = (config.businessHours.start || "08:00")
        .split(":")
        .map((v) => parseInt(v, 10));
      const [endHour, endMin] = (config.businessHours.end || "19:00")
        .split(":")
        .map((v) => parseInt(v, 10));

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } catch (err: any) {
      this.logger.warn(`Could not calculate business hours: ${err.message}`);
      return true;
    }
  }

  /**
   * Evaluates a prospect message and/or budget against escalation rules.
   */
  checkEscalation(
    config: AiAgentConfigRecord,
    message: string,
    budgetNaira?: number
  ): { shouldEscalate: boolean; reason?: string } {
    const rules = config.escalationRules;
    if (!rules) return { shouldEscalate: false };

    // 1. Keyword-based escalation
    const lowerMessage = (message || "").toLowerCase();
    const matchedKeyword = (rules.humanTakeoverKeywords || []).find((kw) =>
      lowerMessage.includes(kw.toLowerCase())
    );

    if (matchedKeyword) {
      return {
        shouldEscalate: true,
        reason: `Escalation triggered by keyword: "${matchedKeyword}"`,
      };
    }

    // 2. Budget threshold escalation
    if (
      budgetNaira !== undefined &&
      rules.budgetThresholdNaira > 0 &&
      budgetNaira >= rules.budgetThresholdNaira
    ) {
      return {
        shouldEscalate: true,
        reason: `Escalation triggered by high budget: ₦${budgetNaira.toLocaleString()} exceeds threshold ₦${rules.budgetThresholdNaira.toLocaleString()}`,
      };
    }

    return { shouldEscalate: false };
  }

  /**
   * Helper to synchronize configuration into legacy ai_agents table.
   */
  private async syncLegacyAgentTable(
    workspaceId: string,
    config: AiAgentConfigRecord
  ): Promise<void> {
    try {
      const [existingAgent] = await this.db
        .select()
        .from(schema.aiAgents)
        .where(eq(schema.aiAgents.workspaceId, workspaceId))
        .limit(1);

      if (existingAgent) {
        await this.db
          .update(schema.aiAgents)
          .set({
            name: config.name,
            voiceId: config.voice,
            isActive: config.isActive,
            updatedAt: new Date(),
          })
          .where(eq(schema.aiAgents.id, existingAgent.id));
      } else {
        await this.db.insert(schema.aiAgents).values({
          workspaceId,
          name: config.name,
          role: "lead_qualifier",
          voiceId: config.voice,
          isActive: config.isActive,
        });
      }
    } catch (err: any) {
      this.logger.debug(`Legacy ai_agents sync skipped: ${err.message}`);
    }
  }
}
