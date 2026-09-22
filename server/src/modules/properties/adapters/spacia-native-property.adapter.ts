import { Injectable, Inject, Logger } from "@nestjs/common";
import { eq, and, or, ilike, desc, asc, count, inArray, gte, lte, SQL, sql } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";
import {
  IPropertyAdapter,
  NormalizedProperty,
  NormalizedPropertySummary,
  PropertySearchParams,
  PropertySearchResult,
  AvailabilityQuery,
  AvailabilityResult,
  PriceQuery,
  PriceResult,
  IntegrationHealthStatus,
  PropertyAvailabilityStatus,
  PropertyVerificationStatus,
  PropertyCommercialTerms,
} from "./property-adapter.interface";

@Injectable()
export class SpaciaNativePropertyAdapter implements IPropertyAdapter {
  private readonly logger = new Logger(SpaciaNativePropertyAdapter.name);

  readonly providerId = "spacia_native";
  readonly providerName = "Spacia Native Database";

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb
  ) {}

  /**
   * Searches properties strictly scoped to the specified workspace.
   */
  async searchProperties(
    workspaceId: string,
    params: PropertySearchParams
  ): Promise<PropertySearchResult> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    // Strict multi-tenant workspace filter is mandatory
    const conditions: SQL[] = [eq(schema.properties.workspaceId, workspaceId)];

    if (params.query?.trim()) {
      const q = `%${params.query.trim()}%`;
      conditions.push(
        or(
          ilike(schema.properties.title, q),
          ilike(schema.properties.location, q),
          ilike(schema.properties.estateName, q),
          ilike(schema.properties.propertyType, q)
        )!
      );
    }

    if (params.propertyType?.trim()) {
      conditions.push(eq(schema.properties.propertyType, params.propertyType.trim()));
    }

    if (params.city?.trim()) {
      conditions.push(ilike(schema.properties.city, params.city.trim()));
    }

    if (params.state?.trim()) {
      conditions.push(ilike(schema.properties.state, params.state.trim()));
    }

    if (params.availability && params.availability !== "ALL") {
      conditions.push(
        eq(
          schema.properties.availability,
          params.availability as (typeof schema.propertyAvailabilityEnum.enumValues)[number]
        )
      );
    }

    if (params.verificationStatus && params.verificationStatus !== "ALL") {
      conditions.push(
        eq(
          schema.properties.verificationStatus,
          params.verificationStatus as (typeof schema.propertyVerificationStatusEnum.enumValues)[number]
        )
      );
    }

    if (params.minPrice !== undefined && params.minPrice !== null) {
      conditions.push(gte(schema.properties.price, String(params.minPrice)));
    }

    if (params.maxPrice !== undefined && params.maxPrice !== null) {
      conditions.push(lte(schema.properties.price, String(params.maxPrice)));
    }

    if (params.minBedrooms !== undefined && params.minBedrooms !== null) {
      conditions.push(gte(schema.properties.bedrooms, params.minBedrooms));
    }

    if (params.maxBedrooms !== undefined && params.maxBedrooms !== null) {
      conditions.push(lte(schema.properties.bedrooms, params.maxBedrooms));
    }

    const whereClause = and(...conditions);

    // 1. Total count query
    const [countResult] = await this.db
      .select({ total: count() })
      .from(schema.properties)
      .where(whereClause);

    const total = Number(countResult?.total || 0);

    // 2. Determine sort order
    let orderByClause = desc(schema.properties.createdAt);
    if (params.sortBy === "price_asc") {
      orderByClause = asc(schema.properties.price);
    } else if (params.sortBy === "price_desc") {
      orderByClause = desc(schema.properties.price);
    }

    // 3. Paginated properties query
    const rows = await this.db
      .select()
      .from(schema.properties)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      return {
        items: [],
        total,
        page,
        limit,
        hasMore: false,
        provider: this.providerId,
      };
    }

    // 4. Batch query features for these properties strictly within the workspace
    const propertyIds = rows.map((r) => r.id);
    const features = await this.db
      .select({
        propertyId: schema.propertyFeatures.propertyId,
        feature: schema.propertyFeatures.feature,
      })
      .from(schema.propertyFeatures)
      .where(
        and(
          eq(schema.propertyFeatures.workspaceId, workspaceId),
          inArray(schema.propertyFeatures.propertyId, propertyIds)
        )
      );

    const featuresByProperty = new Map<string, string[]>();
    for (const f of features) {
      const list = featuresByProperty.get(f.propertyId) || [];
      list.push(f.feature);
      featuresByProperty.set(f.propertyId, list);
    }

    const items: NormalizedPropertySummary[] = rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      source: this.providerId,
      title: row.title,
      slug: row.slug,
      estateName: row.estateName || undefined,
      location: row.location,
      city: row.city,
      state: row.state,
      propertyType: row.propertyType,
      price: Number(row.price),
      formattedPrice: row.formattedPrice,
      currency: "NGN",
      bedrooms: row.bedrooms ?? undefined,
      bathrooms: row.bathrooms ?? undefined,
      squareMeters: row.squareMeters ?? undefined,
      availability: row.availability as PropertyAvailabilityStatus,
      verificationStatus: row.verificationStatus as PropertyVerificationStatus,
      featuredImage: row.featuredImage || (row.images?.[0] || ""),
      features: featuresByProperty.get(row.id) || [],
    }));

    return {
      items,
      total,
      page,
      limit,
      hasMore: offset + items.length < total,
      provider: this.providerId,
    };
  }

  /**
   * Retrieves a normalized property dossier by ID.
   * Strictly enforces workspace isolation: if the property exists but belongs to
   * another workspace, returns null without leaking its existence.
   */
  async getProperty(
    workspaceId: string,
    propertyId: string
  ): Promise<NormalizedProperty | null> {
    const [row] = await this.db
      .select()
      .from(schema.properties)
      .where(
        and(
          eq(schema.properties.id, propertyId),
          eq(schema.properties.workspaceId, workspaceId)
        )
      );

    if (!row) {
      return null;
    }

    const features = await this.db
      .select({
        feature: schema.propertyFeatures.feature,
      })
      .from(schema.propertyFeatures)
      .where(
        and(
          eq(schema.propertyFeatures.propertyId, propertyId),
          eq(schema.propertyFeatures.workspaceId, workspaceId)
        )
      );

    return {
      id: row.id,
      workspaceId: row.workspaceId,
      source: this.providerId,
      title: row.title,
      slug: row.slug,
      estateName: row.estateName || undefined,
      location: row.location,
      city: row.city,
      state: row.state,
      country: "Nigeria",
      propertyType: row.propertyType,
      price: Number(row.price),
      formattedPrice: row.formattedPrice,
      currency: "NGN",
      bedrooms: row.bedrooms ?? undefined,
      bathrooms: row.bathrooms ?? undefined,
      squareMeters: row.squareMeters ?? undefined,
      parkingSpaces: row.parkingSpaces ?? undefined,
      developmentStage: row.developmentStage ?? undefined,
      availability: row.availability as PropertyAvailabilityStatus,
      verification: {
        status: row.verificationStatus as PropertyVerificationStatus,
        titleDeedType: row.titleDeedType ?? undefined,
        registryNumber: row.registryNumber ?? undefined,
      },
      commercialTerms: (row.commercialTerms as PropertyCommercialTerms) || undefined,
      features: features.map((f) => f.feature),
      images: row.images || [],
      featuredImage: row.featuredImage || (row.images?.[0] || ""),
      description: row.description ?? undefined,
      developerOrOwner: row.developerOrOwner ?? undefined,
      lastSyncedAt: row.updatedAt?.toISOString(),
    };
  }

  /**
   * Checks availability using native database state.
   * Does NOT manufacture fake unit holds or fictitious availability.
   */
  async checkAvailability(
    workspaceId: string,
    query: AvailabilityQuery
  ): Promise<AvailabilityResult> {
    const [row] = await this.db
      .select({
        id: schema.properties.id,
        availability: schema.properties.availability,
        developmentStage: schema.properties.developmentStage,
        commercialTerms: schema.properties.commercialTerms,
      })
      .from(schema.properties)
      .where(
        and(
          eq(schema.properties.id, query.propertyId),
          eq(schema.properties.workspaceId, workspaceId)
        )
      );

    if (!row) {
      return {
        propertyId: query.propertyId,
        unitId: query.unitId,
        status: "Unknown",
        isAvailable: false,
        checkedAt: new Date().toISOString(),
        provider: this.providerId,
      };
    }

    const status = row.availability as PropertyAvailabilityStatus;
    const isAvailable = status === "Available";

    return {
      propertyId: row.id,
      unitId: query.unitId,
      status,
      isAvailable,
      restrictions: (row.commercialTerms as any)?.agencyFeeNotice
        ? [(row.commercialTerms as any).agencyFeeNotice]
        : undefined,
      checkedAt: new Date().toISOString(),
      provider: this.providerId,
    };
  }

  /**
   * Computes normalized pricing breakdown using actual stored commercial terms.
   * Does NOT fabricate arbitrary fake taxes or imaginary fees.
   */
  async getPrice(
    workspaceId: string,
    query: PriceQuery
  ): Promise<PriceResult> {
    const [row] = await this.db
      .select({
        id: schema.properties.id,
        price: schema.properties.price,
        formattedPrice: schema.properties.formattedPrice,
        commercialTerms: schema.properties.commercialTerms,
      })
      .from(schema.properties)
      .where(
        and(
          eq(schema.properties.id, query.propertyId),
          eq(schema.properties.workspaceId, workspaceId)
        )
      );

    if (!row) {
      throw new Error(`Property ${query.propertyId} not found in workspace.`);
    }

    const basePrice = Number(row.price);
    const terms = (row.commercialTerms as PropertyCommercialTerms) || {};

    let serviceChargeNum: number | undefined;
    if (terms.serviceCharge) {
      const parsed = parseFloat(terms.serviceCharge.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed) && parsed > 0) {
        serviceChargeNum = parsed;
      }
    }

    const estimatedTotal = basePrice + (serviceChargeNum || 0);

    const paymentOptions = terms.paymentPlanOptions?.map((plan) => ({
      planName: plan,
      description: `Payment option configured by property developer`,
    }));

    return {
      propertyId: row.id,
      unitId: query.unitId,
      currency: "NGN",
      basePrice,
      formattedBasePrice: row.formattedPrice,
      estimatedTotal,
      formattedEstimatedTotal:
        serviceChargeNum && serviceChargeNum > 0
          ? `₦ ${(estimatedTotal).toLocaleString()}`
          : row.formattedPrice,
      breakdown: {
        basePrice,
        serviceCharge: serviceChargeNum,
      },
      paymentOptions: paymentOptions && paymentOptions.length > 0 ? paymentOptions : undefined,
      provider: this.providerId,
    };
  }

  /**
   * Health check abstraction: executes an actual live database ping to verify
   * operational connectivity and latency.
   */
  async checkHealth(workspaceId: string): Promise<IntegrationHealthStatus> {
    const startTime = Date.now();
    try {
      // Real database connectivity check
      await this.db.execute(sql`SELECT 1`);
      const latencyMs = Date.now() - startTime;

      return {
        providerId: this.providerId,
        providerName: this.providerName,
        status: "healthy",
        latencyMs,
        message: "Spacia Native Database operational",
        capabilities: {
          canSearch: true,
          canCheckAvailability: true,
          canGetRealtimePricing: true,
          canHoldUnit: false,
        },
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      this.logger.error(`Database health check failed for workspace ${workspaceId}: ${err.message}`);
      return {
        providerId: this.providerId,
        providerName: this.providerName,
        status: "unreachable",
        latencyMs,
        message: "Database connection failed",
        error: err.message,
        capabilities: {
          canSearch: false,
          canCheckAvailability: false,
          canGetRealtimePricing: false,
          canHoldUnit: false,
        },
      };
    }
  }
}
