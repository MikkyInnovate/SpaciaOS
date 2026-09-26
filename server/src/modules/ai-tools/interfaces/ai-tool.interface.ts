/**
 * CONTROLLED AI TOOLS CONTRACTS & INTERFACES
 * 
 * Foundational boundaries for autonomous AI sales personas.
 * Enforces five mandatory pillars on every tool execution:
 * 1. workspace_id isolation
 * 2. inside-the-tool authorization
 * 3. parameter validation & sanitization
 * 4. authoritative source verification (anti-hallucination)
 * 5. durable audit logging
 */

export interface ToolExecutionContext {
  workspaceId: string;
  actorId: string;
  actorType?: "ai_agent" | "user" | "system";
  role?: string;
  permissions?: string[];
  ipAddress?: string;
  conversationId?: string;
  callId?: string;
  leadId?: string;
  metadata?: Record<string, any>;
}

export type SourceConfidence = "authoritative" | "provisional" | "unverified";

export interface SourceVerification {
  source: string; // e.g. "mock_pms" | "spacia_native" | "neon_database_agents" | "spacia_policy_core"
  providerId: string;
  isVerified: boolean;
  verifiedAt: string;
  confidence: SourceConfidence;
  provenanceDetails?: string;
}

export interface ToolExecutionMetadata {
  durationMs: number;
  executedAt: string;
  workspaceId: string;
  actorId: string;
  auditLogId?: string;
}

export interface ToolResult<T = any> {
  success: boolean;
  toolName: string;
  data: T;
  sourceVerification: SourceVerification;
  executionMetadata: ToolExecutionMetadata;
  error?: string;
}

export interface JsonSchemaProperty {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  description?: string;
  enum?: string[];
  items?: JsonSchemaProperty;
  minimum?: number;
  maximum?: number;
  default?: any;
}

export interface ToolJsonSchema {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolJsonSchema;
}

export interface IAiTool<TParams = any, TResult = any> {
  readonly name: string;
  readonly description: string;
  readonly requiredPermission?: string;
  readonly definition: ToolDefinition;

  /**
   * Validates and sanitizes raw parameters. Throws an error on invalid schema.
   */
  validateParams(rawParams: unknown): TParams;

  /**
   * Executes the tool within the verified caller's workspace context.
   */
  execute(
    params: TParams,
    context: ToolExecutionContext
  ): Promise<{ data: TResult; sourceVerification: SourceVerification }>;
}
