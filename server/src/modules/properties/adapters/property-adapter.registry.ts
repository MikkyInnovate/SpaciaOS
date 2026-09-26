import { Injectable, Inject, Logger } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";
import { IPropertyAdapter } from "./property-adapter.interface";
import { SpaciaNativePropertyAdapter } from "./spacia-native-property.adapter";
import { MockPmsPropertyAdapter } from "./mock-pms-property.adapter";

/**
 * PROPERTY ADAPTER REGISTRY & RESOLVER
 * 
 * Determines which IPropertyAdapter implementation applies to a workspace
 * based on the workspace's configured integration settings.
 * 
 * Default: SpaciaNativePropertyAdapter (Neon PostgreSQL / Drizzle).
 * Resolves external or mock adapters when configured in the workspace integrations.
 */
@Injectable()
export class PropertyAdapterRegistry {
  private readonly logger = new Logger(PropertyAdapterRegistry.name);
  private readonly adapters = new Map<string, IPropertyAdapter>();

  constructor(
    private readonly nativeAdapter: SpaciaNativePropertyAdapter,
    private readonly mockAdapter: MockPmsPropertyAdapter,
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb
  ) {
    this.registerAdapter(this.nativeAdapter);
    this.registerAdapter(this.mockAdapter);
  }

  /**
   * Registers an adapter in the in-memory registry.
   */
  registerAdapter(adapter: IPropertyAdapter) {
    this.adapters.set(adapter.providerId, adapter);
  }

  /**
   * Retrieves an adapter by explicit provider ID.
   */
  getAdapterById(providerId: string): IPropertyAdapter | undefined {
    return this.adapters.get(providerId);
  }

  /**
   * Resolves the authoritative IPropertyAdapter for a specific workspace.
   * 
   * Resolution Strategy:
   * 1. If an explicit preferredProviderId is specified (e.g. in testing), use it if registered.
   * 2. Inspect workspace's active integrations in the database. If an integration
   *    of type 'pms' with status 'active' exists, resolve the configured provider.
   * 3. Fallback: SpaciaNativePropertyAdapter.
   */
  async resolveAdapter(
    workspaceId: string,
    preferredProviderId?: string
  ): Promise<IPropertyAdapter> {
    if (preferredProviderId && this.adapters.has(preferredProviderId)) {
      return this.adapters.get(preferredProviderId)!;
    }

    try {
      const [pmsIntegration] = await this.db
        .select()
        .from(schema.integrations)
        .where(
          and(
            eq(schema.integrations.workspaceId, workspaceId),
            eq(schema.integrations.type, "pms"),
            eq(schema.integrations.status, "active")
          )
        );

      if (pmsIntegration) {
        const config = (pmsIntegration.config as any) || {};
        const providerName = config.provider || "mock_pms";
        if (this.adapters.has(providerName)) {
          return this.adapters.get(providerName)!;
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to resolve workspace integration for ${workspaceId}, falling back to native: ${err.message}`
      );
    }

    // Default authoritative provider
    return this.nativeAdapter;
  }
}
