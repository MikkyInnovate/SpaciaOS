import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class GetSlotsDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsNotEmpty()
  date!: string; // YYYY-MM-DD or ISO string

  @IsString()
  @IsOptional()
  brokerId?: string;
}
