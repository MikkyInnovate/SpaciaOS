import { IsNotEmpty, IsString, IsIn, IsOptional, IsObject } from "class-validator";
import { leadActivityTypeEnum } from "../../../database/schema/leads.schema";

export class CreateLeadActivityDto {
  @IsNotEmpty()
  @IsIn(leadActivityTypeEnum.enumValues)
  type!: (typeof leadActivityTypeEnum.enumValues)[number];

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
