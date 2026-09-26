import { IsString, IsOptional, MaxLength } from "class-validator";

export class TakeoverLeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brokerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
