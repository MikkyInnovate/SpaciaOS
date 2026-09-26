import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";
import { EnvService } from "../../../config/env.service";
import { TenantContext } from "../../../common/tenant/tenant-context.interface";
import { AiToolExecutorService } from "../../ai-tools/services/ai-tool-executor.service";
import { ToolExecutionContext } from "../../ai-tools/interfaces/ai-tool.interface";
import { AI_PROVIDER_TOKEN } from "../providers/ai-provider.factory";
import {
  IAiProvider,
  ChatMessage,
  AiToolDefinition,
  ExecutedToolTrace,
  ChatTurnResult,
} from "../interfaces/ai-agent.interface";
import { PromptBuilderService } from "./prompt-builder.service";
import { ConversationMemoryService } from "./conversation-memory.service";
import { StructuredExtractionService } from "./structured-extraction.service";
import { ChatTurnDto } from "../dto/chat-turn.dto";
import { and, eq } from "drizzle-orm";

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: IAiProvider,
    private readonly toolExecutor: AiToolExecutorService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly conversationMemory: ConversationMemoryService,
    private readonly structuredExtraction: StructuredExtractionService,
    private readonly envService: EnvService,
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb
  ) {}

  /**
   * Conducts an autonomous, controlled conversation turn.
   */
  async handleChatTurn(
    tenant: TenantContext,
    dto: ChatTurnDto,
    ipAddress?: string
  ): Promise<ChatTurnResult> {
    const startTime = Date.now();

    if (!dto.message || !dto.message.trim()) {
      throw new BadRequestException("Message content cannot be empty.");
    }

    if (dto.leadId && this.isUuid(dto.leadId)) {
      const [lead] = await this.db
        .select({
          id: schema.leads.id,
          name: schema.leads.name,
          status: schema.leads.status,
          managementMode: schema.leads.managementMode,
          isAiStopped: schema.leads.isAiStopped,
        })
        .from(schema.leads)
        .where(
          and(
            eq(schema.leads.id, dto.leadId),
            eq(schema.leads.workspaceId, tenant.workspaceId)
          )
        )
        .limit(1);

      if (
        lead &&
        (lead.isAiStopped ||
          lead.status === "Viewing Booked" ||
          lead.managementMode === "human_managed" ||
          lead.managementMode === "lost" ||
          lead.managementMode === "nurture")
      ) {
        throw new BadRequestException({
          code: "LEAD_AI_STOPPED",
          message: `AI agent is stopped for '${lead.name}'. A broker owns this lead (${lead.status}).`,
        });
      }
    }

    // 1. Thread & Conversation Memory Resolution
    const conversation = await this.conversationMemory.getOrCreateConversation(
      tenant.workspaceId,
      dto.conversationId,
      dto.leadId,
      dto.prospect
    );

    // Save incoming user message
    const userMessageId = await this.conversationMemory.saveMessage(
      tenant.workspaceId,
      conversation.id,
      "prospect",
      dto.message.trim(),
      dto.prospect?.name || conversation.prospectName
    );

    // Load recent history window
    const recentHistory = await this.conversationMemory.loadRecentMessages(
      tenant.workspaceId,
      conversation.id,
      this.envService.aiContextWindowSize
    );

    // 2. Assemble System Prompt with Workspace & Lead Context
    const workspaceContext = await this.promptBuilder.resolveWorkspaceContext(
      tenant.workspaceId
    );
    const leadContext = await this.promptBuilder.resolveLeadContext(
      tenant.workspaceId,
      dto.leadId
    );
    const systemPrompt = this.promptBuilder.buildSystemPrompt(
      workspaceContext,
      leadContext,
      dto.channel || conversation.channel
    );

    // 3. Format Day 9 Tool Definitions for Provider Function Calling
    const toolDefs: AiToolDefinition[] = this.toolExecutor
      .getToolDefinitions()
      .map((td) => ({
        type: "function",
        function: {
          name: td.name,
          description: td.description,
          parameters: td.parameters,
        },
      }));

    // Active working dialogue
    const activeMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...recentHistory,
    ];

    // Ensure current turn message is represented if history query was prior to save
    if (!activeMessages.some((m) => m.role === "user" && m.content === dto.message.trim())) {
      activeMessages.push({ role: "user", content: dto.message.trim() });
    }

    // 4. Controlled Tool-Call Loop (Guarded by AI_MAX_TOOL_ITERATIONS)
    const maxIterations = this.envService.aiMaxToolIterations;
    let iteration = 0;
    const executedTraces: ExecutedToolTrace[] = [];
    let finalContent = "";
    let lastUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: 0,
      model: this.envService.openRouterDefaultModel,
      provider: this.aiProvider.providerName,
    };

    while (iteration <= maxIterations) {
      const completion = await this.aiProvider.chatCompletion(
        activeMessages,
        toolDefs,
        {
          workspaceId: tenant.workspaceId,
          actorId: tenant.userId,
          conversationId: conversation.id,
          leadId: dto.leadId,
        }
      );

      lastUsage = completion.usage;

      // Check if tool execution was requested by the AI model
      if (completion.toolCalls && completion.toolCalls.length > 0) {
        if (iteration >= maxIterations) {
          this.logger.warn(
            `[LOOP LIMIT EXCEEDED] Conversation [${conversation.id}] hit maximum tool iterations (${maxIterations}). Halting tool execution.`
          );
          finalContent =
            "I apologize, but I have reached our automated multi-step lookup limit. Let me connect you directly with a human broker to assist with these comprehensive details.";
          break;
        }

        // Add assistant tool_calls message to context
        activeMessages.push({
          role: "assistant",
          content: completion.content,
          tool_calls: completion.toolCalls,
        });

        // Execute each requested tool through Day 9 AiToolExecutorService
        for (const tc of completion.toolCalls) {
          let parsedParams: Record<string, any> = {};
          try {
            parsedParams =
              typeof tc.function.arguments === "string"
                ? JSON.parse(tc.function.arguments)
                : tc.function.arguments;
          } catch {
            parsedParams = {};
          }

          const toolContext: ToolExecutionContext = {
            workspaceId: tenant.workspaceId,
            actorId: tenant.userId,
            actorType: "ai_agent",
            role: tenant.role,
            permissions: tenant.permissions,
            ipAddress,
            conversationId: conversation.id,
            leadId: dto.leadId,
          };

          try {
            const toolResult = await this.toolExecutor.executeTool(
              tc.function.name,
              parsedParams,
              toolContext
            );

            executedTraces.push({
              toolName: tc.function.name,
              parameters: parsedParams,
              success: toolResult.success,
              data: toolResult.data,
              sourceVerification: toolResult.sourceVerification,
              durationMs: toolResult.executionMetadata.durationMs,
            });

            // Append verified tool result to conversation context
            activeMessages.push({
              role: "tool",
              name: tc.function.name,
              tool_call_id: tc.id,
              content: JSON.stringify(toolResult),
            });
          } catch (toolErr: any) {
            executedTraces.push({
              toolName: tc.function.name,
              parameters: parsedParams,
              success: false,
              data: null,
              durationMs: 0,
              error: toolErr.message,
            });

            activeMessages.push({
              role: "tool",
              name: tc.function.name,
              tool_call_id: tc.id,
              content: JSON.stringify({
                success: false,
                error: toolErr.message,
              }),
            });
          }
        }

        iteration++;
        continue; // Repeat cycle with tool output in context
      }

      // No tool calls: final conversational reply
      finalContent = completion.content || "";
      break;
    }

    // 5. Persist Outbound AI Message
    const assistantMessageId = await this.conversationMemory.saveMessage(
      tenant.workspaceId,
      conversation.id,
      "ai_agent",
      finalContent,
      "Spacia AI",
      {
        provider: this.aiProvider.providerName,
        model: lastUsage.model,
        toolsUsed: executedTraces.map((t) => t.toolName),
        latencyMs: Date.now() - startTime,
      }
    );

    // 6. Structured BANT & Qualification Extraction
    const qualification = await this.structuredExtraction.extractAndPersist(
      tenant.workspaceId,
      dto.leadId,
      activeMessages,
      undefined,
      executedTraces
    );

    // 7. Durable AI Usage Audit Logging
    await this.recordAiUsageAuditLog(
      tenant,
      conversation.id,
      dto.leadId,
      lastUsage,
      executedTraces,
      Date.now() - startTime,
      ipAddress
    );

    return {
      conversationId: conversation.id,
      userMessageId,
      assistantMessageId,
      reply: finalContent,
      toolsExecuted: executedTraces,
      qualification,
      usage: {
        ...lastUsage,
        latencyMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Persists AI execution audit event to PostgreSQL audit_logs table.
   */
  private async recordAiUsageAuditLog(
    tenant: TenantContext,
    conversationId: string,
    leadId: string | undefined,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number; model: string; provider: string },
    executedTools: ExecutedToolTrace[],
    durationMs: number,
    ipAddress?: string
  ): Promise<void> {
    try {
      await this.db.insert(schema.auditLogs).values({
        workspaceId: tenant.workspaceId,
        actorId: tenant.userId || "ai_sales_agent",
        actorType: "ai_agent",
        severity: "info",
        action: "ai_inference:chat",
        resource: "conversations",
        ipAddress,
        metadata: {
          conversationId,
          leadId,
          provider: usage.provider,
          model: usage.model,
          tokens: {
            prompt: usage.promptTokens,
            completion: usage.completionTokens,
            total: usage.totalTokens,
          },
          durationMs,
          toolsCount: executedTools.length,
          tools: executedTools.map((t) => ({
            toolName: t.toolName,
            success: t.success,
            durationMs: t.durationMs,
          })),
        },
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to record AI usage audit log in workspace [${tenant.workspaceId}]: ${err.message}`
      );
    }
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }
}
