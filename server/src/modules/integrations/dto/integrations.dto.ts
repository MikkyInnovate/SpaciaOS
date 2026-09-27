import {
  IsString,
  IsOptional,
  IsObject,
  IsNotEmpty,
} from "class-validator";

export type IntegrationType =
  | "webhook"
  | "google_calendar"
  | "property_db"
  | "crm"
  | "meta_ads"
  | "vapi"
  | "resend"
  | "whatsapp"
  | string;

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "reconnecting";

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "untested";

export class UpdateCredentialsDto {
  @IsObject()
  @IsNotEmpty()
  credentials!: Record<string, any>;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @IsString()
  @IsOptional()
  name?: string;
}

export class CreateIntegrationDto {
  @IsString()
  @IsNotEmpty()
  type!: IntegrationType;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  @IsOptional()
  credentials?: Record<string, any>;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

export interface IntegrationSanitizedDto {
  id: string;
  workspaceId: string;
  type: IntegrationType;
  name: string;
  description: string;
  category: "leads" | "calendar" | "properties" | "crm" | "voice" | "notifications" | "messaging" | string;
  status: ConnectionStatus;
  healthStatus: HealthStatus;
  hasCredentials: boolean;
  maskedKey: string | null;
  lastTestedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  failureCount: number;
  latencyMs: number | null;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestIntegrationResult {
  success: boolean;
  status: ConnectionStatus;
  healthStatus: HealthStatus;
  latencyMs: number;
  message: string;
  testedAt: string;
  failureCount: number;
  lastError?: string | null;
}
