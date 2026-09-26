import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import {
  FollowUpChannel,
  FollowUpCadence,
  PriorityLevel,
} from "../../../database/schema/appointments.schema";

export class ScheduleFollowUpDto {
  @IsUUID()
  leadId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsEnum(["call", "whatsapp", "email"] as const)
  channel?: FollowUpChannel;

  @IsOptional()
  @IsEnum(["once", "daily", "weekly", "biweekly", "monthly"] as const)
  cadence?: FollowUpCadence;

  @IsOptional()
  @IsEnum(["immediate", "scheduled", "routine"] as const)
  priority?: PriorityLevel;

  @IsOptional()
  @IsString()
  directive?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number;
}
