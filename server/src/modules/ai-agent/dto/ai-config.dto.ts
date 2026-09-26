import {
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsOptional,
  IsIn,
  Matches,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";

export class BusinessHoursDto {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "start time must be in HH:mm 24-hour format (e.g., '08:00')",
  })
  start!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "end time must be in HH:mm 24-hour format (e.g., '19:00')",
  })
  end!: string;

  @IsString()
  timezone!: string;

  @IsArray()
  @IsString({ each: true })
  days!: string[];
}

export class EscalationRulesDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: "At least one escalation keyword is required" })
  humanTakeoverKeywords!: string[];

  @IsNumber()
  @Min(0, { message: "Budget threshold must be greater than or equal to 0" })
  budgetThresholdNaira!: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  maxNegativeSentiments!: number;

  @IsBoolean()
  requireHumanForContracts!: boolean;
}

export class FollowUpRulesDto {
  @IsNumber()
  @Min(1, { message: "Max attempts must be at least 1" })
  @Max(10, { message: "Max attempts cannot exceed 10" })
  maxAttempts!: number;

  @IsNumber()
  @Min(1, { message: "Interval must be at least 1 hour" })
  @Max(168, { message: "Interval cannot exceed 168 hours (7 days)" })
  intervalHours!: number;

  @IsNumber()
  @Min(1, { message: "Auto-archive window must be at least 1 day" })
  @Max(90, { message: "Auto-archive window cannot exceed 90 days" })
  autoArchiveUnresponsiveDays!: number;

  @IsArray()
  @IsString({ each: true })
  channelOrder!: string[];
}

export class UpdateAiConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  voice?: string;

  @IsOptional()
  @IsString()
  @IsIn(["luxury_professional", "consultative", "assertive", "warm_friendly"], {
    message: "Tone must be one of: luxury_professional, consultative, assertive, warm_friendly",
  })
  tone?: "luxury_professional" | "consultative" | "assertive" | "warm_friendly";

  @IsOptional()
  @IsString()
  @IsIn(["en-NG", "en-US", "en-GB", "pcm-NG"], {
    message: "Language must be one of: en-NG, en-US, en-GB, pcm-NG",
  })
  language?: "en-NG" | "en-US" | "en-GB" | "pcm-NG";

  @IsOptional()
  @IsString()
  greeting?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  businessHours?: BusinessHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EscalationRulesDto)
  escalationRules?: EscalationRulesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FollowUpRulesDto)
  followUpRules?: FollowUpRulesDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
