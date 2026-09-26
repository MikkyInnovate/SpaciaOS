/**
 * CANONICAL PROPERTY ADAPTER CONTRACT
 * 
 * Provider-agnostic domain contracts for property inventory, search,
 * real-time availability, pricing breakdown, and integration health.
 * 
 * Boundary Rule:
 * AI agents, business logic workflows, and API controllers consume these
 * normalized contracts. Provider-specific database rows or external PMS payloads
 * must never leak across this boundary.
 */

export type PropertyAvailabilityStatus =
  | "Available"
  | "Under Offer"
  | "Sold"
  | "Reserved"
  | "Unavailable"
  | "Unknown";

export type PropertyVerificationStatus =
  | "Verified"
  | "Pending Verification"
  | "Unverified";

export interface PropertyVerificationDetails {
  status: PropertyVerificationStatus;
  titleDeedType?: string; // e.g. "Governor's Consent", "Certificate of Occupancy (C of O)", "Gazette"
  verifiedAt?: string;
  verifiedBy?: string;
  registryNumber?: string;
  notes?: string;
}

export interface PropertyCommercialTerms {
  serviceCharge?: string;
  minimumDeposit?: string;
  paymentPlanOptions?: string[];
  agencyFeeNotice?: string;
  escrowRequired?: boolean;
}

export interface NormalizedUnit {
  unitId: string;
  unitNumber: string;
  floor?: number | string;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  price: number;
  formattedPrice: string;
  availability: PropertyAvailabilityStatus;
}

export interface NormalizedProperty {
  id: string; // Canonical property UUID or provider-scoped ID
  externalId?: string; // ID in source system (PMS/MLS) if synced
  workspaceId: string; // Multi-tenant isolation boundary
  source: string; // e.g. "spacia_native" | "mock_pms" | "yardi"
  title: string;
  slug: string;
  estateName?: string;
  location: string;
  city: string;
  state: string;
  country: string;
  propertyType: string; // e.g. "Apartment", "Duplex", "Penthouse", "Mansion", "Terrace"
  price: number;
  formattedPrice: string;
  currency: string; // e.g. "NGN", "USD"
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  parkingSpaces?: number;
  developmentStage?: string; // e.g. "Ready for Occupancy", "Off-Plan", "Completed"
  availability: PropertyAvailabilityStatus;
  verification: PropertyVerificationDetails;
  commercialTerms?: PropertyCommercialTerms;
  features: string[]; // Normalized amenities (e.g. "24/7 Power", "Private Jetty", "Smart Automation")
  images: string[];
  featuredImage: string;
  description?: string;
  developerOrOwner?: string;
  units?: NormalizedUnit[];
  metadata?: Record<string, any>;
  lastSyncedAt?: string;
}

export interface NormalizedPropertySummary {
  id: string;
  workspaceId: string;
  source: string;
  title: string;
  slug: string;
  estateName?: string;
  location: string;
  city: string;
  state: string;
  propertyType: string;
  price: number;
  formattedPrice: string;
  currency: string;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  availability: PropertyAvailabilityStatus;
  verificationStatus: PropertyVerificationStatus;
  featuredImage: string;
  features: string[];
}

export interface PropertySearchParams {
  query?: string; // Free-text keyword search across title, location, estate, features
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  city?: string;
  state?: string;
  availability?: PropertyAvailabilityStatus | "ALL";
  verificationStatus?: PropertyVerificationStatus | "ALL";
  features?: string[];
  page?: number;
  limit?: number;
  sortBy?: "price_asc" | "price_desc" | "created_at" | "relevance";
}

export interface PropertySearchResult {
  items: NormalizedPropertySummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  provider: string;
}

export interface AvailabilityQuery {
  propertyId: string;
  unitId?: string;
  targetDate?: string; // ISO 8601 date string
  durationMonths?: number;
}

export interface AvailabilityResult {
  propertyId: string;
  unitId?: string;
  status: PropertyAvailabilityStatus;
  isAvailable: boolean;
  availableUnitsCount?: number;
  availableFrom?: string; // ISO date if tenanted or off-plan
  holdExpiresAt?: string;
  restrictions?: string[];
  checkedAt: string;
  provider: string;
}

export interface FeeItem {
  name: string;
  amount: number;
  description?: string;
}

export interface PaymentOption {
  planName: string;
  depositPercentage?: number;
  depositAmount?: number;
  installmentCount?: number;
  installmentAmount?: number;
  tenorMonths?: number;
  description?: string;
}

export interface PriceBreakdown {
  basePrice: number;
  serviceCharge?: number;
  legalFee?: number;
  agencyFee?: number;
  stampDuty?: number;
  vat?: number;
  otherFees?: FeeItem[];
}

export interface PriceQuery {
  propertyId: string;
  unitId?: string;
  paymentPlan?: string;
  currency?: string;
}

export interface PriceResult {
  propertyId: string;
  unitId?: string;
  currency: string;
  basePrice: number;
  formattedBasePrice: string;
  estimatedTotal: number;
  formattedEstimatedTotal: string;
  breakdown: PriceBreakdown;
  paymentOptions?: PaymentOption[];
  priceExpiresAt?: string;
  provider: string;
}

export type HealthStatus = "healthy" | "degraded" | "unreachable" | "unconfigured";

export interface IntegrationHealthCapabilities {
  canSearch: boolean;
  canCheckAvailability: boolean;
  canGetRealtimePricing: boolean;
  canHoldUnit?: boolean;
}

export interface IntegrationHealthStatus {
  providerId: string;
  providerName: string;
  status: HealthStatus;
  latencyMs: number;
  lastSyncAt?: string;
  message: string;
  capabilities: IntegrationHealthCapabilities;
  isMock?: boolean;
  error?: string;
}

/**
 * Provider-agnostic adapter contract.
 * Every underlying property data source (Neon PostgreSQL, external PMS, reference mock)
 * must implement this contract.
 */
export interface IPropertyAdapter {
  readonly providerId: string;
  readonly providerName: string;

  /**
   * Search properties matching specific criteria within the workspace tenant.
   */
  searchProperties(
    workspaceId: string,
    params: PropertySearchParams
  ): Promise<PropertySearchResult>;

  /**
   * Retrieve normalized detailed property dossier. Returns null if not found or cross-tenant.
   */
  getProperty(
    workspaceId: string,
    propertyId: string
  ): Promise<NormalizedProperty | null>;

  /**
   * Real-time availability check for property or specific sub-unit.
   */
  checkAvailability(
    workspaceId: string,
    query: AvailabilityQuery
  ): Promise<AvailabilityResult>;

  /**
   * Detailed pricing and commercial terms breakdown.
   */
  getPrice(
    workspaceId: string,
    query: PriceQuery
  ): Promise<PriceResult>;

  /**
   * Connection latency, capability report, and operational health.
   */
  checkHealth(
    workspaceId: string
  ): Promise<IntegrationHealthStatus>;
}
