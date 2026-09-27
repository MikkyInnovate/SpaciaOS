export type IntegrationType =
  | "vapi"
  | "resend"
  | "google_calendar"
  | "webhook"
  | "whatsapp"
  | "crm"
  | string;

export type IntegrationStatus = "connected" | "disconnected" | "reconnecting" | "error";

export type IntegrationHealthStatus = "healthy" | "degraded" | "unhealthy" | "untested";

export type IntegrationCategory =
  | "all"
  | "voice"
  | "notifications"
  | "calendar"
  | "leads"
  | "messaging"
  | "crm";

export interface IntegrationItem {
  id: string;
  workspaceId: string;
  type: IntegrationType;
  name: string;
  description: string;
  category: string;
  status: IntegrationStatus;
  healthStatus: IntegrationHealthStatus;
  hasCredentials: boolean;
  maskedKey: string | null;
  lastTestedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  failureCount: number;
  latencyMs: number | null;
  config?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TestIntegrationResult {
  success: boolean;
  status: IntegrationStatus;
  healthStatus: IntegrationHealthStatus;
  latencyMs?: number;
  message: string;
  testedAt: string;
  failureCount: number;
  lastError?: string | null;
}

export interface UpdateCredentialsPayload {
  credentials: Record<string, any>;
  config?: Record<string, any>;
}

export interface CredentialFieldDefinition {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "select";
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

export const INTEGRATION_FIELD_DEFINITIONS: Record<string, CredentialFieldDefinition[]> = {
  vapi: [
    {
      key: "apiKey",
      label: "Vapi Private API Key",
      type: "password",
      placeholder: "vapi_live_••••••••••••••••",
      description: "Found in your Vapi Dashboard under Account > API Keys.",
      required: true,
    },
    {
      key: "phoneNumberId",
      label: "Outbound Phone Number ID",
      type: "text",
      placeholder: "pn_9a12c84e1b",
      description: "Dedicated high-reputation luxury brokerage caller ID.",
    },
    {
      key: "assistantId",
      label: "Voice Assistant Agent ID",
      type: "text",
      placeholder: "asst_spacia_luxury_v2",
      description: "Configured conversational prompt model on Vapi.",
    },
  ],
  resend: [
    {
      key: "apiKey",
      label: "Resend API Key",
      type: "password",
      placeholder: "re_spacia_••••••••••••••••",
      description: "API Key with sending permissions from resend.com.",
      required: true,
    },
    {
      key: "fromEmail",
      label: "Verified Sender Email",
      type: "text",
      placeholder: "concierge@spacia.ai",
      description: "Must match a verified domain in your Resend account.",
    },
  ],
  google_calendar: [
    {
      key: "clientId",
      label: "Google Client ID",
      type: "text",
      placeholder: "••••••••••••.apps.googleusercontent.com",
      description: "OAuth 2.0 Web Client ID registered in Google Cloud Console.",
      required: true,
    },
    {
      key: "clientSecret",
      label: "Google Client Secret",
      type: "password",
      placeholder: "GOCSPX-••••••••••••••••",
      description: "Secure OAuth client secret.",
      required: true,
    },
    {
      key: "calendarId",
      label: "Primary Calendar ID",
      type: "text",
      placeholder: "primary or bookings@spacia.ai",
      description: "Target calendar where viewing events are booked.",
    },
  ],
  webhook: [
    {
      key: "signingSecret",
      label: "HMAC Signing Secret",
      type: "password",
      placeholder: "whsec_••••••••••••••••",
      description: "Secret token used to verify SHA-256 HMAC incoming signatures.",
      required: true,
    },
    {
      key: "endpointUrl",
      label: "Ingestion Endpoint URL",
      type: "url",
      placeholder: "https://api.spacia.ai/api/v1/leads/ingest",
      description: "Webhook destination configured in external marketing portals.",
    },
  ],
  whatsapp: [
    {
      key: "apiKey",
      label: "Termii / Meta API Key",
      type: "password",
      placeholder: "term_sec_••••••••••••••••",
      description: "Provider key for WhatsApp Business Cloud API & SMS.",
      required: true,
    },
    {
      key: "senderId",
      label: "Registered Sender ID",
      type: "text",
      placeholder: "SPACIA",
      description: "Approved alpha-numeric sender ID for high-deliverability alerts.",
    },
  ],
  crm: [
    {
      key: "accessToken",
      label: "HubSpot Private App Access Token",
      type: "password",
      placeholder: "pat-na1-••••••••••••••••",
      description: "Token with crm.objects.contacts and crm.objects.deals scopes.",
      required: true,
    },
    {
      key: "portalId",
      label: "HubSpot Hub ID / Portal ID",
      type: "text",
      placeholder: "14892019",
      description: "Your HubSpot enterprise portal number.",
    },
  ],
};
