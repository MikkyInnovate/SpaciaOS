import { IsNotEmpty, IsString, IsIn, IsOptional } from "class-validator";
import { leadStatusEnum } from "../../../database/schema/leads.schema";

export class UpdateLeadStatusDto {
  @IsNotEmpty()
  @IsIn(leadStatusEnum.enumValues)
  status!: (typeof leadStatusEnum.enumValues)[number];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  lossReason?: string;

  @IsOptional()
  @IsString()
  lossNotes?: string;
}
