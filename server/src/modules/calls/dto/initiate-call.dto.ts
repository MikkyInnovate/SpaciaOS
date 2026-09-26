import { IsUUID, IsOptional, IsString, MaxLength } from "class-validator";

export class InitiateCallDto {
  @IsUUID("4", { message: "leadId must be a valid UUIDv4." })
  leadId!: string;

  @IsOptional()
  @IsUUID("4", { message: "propertyId must be a valid UUIDv4." })
  propertyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  persona?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customPrompt?: string;
}
