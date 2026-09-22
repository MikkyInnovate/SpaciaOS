import { IsOptional, IsString, IsNumber, Min, IsIn } from "class-validator";
import { Type } from "class-transformer";
import {
  PropertyAvailabilityStatus,
  PropertyVerificationStatus,
} from "../adapters/property-adapter.interface";

export class SearchPropertiesQueryDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxBedrooms?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsIn([
    "Available",
    "Under Offer",
    "Sold",
    "Reserved",
    "Unavailable",
    "Unknown",
    "ALL",
  ])
  availability?: PropertyAvailabilityStatus | "ALL";

  @IsOptional()
  @IsIn(["Verified", "Pending Verification", "Unverified", "ALL"])
  verificationStatus?: PropertyVerificationStatus | "ALL";

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsIn(["price_asc", "price_desc", "created_at", "relevance"])
  sortBy?: "price_asc" | "price_desc" | "created_at" | "relevance";

  @IsOptional()
  @IsString()
  providerId?: string;
}
