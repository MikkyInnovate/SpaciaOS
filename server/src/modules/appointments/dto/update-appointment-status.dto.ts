import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { AppointmentStatus } from "../interfaces/appointment.interface";

export class UpdateAppointmentStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: AppointmentStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}
