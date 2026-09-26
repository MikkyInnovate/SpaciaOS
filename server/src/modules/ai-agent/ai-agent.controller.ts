import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Body,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { AiOrchestratorService } from "./services/ai-orchestrator.service";
import { AiConfigService } from "./services/ai-config.service";
import { ChatTurnDto } from "./dto/chat-turn.dto";
import { UpdateAiConfigDto } from "./dto/ai-config.dto";

/**
 * AI AGENT CONTROLLER (/api/v1/ai-agent)
 * 
 * REST gateway for:
 * 1. AI conversational chat execution (/chat)
 * 2. Workspace-scoped AI configuration persistence & retrieval (/config)
 * 3. Configuration baseline reset (/config/reset)
 * 4. Engine status telemetry (/status)
 */
@Controller("ai-agent")
export class AiAgentController {
  constructor(
    private readonly orchestrator: AiOrchestratorService,
    private readonly aiConfigService: AiConfigService
  ) {}

  @Post("chat")
  @RequirePermissions("leads:read")
  async handleChatTurn(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: ChatTurnDto,
    @Req() req: Request
  ) {
    return this.orchestrator.handleChatTurn(tenant, dto, req.ip);
  }

  @Get("config")
  @RequirePermissions("leads:read")
  async getAiConfig(@CurrentTenant() tenant: TenantContext) {
    const config = await this.aiConfigService.getOrCreateConfig(tenant.workspaceId);
    return {
      success: true,
      config,
    };
  }

  @Put("config")
  @RequirePermissions("leads:write")
  async updateAiConfig(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdateAiConfigDto
  ) {
    const config = await this.aiConfigService.updateConfig(tenant.workspaceId, dto);
    return {
      success: true,
      config,
    };
  }

  @Patch("config")
  @RequirePermissions("leads:write")
  async patchAiConfig(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdateAiConfigDto
  ) {
    const config = await this.aiConfigService.updateConfig(tenant.workspaceId, dto);
    return {
      success: true,
      config,
    };
  }

  @Post("config/reset")
  @RequirePermissions("leads:write")
  async resetAiConfig(@CurrentTenant() tenant: TenantContext) {
    const config = await this.aiConfigService.resetConfig(tenant.workspaceId);
    return {
      success: true,
      config,
      message: "AI agent configuration reset to Spacia luxury baseline.",
    };
  }

  @Get("status")
  @RequirePermissions("leads:read")
  async getStatusTelemetry(@CurrentTenant() tenant: TenantContext) {
    const status = await this.aiConfigService.getTelemetry(tenant.workspaceId);
    return {
      success: true,
      status,
    };
  }

  @Get("activities")
  @RequirePermissions("leads:read")
  async getActivities(@CurrentTenant() tenant: TenantContext) {
    const activities = await this.aiConfigService.getRecentActivities(
      tenant.workspaceId
    );
    return {
      success: true,
      activities,
    };
  }

  @Get("active-calls")
  @RequirePermissions("leads:read")
  async getActiveCalls(@CurrentTenant() tenant: TenantContext) {
    const activeCalls = await this.aiConfigService.getActiveCalls(
      tenant.workspaceId
    );
    return {
      success: true,
      activeCalls,
    };
  }

  @Get("active-call")
  @RequirePermissions("leads:read")
  async getActiveCall(@CurrentTenant() tenant: TenantContext) {
    const activeCalls = await this.aiConfigService.getActiveCalls(
      tenant.workspaceId
    );
    return {
      success: true,
      activeCall: activeCalls.length > 0 ? activeCalls[0] : null,
    };
  }
}
