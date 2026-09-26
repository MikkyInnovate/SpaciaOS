import { IsString, IsNotEmpty, IsOptional, IsObject } from "class-validator";

export class ExecuteToolDto {
  @IsString()
  @IsNotEmpty({ message: "toolName is required." })
  toolName!: string;

  @IsOptional()
  @IsObject({ message: "parameters must be an object." })
  parameters?: Record<string, any>;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  personaId?: string;

  @IsOptional()
  @IsString()
  callId?: string;
}
