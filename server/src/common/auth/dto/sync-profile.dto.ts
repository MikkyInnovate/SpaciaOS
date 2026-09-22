import { IsString, IsOptional, IsIn } from "class-validator";

export class SyncProfileDto {
  @IsOptional()
  @IsString()
  workspaceName?: string;

  @IsOptional()
  @IsString()
  workspaceSlug?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsIn(["starter", "growth", "enterprise"])
  tier?: "starter" | "growth" | "enterprise";
}
