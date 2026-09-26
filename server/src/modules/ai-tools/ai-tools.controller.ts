import {
  Controller,
  Get,
  Post,
  Body,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { AiToolExecutorService } from "./services/ai-tool-executor.service";
import { ExecuteToolDto } from "./dto/execute-tool.dto";
import { ToolExecutionContext } from "./interfaces/ai-tool.interface";

/**
 * AI TOOLS CONTROLLER (/api/v1/ai-tools)
 * 
 * REST interface for AI Tool discovery and execution.
 * 
 * Exposes:
 * - GET  /api/v1/ai-tools         -> List available tool definitions (JSON schema for LLMs)
 * - POST /api/v1/ai-tools/execute -> Execute a controlled tool within active workspace
 */
@Controller("ai-tools")
export class AiToolsController {
  constructor(private readonly executorService: AiToolExecutorService) {}

  /**
   * Returns standard OpenAI/Anthropic compatible JSON Schema tool descriptors.
   */
  @Get()
  @RequirePermissions("leads:read")
  async getTools() {
    const tools = this.executorService.getToolDefinitions();
    return {
      count: tools.length,
      tools,
    };
  }

  /**
   * Executes a controlled tool with all 5 mandatory pillars:
   * workspace isolation, inside-the-tool auth, parameter validation,
   * source verification, and audit logging.
   */
  @Post("execute")
  @RequirePermissions("leads:read")
  async executeTool(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: ExecuteToolDto,
    @Req() req: Request
  ) {
    const context: ToolExecutionContext = {
      workspaceId: tenant.workspaceId,
      actorId: tenant.userId,
      actorType: "ai_agent",
      role: tenant.role,
      permissions: tenant.permissions,
      ipAddress: req.ip,
      leadId: dto.leadId,
      conversationId: dto.conversationId,
      callId: dto.callId,
    };

    return this.executorService.executeTool(
      dto.toolName,
      dto.parameters || {},
      context
    );
  }
}
