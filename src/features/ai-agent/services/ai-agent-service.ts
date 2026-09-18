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
  MOCK_ACTIVE_CALLS,
  MOCK_SAMPLE_INTENTS,
  MOCK_AGENT_RECENT_ACTIVITIES,
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
      const res = await apiClient.get<{ config: AIAgentConfiguration }>(
        "/api/v1/ai-agent/config"
      );
      if (res?.config) return res.config;
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 80));
    return JSON.parse(JSON.stringify(inMemoryConfig));
  }

  async getConfiguration(): Promise<AIAgentConfiguration> {
    return this.getConfig();
  }

  async updateConfig(
    patch: Partial<AIAgentConfiguration>
  ): Promise<AIAgentConfiguration> {
    try {
      const res = await apiClient.patch<{ config: AIAgentConfiguration }>(
        "/api/v1/ai-agent/config",
        patch
      );
      if (res?.config) {
        inMemoryConfig = res.config;
        return res.config;
      }
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 150));
    inMemoryConfig = {
      ...inMemoryConfig,
      ...patch,
      persona: { ...inMemoryConfig.persona, ...(patch.persona || {}) },
      qualificationGates: {
        ...inMemoryConfig.qualificationGates,
        ...(patch.qualificationGates || {}),
      },
      guardrails: {
        ...inMemoryConfig.guardrails,
        ...(patch.guardrails || {}),
      },
    };

    return JSON.parse(JSON.stringify(inMemoryConfig));
  }

  async updateConfiguration(
    patch: Partial<AIAgentConfiguration>
  ): Promise<AIAgentConfiguration> {
    return this.updateConfig(patch);
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
    return JSON.parse(JSON.stringify(MOCK_ACTIVE_CALLS));
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

    return JSON.parse(JSON.stringify(MOCK_AGENT_RECENT_ACTIVITIES));
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
}

export const aiAgentService = new AIAgentService();
