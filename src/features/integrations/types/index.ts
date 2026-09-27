export type IntegrationType =
  | "webhook"
  | "google_calendar"
  | "property_db"
  | "crm"
  | "meta_ads"
  | string;

export type IntegrationStatus = "connected" | "disconnected" | "reconnecting" | "error";

export type IntegrationHealthStatus = "healthy" | "degraded" | "unhealthy" | "untested";

export type IntegrationCategory =
  | "all"
  | "leads"
  | "calendar"
  | "properties"
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
  webhook: [
    {
      key: "signingSecret",
      label: "Webhook HMAC Signing Secret",
      type: "password",
      placeholder: "whsec_••••••••••••••••",
      description: "Secret token used to verify SHA-256 HMAC incoming inquiry signatures.",
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
      description: "Secure OAuth client secret for broker calendar access.",
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
  property_db: [
    {
      key: "endpointUrl",
      label: "Property Database / PMS API Endpoint URL",
      type: "url",
      placeholder: "https://api.luxuryagency.com/v1/properties",
      description: "External API endpoint where your listings and availability live.",
      required: true,
    },
    {
      key: "apiKey",
      label: "Bearer Token / Secret API Key",
      type: "password",
      placeholder: "pms_sec_••••••••••••",
      description: "Secret key with read access to listings inventory.",
      required: true,
    },
    {
      key: "syncMode",
      label: "Sync Mode",
      type: "text",
      placeholder: "realtime",
      description: "Real-time on-demand query or cached interval.",
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
  meta_ads: [
    {
      key: "accessToken",
      label: "Meta System User Token",
      type: "password",
      placeholder: "EAAG••••••••••••",
      description: "Permanent system user token with leads_retrieval permission.",
      required: true,
    },
    {
      key: "pageId",
      label: "Facebook Page ID",
      type: "text",
      placeholder: "1092837465019",
      description: "Target Facebook Page running luxury real estate lead forms.",
    },
  ],
};
