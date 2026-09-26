import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  MaxLength,
  IsObject,
} from "class-validator";
import { Transform } from "class-transformer";

export class LeadIngestDto {
  @IsString()
  @IsNotEmpty({ message: "Lead name is required." })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty({ message: "Lead phone number is required." })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MaxLength(50)
  phone!: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  @IsEmail({}, { message: "Invalid email format." })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  propertySlug?: string;

  @IsOptional()
  @IsUUID("4", { message: "propertyId must be a valid UUIDv4." })
  propertyId?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  budget?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationPreference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientLeadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  workspaceSlug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  workspaceId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
