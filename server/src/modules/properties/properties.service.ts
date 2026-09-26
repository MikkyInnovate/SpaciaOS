import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { PropertyAdapterService } from "./property-adapter.service";
import {
  NormalizedProperty,
  PropertySearchParams,
  PropertySearchResult,
  AvailabilityQuery,
  AvailabilityResult,
  PriceQuery,
  PriceResult,
  IntegrationHealthStatus,
} from "./adapters/property-adapter.interface";

/**
 * PROPERTIES SERVICE (Application / Controller Layer)
 * 
 * Sits directly behind the REST controllers.
 * Enforces TenantContext boundaries:
 * 1. Derives workspaceId strictly from verified TenantContext.
 * 2. Formats not-found exceptions without leaking cross-tenant data.
 * 3. Delegates directly to the provider-agnostic PropertyAdapterService.
 */
@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly propertyAdapterService: PropertyAdapterService) {}

  /**
   * Retrieves a paginated list of properties matching search filters for the tenant.
   */
  async searchProperties(
    tenant: TenantContext,
    params: PropertySearchParams,
    providerId?: string
  ): Promise<PropertySearchResult> {
    return this.propertyAdapterService.searchProperties(
      tenant.workspaceId,
      params,
      providerId
    );
  }

  /**
   * Retrieves full property dossier. Throws NotFoundException if the property
   * does not exist OR belongs to another tenant.
   */
  async getPropertyById(
    tenant: TenantContext,
    propertyId: string,
    providerId?: string
  ): Promise<NormalizedProperty> {
    const property = await this.propertyAdapterService.getProperty(
      tenant.workspaceId,
      propertyId,
      providerId
    );

    if (!property) {
      throw new NotFoundException({
        code: "PROPERTY_NOT_FOUND",
        message: `Property with ID '${propertyId}' not found.`,
      });
    }

    return property;
  }

  /**
   * Checks real-time availability for a property or sub-unit.
   */
  async checkAvailability(
    tenant: TenantContext,
    query: AvailabilityQuery,
    providerId?: string
  ): Promise<AvailabilityResult> {
    return this.propertyAdapterService.checkAvailability(
      tenant.workspaceId,
      query,
      providerId
    );
  }

  /**
   * Retrieves normalized price calculation and payment options.
   */
  async getPrice(
    tenant: TenantContext,
    query: PriceQuery,
    providerId?: string
  ): Promise<PriceResult> {
    try {
      return await this.propertyAdapterService.getPrice(
        tenant.workspaceId,
        query,
        providerId
      );
    } catch (err: any) {
      throw new NotFoundException({
        code: "PROPERTY_NOT_FOUND",
        message: err.message || `Property '${query.propertyId}' pricing unavailable.`,
      });
    }
  }

  /**
   * Reports health and connectivity of the property integration.
   */
  async checkHealth(
    tenant: TenantContext,
    providerId?: string
  ): Promise<IntegrationHealthStatus> {
    return this.propertyAdapterService.checkHealth(
      tenant.workspaceId,
      providerId
    );
  }
}
