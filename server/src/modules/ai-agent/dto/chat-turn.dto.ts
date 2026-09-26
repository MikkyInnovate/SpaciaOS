import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsIn,
  IsObject,
} from "class-validator";

export class ProspectDetailsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class ChatTurnDto {
  @IsString()
  @IsNotEmpty({ message: "message is required." })
  message!: string;

  @IsOptional()
  @IsUUID("4", { message: "conversationId must be a valid UUID v4." })
  conversationId?: string;

  @IsOptional()
  @IsUUID("4", { message: "leadId must be a valid UUID v4." })
  leadId?: string;

  @IsOptional()
  @IsIn(["web_chat", "whatsapp", "voice_transcript"], {
    message: "channel must be one of: web_chat, whatsapp, voice_transcript.",
  })
  channel?: "web_chat" | "whatsapp" | "voice_transcript";

  @IsOptional()
  @IsObject()
  prospect?: ProspectDetailsDto;
}
