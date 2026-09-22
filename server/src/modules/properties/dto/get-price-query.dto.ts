import { IsOptional, IsString } from "class-validator";

export class GetPriceQueryDto {
  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  paymentPlan?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  providerId?: string;
}
