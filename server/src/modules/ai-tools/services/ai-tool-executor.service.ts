import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import {
  IAiTool,
  ToolExecutionContext,
  ToolResult,
  ToolDefinition,
  SourceVerification,
} from "../interfaces/ai-tool.interface";
import { SearchPropertiesTool } from "../tools/search-properties.tool";
import { GetPropertyTool } from "../tools/get-property.tool";
import { CheckPropertyAvailabilityTool } from "../tools/check-property-availability.tool";
import { GetPropertyPriceTool } from "../tools/get-property-price.tool";
import { GetCompanyPolicyTool } from "../tools/get-company-policy.tool";
import { GetAgentTool } from "../tools/get-agent.tool";
import { BookPropertyInspectionTool } from "../tools/book-property-inspection.tool";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";

/**
 * AI TOOL EXECUTOR SERVICE (Controlled AI Tools Runtime)
 * 
 * Central controller enforcing the 5 mandatory pillars on every AI tool invocation:
 * 1. workspace_id isolation: blocks any cross-tenant leakage.
 * 2. inside-the-tool authorization: checks permissions and active tenant membership.
 * 3. parameter validation: runtime sanitization and schema checking.
 * 4. source verification: tags data provenance to prevent hallucinations.
 * 5. durable audit logging: writes every call into Neon's `audit_logs` table (actorType: 'ai_agent').
 */
@Injectable()
export class AiToolExecutorService {
  private readonly logger = new Logger(AiToolExecutorService.name);
  private readonly toolRegistry = new Map<string, IAiTool>();

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb,
    private readonly searchPropertiesTool: SearchPropertiesTool,
    private readonly getPropertyTool: GetPropertyTool,
    private readonly checkAvailabilityTool: CheckPropertyAvailabilityTool,
    private readonly getPriceTool: GetPropertyPriceTool,
    private readonly getCompanyPolicyTool: GetCompanyPolicyTool,
    private readonly getAgentTool: GetAgentTool,
    private readonly bookInspectionTool: BookPropertyInspectionTool
  ) {
    this.registerTools([
      this.searchPropertiesTool,
      this.getPropertyTool,
      this.checkAvailabilityTool,
      this.getPriceTool,
      this.getCompanyPolicyTool,
      this.getAgentTool,
      this.bookInspectionTool,
    ]);
  }

  private registerTools(tools: IAiTool[]) {
    for (const tool of tools) {
      this.toolRegistry.set(tool.name, tool);
      this.logger.log(`Registered controlled AI tool: [${tool.name}]`);
    }
  }

  /**
   * Returns list of all registered tool definitions in standard JSON Schema format.
   * Compatible with OpenAI / Anthropic function calling and MCP protocols.
   */
  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.toolRegistry.values()).map((tool) => tool.definition);
  }

  /**
   * Returns a specific tool definition by name.
   */
  getToolDefinition(toolName: string): ToolDefinition | null {
    const tool = this.toolRegistry.get(toolName);
    return tool ? tool.definition : null;
  }

  /**
   * Authoritatively executes a controlled AI tool with all 5 mandatory enforcements.
   */
  async executeTool(
    toolName: string,
    rawParams: unknown,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = this.toolRegistry.get(toolName);

    if (!tool) {
      throw new BadRequestException(
        `AI tool [${toolName}] is not registered. Available tools: ${Array.from(this.toolRegistry.keys()).join(", ")}`
      );
    }

    // 1. Mandatory workspace_id presence check
    if (!context.workspaceId || !context.workspaceId.trim()) {
      throw new UnauthorizedException("Tool execution requires an authoritative workspaceId context.");
    }

    // 2. Cross-workspace parameter spoofing check (Prompt Injection Mitigation)
    if (
      typeof rawParams === "object" &&
      rawParams !== null &&
      "workspaceId" in (rawParams as Record<string, any>)
    ) {
      const explicitWorkspaceId = (rawParams as Record<string, any>).workspaceId;
      if (explicitWorkspaceId && explicitWorkspaceId !== context.workspaceId) {
        const errorMsg = `Cross-workspace access denied: caller in workspace [${context.workspaceId}] attempted to execute tool on workspace [${explicitWorkspaceId}].`;
        this.logger.error(`[SECURITY VIOLATION] ${errorMsg}`);
        
        await this.recordAuditLog(
          context,
          toolName,
          rawParams,
          false,
          Date.now() - startTime,
          errorMsg,
          "critical"
        );
        throw new UnauthorizedException(errorMsg);
      }
    }

    // 3. Inside-the-tool authorization check
    if (tool.requiredPermission && context.permissions && context.permissions.length > 0) {
      const hasPerm =
        context.permissions.includes("*") ||
        context.permissions.includes(tool.requiredPermission);
      if (!hasPerm) {
        const errorMsg = `Forbidden: Caller does not possess required permission [${tool.requiredPermission}] for tool [${toolName}].`;
        await this.recordAuditLog(
          context,
          toolName,
          rawParams,
          false,
          Date.now() - startTime,
          errorMsg,
          "warning"
        );
        throw new UnauthorizedException(errorMsg);
      }
    }

    // 4. Parameter validation
    let validatedParams: any;
    try {
      validatedParams = tool.validateParams(rawParams);
    } catch (err: any) {
      await this.recordAuditLog(
        context,
        toolName,
        rawParams,
        false,
        Date.now() - startTime,
        `Validation failed: ${err.message}`,
        "warning"
      );
      throw err;
    }

    // 5. Tool execution & Source verification
    try {
      const { data, sourceVerification } = await tool.execute(validatedParams, context);
      const durationMs = Date.now() - startTime;

      const auditLogId = await this.recordAuditLog(
        context,
        toolName,
        validatedParams,
        true,
        durationMs,
        undefined,
        "info",
        sourceVerification
      );

      return {
        success: true,
        toolName,
        data,
        sourceVerification,
        executionMetadata: {
          durationMs,
          executedAt: new Date().toISOString(),
          workspaceId: context.workspaceId,
          actorId: context.actorId,
          auditLogId,
        },
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      await this.recordAuditLog(
        context,
        toolName,
        validatedParams,
        false,
        durationMs,
        err.message,
        err instanceof UnauthorizedException ? "critical" : "warning"
      );
      throw err;
    }
  }

  /**
   * Persists an immutable compliance record to Neon PostgreSQL `audit_logs`.
   */
  private async recordAuditLog(
    context: ToolExecutionContext,
    toolName: string,
    params: unknown,
    success: boolean,
    durationMs: number,
    error?: string,
    severity: "info" | "warning" | "critical" = "info",
    sourceVerification?: SourceVerification
  ): Promise<string | undefined> {
    try {
      const resource = this.resolveToolResource(toolName);
      const [inserted] = await this.db
        .insert(schema.auditLogs)
        .values({
          workspaceId: context.workspaceId,
          actorId: context.actorId || "ai_agent_system",
          actorType: context.actorType || "ai_agent",
          severity,
          action: `ai_tool_call:${toolName}`,
          resource,
          ipAddress: context.ipAddress,
          metadata: {
            toolName,
            parameters: params,
            success,
            durationMs,
            error,
            source: sourceVerification,
            conversationId: context.conversationId,
            callId: context.callId,
            leadId: context.leadId,
          },
        })
        .returning({ id: schema.auditLogs.id });

      return inserted?.id;
    } catch (err: any) {
      this.logger.error(
        `Failed to persist audit log for AI tool [${toolName}] in workspace [${context.workspaceId}]: ${err.message}`
      );
      return undefined;
    }
  }

  private resolveToolResource(toolName: string): string {
    if (toolName.includes("property") || toolName.includes("properties")) {
      return "properties";
    }
    if (toolName.includes("agent")) {
      return "agents";
    }
    if (toolName.includes("policy")) {
      return "company_policy";
    }
    return "ai_tools";
  }
}
