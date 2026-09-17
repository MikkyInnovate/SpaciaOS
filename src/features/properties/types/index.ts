export type PropertyAvailability =
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
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  estateName?: string;
  location: string;
  city: string;
  state: string;
  propertyType: string;
  price: number;
  formattedPrice: string;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  parkingSpaces?: number;
  developmentStage?: string; // e.g. "Ready for Occupancy", "Off-Plan", "Completed"
  features: string[]; // Curated amenities (e.g. "24/7 Power", "Private Jetty", "Smart Automation")
  availability: PropertyAvailability;
  verification: PropertyVerificationDetails;
  commercialTerms?: PropertyCommercialTerms;
  images: string[];
  featuredImage: string;
  description: string;
  developerOrOwner?: string;
}

export interface PropertyFilterParams {
  search?: string;
  availability?: PropertyAvailability | "ALL";
  verificationStatus?: PropertyVerificationStatus | "ALL";
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
}
