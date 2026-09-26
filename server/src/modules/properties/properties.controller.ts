import {
  Controller,
  Get,
  Param,
  Query,
} from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { PropertiesService } from "./properties.service";
import { SearchPropertiesQueryDto } from "./dto/search-properties-query.dto";
import { CheckAvailabilityQueryDto } from "./dto/check-availability-query.dto";
import { GetPriceQueryDto } from "./dto/get-price-query.dto";

/**
 * PROPERTIES CONTROLLER (/api/v1/properties)
 * 
 * REST API exposing property search, normalized dossier lookup,
 * real-time availability check, pricing breakdown, and integration health.
 * 
 * Strictly tenant-isolated: all calls bound to authenticated TenantContext.
 */
@Controller("properties")
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  /**
   * Retrieves integration health and operational latency for the workspace's adapter.
   */
  @Get("health")
  @RequirePermissions("properties:read")
  async checkHealth(
    @CurrentTenant() tenant: TenantContext,
    @Query("providerId") providerId?: string
  ) {
    return this.propertiesService.checkHealth(tenant, providerId);
  }

  /**
   * Search properties matching criteria within the authenticated tenant.
   */
  @Get()
  @RequirePermissions("properties:read")
  async searchProperties(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: SearchPropertiesQueryDto
  ) {
    const { providerId, ...params } = query;
    return this.propertiesService.searchProperties(tenant, params, providerId);
  }

  /**
   * Retrieves normalized property details by ID.
   * Cross-tenant access returns 404 Not Found without leaking existence.
   */
  @Get(":id")
  @RequirePermissions("properties:read")
  async getPropertyById(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string,
    @Query("providerId") providerId?: string
  ) {
    return this.propertiesService.getPropertyById(tenant, id, providerId);
  }

  /**
   * Checks real-time availability for a property or sub-unit.
   */
  @Get(":id/availability")
  @RequirePermissions("properties:read")
  async checkAvailability(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string,
    @Query() query: CheckAvailabilityQueryDto
  ) {
    const { providerId, ...rest } = query;
    return this.propertiesService.checkAvailability(
      tenant,
      { propertyId: id, ...rest },
      providerId
    );
  }

  /**
   * Retrieves pricing and commercial terms breakdown for a property.
   */
  @Get(":id/price")
  @RequirePermissions("properties:read")
  async getPrice(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string,
    @Query() query: GetPriceQueryDto
  ) {
    const { providerId, ...rest } = query;
    return this.propertiesService.getPrice(
      tenant,
      { propertyId: id, ...rest },
      providerId
    );
  }
}
