/**
 * CONTROLLED AI AGENT INTERFACES
 * 
 * Defines standard chat message schemas, provider contracts,
 * tool calling abstractions, and telemetry models for Day 10.
 */

export interface AiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: AiToolCall[];
}

export interface AiToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface AiCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  workspaceId: string;
  actorId: string;
  conversationId?: string;
  leadId?: string;
}

export interface AiUsageTelemetry {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  model: string;
  provider: string;
  estimatedCostUsd?: number;
}

export interface AiCompletionResponse {
  content: string | null;
  toolCalls?: AiToolCall[];
  usage: AiUsageTelemetry;
  finishReason: "stop" | "tool_calls" | "length" | string;
}

export interface IAiProvider {
  readonly providerName: string;
  chatCompletion(
    messages: ChatMessage[],
    tools: AiToolDefinition[],
    options: AiCompletionOptions
  ): Promise<AiCompletionResponse>;
}

export interface ExecutedToolTrace {
  toolName: string;
  parameters: Record<string, any>;
  success: boolean;
  data: any;
  sourceVerification?: {
    source: string;
    providerId: string;
    isVerified: boolean;
    confidence: string;
    provenanceDetails?: string;
  };
  durationMs: number;
  error?: string;
}

export interface ChatTurnResult {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  reply: string;
  toolsExecuted: ExecutedToolTrace[];
  qualification?: {
    buyerIntent: string;
    decisionReadiness: string;
    confidenceScore: number;
    budgetDeclared?: string;
    timelineWindow?: string;
    motivation?: string;
  };
  usage: AiUsageTelemetry;
}
