import {
  IsString,
  IsOptional,
  IsObject,
  IsNotEmpty,
  IsIn,
} from "class-validator";

export type IntegrationType =
  | "vapi"
  | "resend"
  | "google_calendar"
  | "webhook"
  | "whatsapp"
  | "crm";

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
  @IsIn(["vapi", "resend", "google_calendar", "webhook", "whatsapp", "crm"])
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
  category: "voice" | "notifications" | "calendar" | "leads" | "messaging" | "crm";
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
