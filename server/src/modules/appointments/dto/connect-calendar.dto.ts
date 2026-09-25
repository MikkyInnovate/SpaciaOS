import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";
import { CalendarProviderType } from "../interfaces/appointment.interface";

export class ConnectCalendarDto {
  @IsString()
  @IsNotEmpty()
  provider!: CalendarProviderType;

  @IsString()
  @IsNotEmpty()
  accountEmail!: string;

  @IsString()
  @IsOptional()
  calendarName?: string;

  @IsBoolean()
  @IsOptional()
  enable?: boolean;
}
