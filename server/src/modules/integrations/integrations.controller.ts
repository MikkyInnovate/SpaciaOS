import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
} from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { IntegrationsService } from "./integrations.service";
import {
  UpdateCredentialsDto,
  CreateIntegrationDto,
  IntegrationSanitizedDto,
  TestIntegrationResult,
} from "./dto/integrations.dto";

/**
 * CLIENT INTEGRATIONS CONTROLLER (/api/v1/integrations)
 *
 * REST API for Day 24 — Integration Management:
 * 1. Integration listing & status retrieval
 * 2. Credential storage & secure update (credentials strictly sanitized)
 * 3. Connection validation & health testing
 * 4. Failure recording & latency tracking
 * 5. Reconnection & disconnection state machine
 */
@Controller("integrations")
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @RequirePermissions("workspace:manage")
  async getIntegrations(
    @CurrentTenant() tenant: TenantContext
  ): Promise<IntegrationSanitizedDto[]> {
    return this.integrationsService.getIntegrations(tenant.workspaceId);
  }

  @Get(":id")
  @RequirePermissions("workspace:manage")
  async getIntegration(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string
  ): Promise<IntegrationSanitizedDto> {
    return this.integrationsService.getIntegration(tenant.workspaceId, id);
  }

  @Post()
  @RequirePermissions("workspace:manage")
  async createIntegration(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateIntegrationDto
  ): Promise<IntegrationSanitizedDto> {
    return this.integrationsService.createIntegration(tenant.workspaceId, dto);
  }

  @Put(":id/credentials")
  @RequirePermissions("workspace:manage")
  async updateCredentials(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string,
    @Body() dto: UpdateCredentialsDto
  ): Promise<IntegrationSanitizedDto> {
    return this.integrationsService.updateCredentials(tenant.workspaceId, id, dto);
  }

  @Post(":id/test")
  @RequirePermissions("workspace:manage")
  async testConnection(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string
  ): Promise<TestIntegrationResult> {
    return this.integrationsService.testConnection(tenant.workspaceId, id);
  }

  @Post(":id/reconnect")
  @RequirePermissions("workspace:manage")
  async reconnect(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string
  ): Promise<IntegrationSanitizedDto> {
    return this.integrationsService.reconnect(tenant.workspaceId, id);
  }

  @Post(":id/disconnect")
  @RequirePermissions("workspace:manage")
  async disconnect(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string
  ): Promise<IntegrationSanitizedDto> {
    return this.integrationsService.disconnect(tenant.workspaceId, id);
  }
}
