import { IsOptional, IsString, IsIn, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import {
  leadStatusEnum,
  leadScoreCategoryEnum,
  leadManagementModeEnum,
} from "../../../database/schema/leads.schema";

export class GetLeadsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn([...leadStatusEnum.enumValues, "ALL"])
  status?: string;

  @IsOptional()
  @IsIn([...leadScoreCategoryEnum.enumValues, "ALL"])
  scoreCategory?: string;

  @IsOptional()
  @IsIn([...leadManagementModeEnum.enumValues, "ALL"])
  managementMode?: string;

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
}
