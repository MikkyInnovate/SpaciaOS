import { Module } from "@nestjs/common";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import { CalendarAdapterService } from "./calendar-adapter.service";
import { NativeCalendarAdapter } from "./adapters/native-calendar.adapter";
import { GoogleCalendarAdapter } from "./adapters/google-calendar.adapter";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    CalendarAdapterService,
    NativeCalendarAdapter,
    GoogleCalendarAdapter,
  ],
  exports: [
    AppointmentsService,
    CalendarAdapterService,
    NativeCalendarAdapter,
    GoogleCalendarAdapter,
  ],
})
export class AppointmentsModule {}
