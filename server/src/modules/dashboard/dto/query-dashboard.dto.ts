import { IsOptional, IsString, IsIn } from "class-validator";

export class QueryDashboardDto {
  @IsOptional()
  @IsString()
  @IsIn(["today", "7d", "30d", "all"])
  range?: "today" | "7d" | "30d" | "all" = "today";

  @IsOptional()
  @IsString()
  propertyId?: string;
}
