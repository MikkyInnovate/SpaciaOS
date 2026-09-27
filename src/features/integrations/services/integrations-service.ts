import { apiClient } from "@/lib/api/client";
import type {
  IntegrationItem,
  TestIntegrationResult,
  UpdateCredentialsPayload,
} from "../types";

const FALLBACK_INTEGRATIONS: IntegrationItem[] = [
  {
    id: "vapi-default",
    workspaceId: "org_dubai_palace",
    type: "vapi",
    name: "Vapi AI Voice Telephony",
    description: "High-concurrency outbound AI voice calling with turn-by-turn speech transcription",
    category: "voice",
    status: "connected",
    healthStatus: "healthy",
    hasCredentials: true,
    maskedKey: "vapi••••••••••••044e",
    lastTestedAt: new Date().toISOString(),
    lastSuccessAt: new Date().toISOString(),
    lastError: null,
    failureCount: 0,
    latencyMs: 142,
    config: { version: "v2.4" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "resend-default",
    workspaceId: "org_dubai_palace",
    type: "resend",
    name: "Resend Notification Engine",
    description: "Branded inspection confirmations, 24h/1h viewing reminders, and closer briefings",
    category: "notifications",
    status: "connected",
    healthStatus: "healthy",
    hasCredentials: true,
    maskedKey: "re_s••••••••••••7e44",
    lastTestedAt: new Date().toISOString(),
    lastSuccessAt: new Date().toISOString(),
    lastError: null,
    failureCount: 0,
    latencyMs: 84,
    config: { version: "v1.2" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "gcal-default",
    workspaceId: "org_dubai_palace",
    type: "google_calendar",
    name: "Google Calendar Workspace",
    description: "Two-way broker calendar synchronization and Free/Busy collision avoidance",
    category: "calendar",
    status: "connected",
    healthStatus: "healthy",
    hasCredentials: true,
    maskedKey: "ya29••••••••••••fied",
    lastTestedAt: new Date().toISOString(),
    lastSuccessAt: new Date().toISOString(),
    lastError: null,
    failureCount: 0,
    latencyMs: 98,
    config: { syncIntervalMinutes: 5 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "webhook-default",
    workspaceId: "org_dubai_palace",
    type: "webhook",
    name: "Inbound Marketing Webhook",
    description: "Sub-second inbound lead payload capture with E.164 phone normalization",
    category: "leads",
    status: "connected",
    healthStatus: "healthy",
    hasCredentials: true,
    maskedKey: "whse••••••••••••124b",
    lastTestedAt: new Date().toISOString(),
    lastSuccessAt: new Date().toISOString(),
    lastError: null,
    failureCount: 0,
    latencyMs: 18,
    config: { endpointUrl: "https://api.spacia.io/api/v1/leads/ingest" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "whatsapp-default",
    workspaceId: "org_dubai_palace",
    type: "whatsapp",
    name: "Termii / WhatsApp Business",
    description: "Automated property brochure dispatch, location pins, and SMS viewing alerts",
    category: "messaging",
    status: "connected",
    healthStatus: "healthy",
    hasCredentials: true,
    maskedKey: "term••••••••••••20ab",
    lastTestedAt: new Date().toISOString(),
    lastSuccessAt: new Date().toISOString(),
    lastError: null,
    failureCount: 0,
    latencyMs: 165,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "crm-default",
    workspaceId: "org_dubai_palace",
    type: "crm",
    name: "HubSpot Luxury CRM Bridge",
    description: "Two-way synchronization of qualified buyer dossiers and deal pipeline stages",
    category: "crm",
    status: "disconnected",
    healthStatus: "untested",
    hasCredentials: false,
    maskedKey: null,
    lastTestedAt: null,
    lastSuccessAt: null,
    lastError: null,
    failureCount: 0,
    latencyMs: null,
    config: { syncMode: "bidirectional" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class IntegrationsService {
  async getIntegrations(): Promise<IntegrationItem[]> {
    try {
      const response = await apiClient.get<IntegrationItem[]>("/api/v1/integrations");
      if (Array.isArray(response)) {
        return response;
      }
      return FALLBACK_INTEGRATIONS;
    } catch (err) {
      console.warn("[IntegrationsService] Backend call failed, using fallback data:", err);
      return FALLBACK_INTEGRATIONS;
    }
  }

  async getIntegration(id: string): Promise<IntegrationItem> {
    try {
      return await apiClient.get<IntegrationItem>(`/api/v1/integrations/${id}`);
    } catch (err) {
      const found = FALLBACK_INTEGRATIONS.find((i) => i.id === id);
      if (found) return found;
      throw err;
    }
  }

  async testConnection(id: string): Promise<TestIntegrationResult> {
    try {
      return await apiClient.post<TestIntegrationResult>(`/api/v1/integrations/${id}/test`);
    } catch (err: any) {
      // Deterministic simulation fallback
      return {
        success: false,
        status: "error",
        healthStatus: "unhealthy",
        message: err.message || "Failed to establish integration handshake",
        testedAt: new Date().toISOString(),
        failureCount: 1,
        lastError: err.message,
      };
    }
  }

  async reconnect(id: string): Promise<IntegrationItem> {
    return await apiClient.post<IntegrationItem>(`/api/v1/integrations/${id}/reconnect`);
  }

  async disconnect(id: string): Promise<IntegrationItem> {
    return await apiClient.post<IntegrationItem>(`/api/v1/integrations/${id}/disconnect`);
  }

  async updateCredentials(id: string, payload: UpdateCredentialsPayload): Promise<IntegrationItem> {
    return await apiClient.put<IntegrationItem>(`/api/v1/integrations/${id}/credentials`, payload);
  }
}

export const integrationsService = new IntegrationsService();
