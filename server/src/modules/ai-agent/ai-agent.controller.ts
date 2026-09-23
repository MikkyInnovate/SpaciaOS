import {
  Controller,
  Post,
  Body,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { AiOrchestratorService } from "./services/ai-orchestrator.service";
import { ChatTurnDto } from "./dto/chat-turn.dto";

/**
 * AI AGENT CONTROLLER (/api/v1/ai-agent)
 * 
 * Thin REST gateway for controlled AI conversational interactions.
 * Guarantees authenticated workspace context, validates request schemas,
 * and delegates execution directly to AiOrchestratorService.
 */
@Controller("ai-agent")
export class AiAgentController {
  constructor(private readonly orchestrator: AiOrchestratorService) {}

  @Post("chat")
  @RequirePermissions("leads:read")
  async handleChatTurn(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: ChatTurnDto,
    @Req() req: Request
  ) {
    return this.orchestrator.handleChatTurn(tenant, dto, req.ip);
  }
}
