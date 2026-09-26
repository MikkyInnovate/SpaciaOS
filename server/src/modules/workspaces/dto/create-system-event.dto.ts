import { IsString, IsNotEmpty, IsOptional, IsObject } from "class-validator";

export class CreateSystemEventDto {
  @IsString()
  @IsNotEmpty()
  eventName!: string;

  @IsString()
  @IsNotEmpty()
  aggregateType!: string;

  @IsString()
  @IsNotEmpty()
  aggregateId!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}
