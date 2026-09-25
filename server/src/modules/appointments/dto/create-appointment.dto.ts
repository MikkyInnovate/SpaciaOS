import { IsString, IsNotEmpty, IsOptional, IsEnum, IsISO8601 } from "class-validator";
import { MeetingType } from "../interfaces/appointment.interface";

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  leadId!: string;

  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsOptional()
  assignedBrokerId?: string;

  @IsISO8601()
  @IsNotEmpty()
  startTime!: string;

  @IsISO8601()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  meetingType?: MeetingType;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  leadName?: string;

  @IsString()
  @IsOptional()
  leadPhone?: string;

  @IsString()
  @IsOptional()
  leadEmail?: string;

  @IsString()
  @IsOptional()
  propertyTitle?: string;
}
