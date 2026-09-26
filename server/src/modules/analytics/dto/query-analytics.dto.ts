import { IsOptional, IsString, IsIn } from "class-validator";

export class QueryAnalyticsDto {
  @IsOptional()
  @IsString()
  @IsIn(["7d", "30d", "90d", "mtd", "all"])
  period?: "7d" | "30d" | "90d" | "mtd" | "all";

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
