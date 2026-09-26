import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ClerkAuthGuard } from "../../common/auth/clerk-auth.guard";
import { WorkspaceMemberGuard } from "../../common/auth/workspace-member.guard";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(ClerkAuthGuard, WorkspaceMemberGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentTenant() tenant: TenantContext,
    @Query("type") type?: string,
    @Query("limit") limit?: string
  ) {
    const wsId = tenant.workspaceId || "default";
    const data = await this.notificationsService.getNotifications(wsId, {
      type,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return { notifications: data, count: data.length };
  }

  @Get("appointments/:id")
  async getAppointmentNotifications(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") appointmentId: string
  ) {
    const wsId = tenant.workspaceId || "default";
    const data = await this.notificationsService.getNotifications(wsId, {
      entityId: appointmentId,
    });
    return { notifications: data, count: data.length };
  }

  @Post("appointments/:id/remind")
  async triggerReminder(
    @CurrentTenant() tenant: TenantContext,
    @Param("id") appointmentId: string,
    @Body()
    body?: {
      window?: "24h" | "1h";
      leadName?: string;
      leadEmail?: string;
      propertyTitle?: string;
      propertyLocation?: string;
      scheduledStartAt?: string;
    }
  ) {
    const wsId = tenant.workspaceId || "default";
    const window = body?.window || "24h";
    const cleanRef = appointmentId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
    const result = await this.notificationsService.sendProspectViewingReminder(wsId, {
      appointmentId,
      referenceCode: `SP-BK-${cleanRef || "VIP001"}`,
      leadName: body?.leadName || "VIP Client",
      leadEmail: body?.leadEmail || "client@spacia.io",
      propertyTitle: body?.propertyTitle || "Luxury Waterfront Villa",
      propertyLocation: body?.propertyLocation || "Banana Island, Ikoyi, Lagos",
      scheduledStartAt: body?.scheduledStartAt || new Date(Date.now() + 86400000).toISOString(),
      scheduledEndAt: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      meetingType: "in_person_viewing",
      assignedBrokerName: "Ade Admin (Senior Luxury Closer)",
      reminderWindow: window,
      gatePassCode: "BI-9942-VIP",
    });

    return {
      success: true,
      message: `Viewing reminder (${window}) dispatched successfully via Resend`,
      notification: result,
    };
  }
}
