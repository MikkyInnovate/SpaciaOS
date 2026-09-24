import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  MaxLength,
} from "class-validator";
import { HandoffTriggerCategory } from "../interfaces/follow-up.interface";

export class EscalateLeadDto {
  @IsEnum([
    "negotiation",
    "objection",
    "high_value",
    "manual_broker",
    "prospect_request",
    "max_attempts",
  ] as const)
  triggerCategory!: HandoffTriggerCategory;

  @IsString()
  @MaxLength(255)
  triggerReason!: string;

  @IsOptional()
  @IsString()
  synthesis?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyQuotes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unresolvedObjections?: string[];
}
