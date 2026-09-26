import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsUUID } from "class-validator";
import { Type } from "class-transformer";
import { callOutcomeEnum, callRecordingStateEnum } from "../../../database/schema/calls.schema";

export class GetCallsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsEnum(callOutcomeEnum.enumValues, {
    message: `outcome must be one of: ${callOutcomeEnum.enumValues.join(", ")}`,
  })
  outcome?: (typeof callOutcomeEnum.enumValues)[number];

  @IsOptional()
  @IsEnum(callRecordingStateEnum.enumValues, {
    message: `recordingState must be one of: ${callRecordingStateEnum.enumValues.join(", ")}`,
  })
  recordingState?: (typeof callRecordingStateEnum.enumValues)[number];

  @IsOptional()
  @IsUUID("4")
  leadId?: string;
}
