import { apiClient } from "@/lib/api/client";
import type {
  AIAgentStatusTelemetry,
  AIAgentConfiguration,
  ActiveCallTelemetry,
  BuyerIntentEvaluation,
  AIAgentRecentActivity,
} from "../types";
import {
  MOCK_AI_AGENT_STATUS,
  MOCK_AI_AGENT_CONFIG,
  MOCK_SAMPLE_INTENTS,
} from "../data/mock-ai-agent";

/**
 * Proposed Backend REST Contracts:
 * - GET /api/v1/ai-agent/status
 * - GET /api/v1/ai-agent/config
 * - PATCH /api/v1/ai-agent/config
 * - POST /api/v1/ai-agent/pause
 * - POST /api/v1/ai-agent/resume
 * - GET /api/v1/ai-agent/active-call
 * - GET /api/v1/ai-agent/activities
 *
 * Mock Boundary:
 * Provides in-memory session persistence when backend endpoints are pending.
 */

const inMemoryStatus: AIAgentStatusTelemetry = JSON.parse(
  JSON.stringify(MOCK_AI_AGENT_STATUS)
);

let inMemoryConfig: AIAgentConfiguration = JSON.parse(
  JSON.stringify(MOCK_AI_AGENT_CONFIG)
);

function normalizeConfig(raw: any): AIAgentConfiguration {
  const base = MOCK_AI_AGENT_CONFIG;
  const name = raw?.name || raw?.persona?.name || base.name;
  const voice = raw?.voice || raw?.persona?.voiceModel || base.voice;
  const tone = raw?.tone || "luxury_professional";
  const language = raw?.language || "en-NG";
  const greeting = raw?.greeting || raw?.persona?.greeting || base.greeting;
  const businessHours = raw?.businessHours || raw?.business_hours || base.businessHours;
  const escalationRules = raw?.escalationRules || raw?.escalation_rules || base.escalationRules;
  const followUpRules = raw?.followUpRules || raw?.follow_up_rules || base.followUpRules;
  const isActive = raw?.isActive !== undefined ? raw.isActive : base.isActive;

  const budgetNum = Number(escalationRules?.budgetThresholdNaira) || 500000000;
  const formattedBudget = `₦${budgetNum.toLocaleString()}`;

  return {
    id: raw?.id,
    workspaceId: raw?.workspaceId || raw?.workspace_id,
    name,
    voice,
    tone,
    language,
    greeting,
    businessHours,
    escalationRules,
    followUpRules,
    isActive,
    // Mirrored presentation structures for backward compatibility
    persona: {
      name,
      identityTitle: raw?.persona?.identityTitle || "Executive Brokerage Intake Specialist",
      voiceModel: voice,
      accent: raw?.persona?.accent || "Nigerian Business English (Executive Lagos Neutral)",
      greeting,
      temperature: raw?.persona?.temperature ?? 0.35,
      interruptionToleranceMs: raw?.persona?.interruptionToleranceMs ?? 420,
      speechSpeed: raw?.persona?.speechSpeed ?? 1.0,
      truthPolicy: raw?.persona?.truthPolicy || "strict_verified_only",
    },
    qualificationGates: {
      minimumBudgetNaira: budgetNum,
      formattedMinimumBudget: formattedBudget,
      targetTimelineDays: raw?.qualificationGates?.targetTimelineDays ?? 30,
      requiredTitleDeeds: raw?.qualificationGates?.requiredTitleDeeds || [
        "Governor's Consent",
        "Certificate of Occupancy (C of O)",
        "Registered Gazette",
      ],
      immediateEscalationKeywords:
        escalationRules?.humanTakeoverKeywords || [
          "negotiate commission",
          "bank wire instructions",
          "speak to lawyer",
          "escrow account",
          "price discount",
        ],
    },
    guardrails: {
      maxOutboundAttempts: followUpRules?.maxAttempts ?? 3,
      quietHoursStart: businessHours?.end || "19:00",
      quietHoursEnd: businessHours?.start || "08:00",
      dncEnforced: raw?.guardrails?.dncEnforced ?? true,
      autoHandoffOnNegotiation: raw?.guardrails?.autoHandoffOnNegotiation ?? true,
      autoDispatchBookings: raw?.guardrails?.autoDispatchBookings ?? false,
    },
  };
}

class AIAgentService {
  async getStatus(): Promise<AIAgentStatusTelemetry> {
    try {
      const res = await apiClient.get<{ status: AIAgentStatusTelemetry }>(
        "/api/v1/ai-agent/status"
      );
      if (res?.status) return res.status;
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 80));
    return JSON.parse(JSON.stringify(inMemoryStatus));
  }

  async getStatusTelemetry(): Promise<AIAgentStatusTelemetry> {
    return this.getStatus();
  }

  async getConfig(): Promise<AIAgentConfiguration> {
    try {
      const res = await apiClient.get<{ config: any }>(
        "/api/v1/ai-agent/config"
      );
      if (res?.config) {
        const normalized = normalizeConfig(res.config);
        inMemoryConfig = normalized;
        return normalized;
      }
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 80));
    return normalizeConfig(inMemoryConfig);
  }

  async getConfiguration(): Promise<AIAgentConfiguration> {
    return this.getConfig();
  }

  async updateConfig(
    patch: Partial<AIAgentConfiguration>
  ): Promise<AIAgentConfiguration> {
    try {
      // Construct backend payload aligning with UpdateAiConfigDto
      const payload: Record<string, any> = {};
      if (patch.name !== undefined) payload.name = patch.name;
      if (patch.voice !== undefined) payload.voice = patch.voice;
      if (patch.tone !== undefined) payload.tone = patch.tone;
      if (patch.language !== undefined) payload.language = patch.language;
      if (patch.greeting !== undefined) payload.greeting = patch.greeting;
      if (patch.businessHours !== undefined) payload.businessHours = patch.businessHours;
      if (patch.escalationRules !== undefined) payload.escalationRules = patch.escalationRules;
      if (patch.followUpRules !== undefined) payload.followUpRules = patch.followUpRules;
      if (patch.isActive !== undefined) payload.isActive = patch.isActive;

      // Also support legacy persona patches if caller passes them
      if (patch.persona?.name && !payload.name) payload.name = patch.persona.name;
      if (patch.persona?.voiceModel && !payload.voice) payload.voice = patch.persona.voiceModel;
      if (patch.persona?.greeting && !payload.greeting) payload.greeting = patch.persona.greeting;

      const res = await apiClient.put<{ config: any }>(
        "/api/v1/ai-agent/config",
        payload
      );
      if (res?.config) {
        const normalized = normalizeConfig(res.config);
        inMemoryConfig = normalized;
        return normalized;
      }
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 150));
    inMemoryConfig = normalizeConfig({
      ...inMemoryConfig,
      ...patch,
    });

    return inMemoryConfig;
  }

  async updateConfiguration(
    patch: Partial<AIAgentConfiguration>
  ): Promise<AIAgentConfiguration> {
    return this.updateConfig(patch);
  }

  async resetConfig(): Promise<AIAgentConfiguration> {
    try {
      const res = await apiClient.post<{ config: any }>(
        "/api/v1/ai-agent/config/reset"
      );
      if (res?.config) {
        const normalized = normalizeConfig(res.config);
        inMemoryConfig = normalized;
        return normalized;
      }
    } catch {
      // Fallback
    }

    inMemoryConfig = JSON.parse(JSON.stringify(MOCK_AI_AGENT_CONFIG));
    return inMemoryConfig;
  }

  async resetConfiguration(): Promise<AIAgentConfiguration> {
    return this.resetConfig();
  }

  async toggleOutboundPause(): Promise<boolean> {
    const nextState = !inMemoryStatus.isOutboundPaused;
    const endpoint = nextState
      ? "/api/v1/ai-agent/pause"
      : "/api/v1/ai-agent/resume";

    try {
      await apiClient.post(endpoint);
    } catch {
      // Fallback
    }

    inMemoryStatus.isOutboundPaused = nextState;
    inMemoryStatus.status = nextState ? "paused" : "online";
    inMemoryStatus.statusLabel = nextState
      ? "Outbound Calling Paused by Operator"
      : "Voice Core Online & Ready";
    inMemoryStatus.engineStatus = nextState ? "paused" : "active";
    inMemoryStatus.activeLines = nextState ? 0 : 2;

    return nextState;
  }

  async toggleDialerStatus(): Promise<AIAgentStatusTelemetry> {
    await this.toggleOutboundPause();
    return this.getStatus();
  }

  async getActiveCalls(): Promise<ActiveCallTelemetry[]> {
    if (inMemoryStatus.isOutboundPaused) {
      return [];
    }

    try {
      const res = await apiClient.get<{ activeCalls: ActiveCallTelemetry[] }>(
        "/api/v1/ai-agent/active-calls"
      );
      if (Array.isArray(res?.activeCalls)) return res.activeCalls;
    } catch {
      // Fallback
    }

    return [];
  }

  async getActiveCall(callId?: string): Promise<ActiveCallTelemetry | null> {
    if (inMemoryStatus.isOutboundPaused) {
      return null;
    }

    try {
      const res = await apiClient.get<{ activeCall: ActiveCallTelemetry }>(
        "/api/v1/ai-agent/active-call"
      );
      if (res?.activeCall) return res.activeCall;
    } catch {
      // Fallback
    }

    const calls = await this.getActiveCalls();
    if (!calls.length) return null;
    if (callId) {
      const match = calls.find((c) => c.callId === callId);
      if (match) return match;
    }
    return calls[0];
  }

  async getRecentActivities(): Promise<AIAgentRecentActivity[]> {
    try {
      const res = await apiClient.get<{ activities: AIAgentRecentActivity[] }>(
        "/api/v1/ai-agent/activities"
      );
      if (Array.isArray(res?.activities)) return res.activities;
    } catch {
      // Fallback
    }

    return [];
  }

  async getRecentActivity(): Promise<AIAgentRecentActivity[]> {
    return this.getRecentActivities();
  }

  async getIntents(): Promise<BuyerIntentEvaluation[]> {
    return JSON.parse(JSON.stringify(MOCK_SAMPLE_INTENTS));
  }

  async getBuyerIntentEvaluations(): Promise<BuyerIntentEvaluation[]> {
    return this.getIntents();
  }

  async executeControlledTool(
    toolName: string,
    parameters: Record<string, any>,
    personaId = "spacia_sales_persona_alpha"
  ): Promise<any> {
    return apiClient.post("/api/v1/ai-tools/execute", {
      toolName,
      parameters,
      personaId,
    });
  }
}

export const aiAgentService = new AIAgentService();
