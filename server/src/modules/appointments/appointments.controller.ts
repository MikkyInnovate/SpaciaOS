import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto";
import { ConnectCalendarDto } from "./dto/connect-calendar.dto";

@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * List all appointments for the current tenant workspace with filtering.
   */
  @Get()
  @RequirePermissions("leads:read")
  async getAppointments(
    @CurrentTenant() tenant: TenantContext,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("leadId") leadId?: string
  ) {
    const data = await this.appointmentsService.getAppointments(tenant, {
      status,
      search,
      leadId,
    });
    return { success: true, data };
  }

  /**
   * Get available viewing time slots with clash detection.
   */
  @Get("slots")
  @RequirePermissions("leads:read")
  async getAvailableSlots(
    @CurrentTenant() tenant: TenantContext,
    @Query("propertyId") propertyId: string,
    @Query("date") date: string,
    @Query("brokerId") brokerId?: string
  ) {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const data = await this.appointmentsService.getAvailableSlots(
      tenant,
      propertyId || "prop_default",
      targetDate,
      brokerId
    );
    return { success: true, data };
  }

  /**
   * Book a new property viewing appointment.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("leads:write")
  async createAppointment(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateAppointmentDto
  ) {
    const data = await this.appointmentsService.createAppointment(tenant, dto);
    return { success: true, data };
  }

  /**
   * Update appointment status (confirmed, completed, cancelled).
   */
  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("leads:write")
  async updateStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentStatusDto
  ) {
    const data = await this.appointmentsService.updateStatus(tenant, id, dto);
    return { success: true, data };
  }

  /**
   * Get active calendar connections.
   */
  @Get("calendars")
  @RequirePermissions("leads:read")
  async getCalendarConnections(@CurrentTenant() tenant: TenantContext) {
    const data = await this.appointmentsService.getCalendarConnections(tenant);
    return { success: true, data };
  }

  /**
   * Connect or update a calendar provider.
   */
  @Post("calendars/connect")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("leads:write")
  async connectCalendar(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: ConnectCalendarDto
  ) {
    const data = await this.appointmentsService.connectCalendar(
      tenant,
      dto.provider,
      dto.accountEmail,
      dto.calendarName
    );
    return { success: true, data };
  }

  /**
   * Generates real Google OAuth authorization URL.
   */
  @Get("calendars/auth-url")
  @RequirePermissions("leads:write")
  async getCalendarAuthUrl(
    @CurrentTenant() tenant: TenantContext,
    @Query("provider") provider: string = "google_calendar",
    @Query("redirectUri") redirectUri?: string
  ) {
    const wsId = tenant.workspaceId || "default";
    const targetRedirect = redirectUri || process.env.GOOGLE_CALENDAR_REDIRECT_URI || "http://localhost:3000/appointments";
    const data = await this.appointmentsService.getOAuthUrl(wsId, provider as any, targetRedirect);
    return { success: true, data };
  }

  /**
   * Exchanges real OAuth code from Google and links the account.
   */
  @Post("calendars/oauth-callback")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("leads:write")
  async handleOAuthCallback(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { code: string; state?: string; provider?: string }
  ) {
    const wsId = tenant.workspaceId || "default";
    const provider = (body.provider || "google_calendar") as any;
    const data = await this.appointmentsService.handleOAuthCallback(
      wsId,
      provider,
      body.code,
      body.state || `gcal_${wsId}`
    );
    return { success: true, data };
  }

  /**
   * Toggle or disconnect a calendar provider.
   */
  @Post("calendars/toggle")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("leads:write")
  async toggleCalendar(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { provider: string; enable: boolean }
  ) {
    const data = await this.appointmentsService.toggleCalendarConnection(
      tenant,
      body.provider as any,
      body.enable
    );
    return { success: true, data };
  }
}
