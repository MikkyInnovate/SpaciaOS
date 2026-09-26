import { Injectable, Logger } from "@nestjs/common";
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
} from "./property-adapter.interface";

/**
 * RAW EXTERNAL PMS DATA STRUCTURE (Simulation)
 * 
 * Illustrates an external system's disparate data structure (e.g. Yardi / Entrata / RealPage)
 * to demonstrate how the adapter isolates business logic from third-party schemas.
 */
interface RawPmsRecord {
  pmsId: string;
  tenantCode: string; // Maps to workspaceId
  listingName: string;
  slugRef: string;
  complexName?: string;
  streetAddress: string;
  metroArea: string;
  territory: string;
  category: string;
  currentRentOrPrice: number;
  currencyCode: string;
  bedCount?: number;
  bathCount?: number;
  areaSqMeters?: number;
  pmsState: "VACANT" | "APPLIED" | "LEASED" | "MAINTENANCE" | "RESERVED";
  photos: string[];
  bannerUrl: string;
  specs: string[];
  terms?: {
    deposit?: string;
    plans?: string[];
  };
}

/**
 * MOCK PMS REFERENCE ADAPTER (Test / Reference Only)
 * 
 * Purpose:
 * Proves provider-agnosticism by translating foreign PMS records into
 * Spacia's canonical domain contracts. Clearly isolated as reference infrastructure.
 */
@Injectable()
export class MockPmsPropertyAdapter implements IPropertyAdapter {
  private readonly logger = new Logger(MockPmsPropertyAdapter.name);

  readonly providerId = "mock_pms";
  readonly providerName = "Mock PMS Reference Adapter (Test Only)";

  // In-memory test store isolated by workspaceId
  private mockStore: RawPmsRecord[] = [];

  constructor() {
    this.seedDefaultTestFixtures();
  }

  private seedDefaultTestFixtures() {
    this.mockStore = [
      {
        pmsId: "pms_prop_101",
        tenantCode: "ws_mock_pms_test",
        listingName: "The Grand Waterfront Penthouse",
        slugRef: "grand-waterfront-penthouse",
        complexName: "Oceanic Crest",
        streetAddress: "12 Marina Road, Victoria Island",
        metroArea: "Victoria Island",
        territory: "Lagos State",
        category: "Penthouse",
        currentRentOrPrice: 450000000,
        currencyCode: "NGN",
        bedCount: 4,
        bathCount: 5,
        areaSqMeters: 620,
        pmsState: "VACANT",
        photos: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750"],
        bannerUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        specs: ["Private Helipad", "Panoramic Atlantic View", "Smart Automation"],
        terms: {
          deposit: "30%",
          plans: ["30% down, balance over 18 months", "Outright with 5% discount"],
        },
      },
      {
        pmsId: "pms_prop_102",
        tenantCode: "ws_mock_pms_test",
        listingName: "The Emerald Terrace Duplex",
        slugRef: "emerald-terrace-duplex",
        complexName: "Emerald Meadows",
        streetAddress: "4 Banana Island Boulevard",
        metroArea: "Ikoyi",
        territory: "Lagos State",
        category: "Terrace",
        currentRentOrPrice: 280000000,
        currencyCode: "NGN",
        bedCount: 3,
        bathCount: 4,
        areaSqMeters: 380,
        pmsState: "LEASED",
        photos: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
        bannerUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        specs: ["Private Jetty", "Solar Backup", "Fitted Miele Kitchen"],
        terms: {
          deposit: "25%",
        },
      },
    ];
  }

  /**
   * Helper to add a test fixture for verification tests.
   */
  addTestFixture(record: RawPmsRecord) {
    this.mockStore.push(record);
  }

  /**
   * Translates external PMS status to normalized Pacia availability status.
   */
  private mapPmsStatus(pmsState: RawPmsRecord["pmsState"]): PropertyAvailabilityStatus {
    switch (pmsState) {
      case "VACANT":
        return "Available";
      case "APPLIED":
        return "Under Offer";
      case "LEASED":
        return "Sold";
      case "RESERVED":
        return "Reserved";
      case "MAINTENANCE":
        return "Unavailable";
      default:
        return "Unknown";
    }
  }

  /**
   * Translates a raw PMS record into a normalized canonical property.
   */
  private toNormalizedProperty(record: RawPmsRecord): NormalizedProperty {
    const availability = this.mapPmsStatus(record.pmsState);

    return {
      id: record.pmsId,
      externalId: record.pmsId,
      workspaceId: record.tenantCode,
      source: this.providerId,
      title: record.listingName,
      slug: record.slugRef,
      estateName: record.complexName,
      location: record.streetAddress,
      city: record.metroArea,
      state: record.territory,
      country: "Nigeria",
      propertyType: record.category,
      price: record.currentRentOrPrice,
      formattedPrice: `₦ ${(record.currentRentOrPrice).toLocaleString()}`,
      currency: record.currencyCode,
      bedrooms: record.bedCount,
      bathrooms: record.bathCount,
      squareMeters: record.areaSqMeters,
      availability,
      verification: {
        status: "Verified",
        notes: "Verified via external PMS automated integration feed",
      },
      commercialTerms: {
        minimumDeposit: record.terms?.deposit,
        paymentPlanOptions: record.terms?.plans,
      },
      features: record.specs,
      images: record.photos,
      featuredImage: record.bannerUrl,
      description: `Imported via ${this.providerName}`,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async searchProperties(
    workspaceId: string,
    params: PropertySearchParams
  ): Promise<PropertySearchResult> {
    // Multi-tenant filter strictly applied
    let results = this.mockStore.filter((r) => r.tenantCode === workspaceId);

    if (params.query?.trim()) {
      const q = params.query.toLowerCase().trim();
      results = results.filter(
        (r) =>
          r.listingName.toLowerCase().includes(q) ||
          r.streetAddress.toLowerCase().includes(q) ||
          r.complexName?.toLowerCase().includes(q) ||
          r.specs.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (params.propertyType?.trim()) {
      results = results.filter(
        (r) => r.category.toLowerCase() === params.propertyType!.toLowerCase().trim()
      );
    }

    if (params.availability && params.availability !== "ALL") {
      results = results.filter((r) => this.mapPmsStatus(r.pmsState) === params.availability);
    }

    if (params.minPrice !== undefined) {
      results = results.filter((r) => r.currentRentOrPrice >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      results = results.filter((r) => r.currentRentOrPrice <= params.maxPrice!);
    }

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const paged = results.slice(offset, offset + limit);

    const items: NormalizedPropertySummary[] = paged.map((r) => {
      const norm = this.toNormalizedProperty(r);
      return {
        id: norm.id,
        workspaceId: norm.workspaceId,
        source: this.providerId,
        title: norm.title,
        slug: norm.slug,
        estateName: norm.estateName,
        location: norm.location,
        city: norm.city,
        state: norm.state,
        propertyType: norm.propertyType,
        price: norm.price,
        formattedPrice: norm.formattedPrice,
        currency: norm.currency,
        bedrooms: norm.bedrooms,
        bathrooms: norm.bathrooms,
        squareMeters: norm.squareMeters,
        availability: norm.availability,
        verificationStatus: norm.verification.status,
        featuredImage: norm.featuredImage,
        features: norm.features,
      };
    });

    return {
      items,
      total: results.length,
      page,
      limit,
      hasMore: offset + paged.length < results.length,
      provider: this.providerId,
    };
  }

  async getProperty(
    workspaceId: string,
    propertyId: string
  ): Promise<NormalizedProperty | null> {
    const record = this.mockStore.find(
      (r) => r.pmsId === propertyId && r.tenantCode === workspaceId
    );

    if (!record) {
      return null;
    }

    return this.toNormalizedProperty(record);
  }

  async checkAvailability(
    workspaceId: string,
    query: AvailabilityQuery
  ): Promise<AvailabilityResult> {
    const record = this.mockStore.find(
      (r) => r.pmsId === query.propertyId && r.tenantCode === workspaceId
    );

    if (!record) {
      return {
        propertyId: query.propertyId,
        unitId: query.unitId,
        status: "Unknown",
        isAvailable: false,
        checkedAt: new Date().toISOString(),
        provider: this.providerId,
      };
    }

    const status = this.mapPmsStatus(record.pmsState);
    return {
      propertyId: record.pmsId,
      unitId: query.unitId,
      status,
      isAvailable: status === "Available",
      checkedAt: new Date().toISOString(),
      provider: this.providerId,
    };
  }

  async getPrice(
    workspaceId: string,
    query: PriceQuery
  ): Promise<PriceResult> {
    const record = this.mockStore.find(
      (r) => r.pmsId === query.propertyId && r.tenantCode === workspaceId
    );

    if (!record) {
      throw new Error(`Property ${query.propertyId} not found in workspace.`);
    }

    return {
      propertyId: record.pmsId,
      unitId: query.unitId,
      currency: record.currencyCode,
      basePrice: record.currentRentOrPrice,
      formattedBasePrice: `₦ ${(record.currentRentOrPrice).toLocaleString()}`,
      estimatedTotal: record.currentRentOrPrice,
      formattedEstimatedTotal: `₦ ${(record.currentRentOrPrice).toLocaleString()}`,
      breakdown: {
        basePrice: record.currentRentOrPrice,
      },
      paymentOptions: record.terms?.plans?.map((p) => ({
        planName: p,
      })),
      provider: this.providerId,
    };
  }

  async checkHealth(workspaceId: string): Promise<IntegrationHealthStatus> {
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      status: "healthy",
      latencyMs: 1,
      isMock: true,
      message: "Mock reference adapter active for contract & multi-tenant testing",
      capabilities: {
        canSearch: true,
        canCheckAvailability: true,
        canGetRealtimePricing: true,
        canHoldUnit: false,
      },
    };
  }
}
