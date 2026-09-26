import { Injectable, Logger } from "@nestjs/common";
import { PropertyAdapterRegistry } from "./adapters/property-adapter.registry";
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
 * PROPERTY ADAPTER SERVICE
 * 
 * Provider-agnostic domain service for AI agents and business logic.
 * Enforces workspace isolation by requiring verified workspaceId on every call.
 * Delegates to the appropriate IPropertyAdapter without exposing provider details.
 */
@Injectable()
export class PropertyAdapterService {
  private readonly logger = new Logger(PropertyAdapterService.name);

  constructor(private readonly registry: PropertyAdapterRegistry) {}

  /**
   * Search properties matching specific criteria within the workspace tenant.
   */
  async searchProperties(
    workspaceId: string,
    params: PropertySearchParams,
    preferredProviderId?: string
  ): Promise<PropertySearchResult> {
    if (!workspaceId) {
      throw new Error("workspaceId is required for searchProperties.");
    }
    const adapter = await this.registry.resolveAdapter(workspaceId, preferredProviderId);
    return adapter.searchProperties(workspaceId, params);
  }

  /**
   * Retrieve normalized detailed property dossier. Returns null if not found or cross-tenant.
   */
  async getProperty(
    workspaceId: string,
    propertyId: string,
    preferredProviderId?: string
  ): Promise<NormalizedProperty | null> {
    if (!workspaceId) {
      throw new Error("workspaceId is required for getProperty.");
    }
    const adapter = await this.registry.resolveAdapter(workspaceId, preferredProviderId);
    return adapter.getProperty(workspaceId, propertyId);
  }

  /**
   * Real-time availability check for property or sub-unit.
   */
  async checkAvailability(
    workspaceId: string,
    query: AvailabilityQuery,
    preferredProviderId?: string
  ): Promise<AvailabilityResult> {
    if (!workspaceId) {
      throw new Error("workspaceId is required for checkAvailability.");
    }
    const adapter = await this.registry.resolveAdapter(workspaceId, preferredProviderId);
    return adapter.checkAvailability(workspaceId, query);
  }

  /**
   * Detailed pricing and commercial terms breakdown.
   */
  async getPrice(
    workspaceId: string,
    query: PriceQuery,
    preferredProviderId?: string
  ): Promise<PriceResult> {
    if (!workspaceId) {
      throw new Error("workspaceId is required for getPrice.");
    }
    const adapter = await this.registry.resolveAdapter(workspaceId, preferredProviderId);
    return adapter.getPrice(workspaceId, query);
  }

  /**
   * Connection latency, capability report, and operational health.
   */
  async checkHealth(
    workspaceId: string,
    preferredProviderId?: string
  ): Promise<IntegrationHealthStatus> {
    if (!workspaceId) {
      throw new Error("workspaceId is required for checkHealth.");
    }
    const adapter = await this.registry.resolveAdapter(workspaceId, preferredProviderId);
    return adapter.checkHealth(workspaceId);
  }
}
