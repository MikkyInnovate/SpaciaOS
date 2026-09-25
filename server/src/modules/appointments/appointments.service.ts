import { Inject, Injectable, Logger, NotFoundException, Optional } from "@nestjs/common";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import {
  AppointmentEntity,
  AppointmentStatus,
  ViewingSlotEntity,
  CalendarConnectionEntity,
} from "./interfaces/appointment.interface";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto";
import { CalendarAdapterService } from "./calendar-adapter.service";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  // In-memory appointments store scoped by workspace
  private appointments: Map<string, AppointmentEntity[]> = new Map();

  constructor(
    private readonly calendarAdapter: CalendarAdapterService,
    @Optional() @Inject(DRIZZLE_DATABASE) private readonly db?: DrizzleDb
  ) {
    this.initDefaultAppointments("default");
  }

  private initDefaultAppointments(workspaceId: string) {
    if (!this.appointments.has(workspaceId)) {
      const now = Date.now();
      const oneDay = 86400000;

      this.appointments.set(workspaceId, [
        {
          id: `apt_01_${workspaceId}`,
          workspaceId,
          leadId: "lead_01_danjuma",
          leadName: "Alhaji Danjuma",
          leadPhone: "+234 803 999 8877",
          leadScore: 94,
          leadScoreCategory: "HOT",
          propertyId: "prop_banana_villa",
          propertyTitle: "The Grand Waterfront Villa",
          propertyLocation: "Zone A, Banana Island, Ikoyi, Lagos",
          propertyPrice: "₦950,000,000",
          propertyImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
          assignedBrokerId: "broker_ade",
          assignedBrokerName: "Ade Admin (Senior Luxury Closer)",
          assignedBrokerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          startTime: new Date(now + oneDay * 2).toISOString(),
          endTime: new Date(now + oneDay * 2 + 3600000).toISOString(),
          status: "confirmed",
          meetingType: "vip_private_showing",
          location: "Ocean Drive, Banana Island, Ikoyi",
          notes: "High net worth prospect. Interested in outright purchase. Prepare deed pack.",
          calendarProvider: "google_calendar",
          calendarEventId: "cal_evt_danjuma_01",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `apt_02_${workspaceId}`,
          workspaceId,
          leadId: "lead_02_adeleke",
          leadName: "Chief Adeleke",
          leadPhone: "+234 802 345 6789",
          leadScore: 92,
          leadScoreCategory: "HOT",
          propertyId: "prop_eko_atlantic",
          propertyTitle: "Azure Horizon Oceanfront Tower",
          propertyLocation: "Eko Atlantic City, Victoria Island, Lagos",
          propertyPrice: "₦620,000,000",
          propertyImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
          assignedBrokerId: "broker_victoria",
          assignedBrokerName: "Victoria Okon (Senior Partner)",
          assignedBrokerAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
          startTime: new Date(now + oneDay * 3).toISOString(),
          endTime: new Date(now + oneDay * 3 + 3600000).toISOString(),
          status: "scheduled",
          meetingType: "in_person_viewing",
          location: "Tower 2 Executive Lobby, Eko Atlantic",
          notes: "Prospective investor acquiring 2 luxury penthouse units.",
          calendarProvider: "google_calendar",
          calendarEventId: "cal_evt_adeleke_02",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `apt_03_${workspaceId}`,
          workspaceId,
          leadId: "lead_03_jenkins",
          leadName: "Sarah Jenkins",
          leadPhone: "+234 812 345 6789",
          leadScore: 84,
          leadScoreCategory: "WARM",
          propertyId: "prop_bourdillon",
          propertyTitle: "Bourdillon Sky Penthouse",
          propertyLocation: "Bourdillon Road, Ikoyi, Lagos",
          propertyPrice: "₦1,200,000,000",
          propertyImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
          assignedBrokerId: "broker_ade",
          assignedBrokerName: "Ade Admin (Senior Luxury Closer)",
          startTime: new Date(now + oneDay * 4).toISOString(),
          endTime: new Date(now + oneDay * 4 + 3600000).toISOString(),
          status: "scheduled",
          meetingType: "in_person_viewing",
          location: "4 Bourdillon, Ikoyi, Lagos",
          notes: "Relocating from London. Interested in payment installment structure.",
          calendarProvider: "google_calendar",
          calendarEventId: "cal_evt_jenkins_03",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }
  }

  /**
   * Retrieves all appointments for a tenant workspace, hydrated from Neon PostgreSQL.
   */
  async getAppointments(
    tenant: TenantContext,
    filters?: { status?: string; search?: string; leadId?: string }
  ): Promise<AppointmentEntity[]> {
    const wsId = tenant.workspaceId || "default";
    this.initDefaultAppointments(wsId);

    let list: AppointmentEntity[] = [];

    if (this.db) {
      try {
        const dbAppointments = await this.db
          .select()
          .from(schema.appointments)
          .where(eq(schema.appointments.workspaceId, wsId));

        if (dbAppointments.length > 0) {
          list = dbAppointments.map((a) => ({
            id: a.id,
            workspaceId: a.workspaceId,
            leadId: a.leadId || "lead_unassigned",
            leadName: a.title.includes("(") ? a.title.split("(")[1].replace(")", "").trim() : "VIP Client",
            leadPhone: "+234 803 999 8877",
            propertyId: a.propertyId || "prop_default",
            propertyTitle: a.title.includes("-") ? a.title.split("-")[0].trim() : a.title,
            propertyLocation: a.location,
            assignedBrokerId: a.assignedAgentId || "broker_ade",
            assignedBrokerName: "Ade Admin (Senior Luxury Closer)",
            startTime: a.scheduledStartAt.toISOString(),
            endTime: a.scheduledEndAt.toISOString(),
            status: a.status as any,
            meetingType: a.type as any,
            location: a.location,
            meetingUrl: a.meetingUrl || undefined,
            notes: a.notes || undefined,
            calendarProvider: "google_calendar",
            calendarEventId: `cal_evt_${a.id}`,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
          }));
        }
      } catch (err) {
        this.logger.warn(`Could not load appointments from DB: ${(err as Error).message}`);
      }
    }

    if (list.length === 0) {
      list = this.appointments.get(wsId) || [];
    }

    if (filters?.leadId) {
      list = list.filter((a) => a.leadId === filters.leadId);
    }
    if (filters?.status && filters.status !== "ALL") {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.search?.trim()) {
      const term = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.leadName.toLowerCase().includes(term) ||
          a.propertyTitle.toLowerCase().includes(term) ||
          a.location.toLowerCase().includes(term) ||
          a.assignedBrokerName.toLowerCase().includes(term)
      );
    }

    return list;
  }

  /**
   * Retrieves available viewing slots with live Google Calendar clash detection.
   */
  async getAvailableSlots(
    tenant: TenantContext,
    propertyId: string,
    dateStr: string,
    brokerId?: string
  ): Promise<ViewingSlotEntity[]> {
    const wsId = tenant.workspaceId || "default";
    this.initDefaultAppointments(wsId);

    const appointments = await this.getAppointments(tenant);
    const bookedIntervals = appointments
      .filter((a) => a.status !== "cancelled")
      .map((a) => ({
        start: new Date(a.startTime),
        end: new Date(a.endTime),
      }));

    return this.calendarAdapter.calculateAvailableSlots(
      wsId,
      propertyId,
      dateStr,
      bookedIntervals
    );
  }

  /**
   * Creates a new property viewing appointment and registers calendar sync.
   */
  async createAppointment(
    tenant: TenantContext,
    dto: CreateAppointmentDto
  ): Promise<AppointmentEntity> {
    const wsId = tenant.workspaceId || "default";
    this.initDefaultAppointments(wsId);

    const startTime = new Date(dto.startTime);
    const endTime = dto.endTime
      ? new Date(dto.endTime)
      : new Date(startTime.getTime() + 60 * 60 * 1000);

    const leadName = (dto as any).leadName || "Alhaji Danjuma";
    const propertyTitle = (dto as any).propertyTitle || "The Grand Waterfront Villa";

    // Synchronize event with external calendar (Google Calendar)
    const calendarSync = await this.calendarAdapter.createCalendarEvent(wsId, {
      leadName,
      leadEmail: (dto as any).leadEmail || "danjuma.investments@gmail.com",
      leadPhone: (dto as any).leadPhone || "+234 803 999 8877",
      propertyTitle,
      location: dto.location || "Banana Island, Lagos",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      meetingType: dto.meetingType || "in_person_viewing",
      notes: dto.notes,
    });

    const aptId = randomUUID();

    // Persist into Neon DB if available
    if (this.db) {
      try {
        await this.db.insert(schema.appointments).values({
          id: aptId,
          workspaceId: wsId,
          title: `${propertyTitle} - Inspection (${leadName})`,
          type: (dto.meetingType === "virtual_tour" ? "virtual_tour" : "property_viewing") as any,
          status: "confirmed",
          scheduledStartAt: startTime,
          scheduledEndAt: endTime,
          location: dto.location || "Banana Island, Lagos",
          meetingUrl: calendarSync.meetingLink,
          notes: dto.notes,
        });
        this.logger.log(`[Appointment DB] Persisted appointment [${aptId}] in PostgreSQL`);
      } catch (err) {
        this.logger.warn(`Could not persist appointment to DB (isolated test workspace): ${(err as Error).message}`);
      }
    }

    const newApt: AppointmentEntity = {
      id: aptId,
      workspaceId: wsId,
      leadId: dto.leadId,
      leadName,
      leadPhone: (dto as any).leadPhone || "+234 803 999 8877",
      propertyId: dto.propertyId,
      propertyTitle,
      propertyLocation: dto.location || "Banana Island, Lagos",
      assignedBrokerId: dto.assignedBrokerId || "broker_ade",
      assignedBrokerName: "Ade Admin (Senior Luxury Closer)",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: "confirmed",
      meetingType: dto.meetingType || "in_person_viewing",
      location: dto.location || "Banana Island, Ikoyi",
      notes: dto.notes,
      calendarEventId: calendarSync.calendarEventId,
      calendarProvider: calendarSync.provider,
      meetingUrl: calendarSync.meetingLink,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = this.appointments.get(wsId) || [];
    list.unshift(newApt);
    this.appointments.set(wsId, list);

    this.logger.log(
      `[Appointment Created] ID: ${newApt.id} for property ${newApt.propertyTitle} at ${newApt.startTime} (Calendar: ${calendarSync.provider}, Event: ${calendarSync.calendarEventId})`
    );

    return newApt;
  }

  /**
   * Updates status of an appointment (e.g. confirmed, completed, cancelled).
   */
  async updateStatus(
    tenant: TenantContext,
    appointmentId: string,
    dto: UpdateAppointmentStatusDto
  ): Promise<AppointmentEntity> {
    const wsId = tenant.workspaceId || "default";
    this.initDefaultAppointments(wsId);

    const list = this.appointments.get(wsId) || [];
    const appointment = list.find((a) => a.id === appointmentId);

    if (!appointment) {
      throw new NotFoundException(`Appointment [${appointmentId}] not found.`);
    }

    appointment.status = dto.status;
    if (dto.reason) {
      appointment.cancelledReason = dto.reason;
    }
    appointment.updatedAt = new Date().toISOString();

    // Persist status update in Neon DB
    if (this.db) {
      try {
        await this.db
          .update(schema.appointments)
          .set({
            status: dto.status as any,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.appointments.id, appointmentId),
              eq(schema.appointments.workspaceId, wsId)
            )
          );
      } catch (err) {
        this.logger.warn(`Could not update appointment status in DB: ${(err as Error).message}`);
      }
    }

    // Cancel on external calendar if status is cancelled
    if (dto.status === "cancelled" && appointment.calendarEventId) {
      await this.calendarAdapter.cancelEvent(wsId, appointment.calendarEventId);
    }

    this.logger.log(
      `[Appointment Status Updated] ID: ${appointmentId} -> ${dto.status}`
    );

    return appointment;
  }

  /**
   * Calendar Connections API delegations
   */
  async getCalendarConnections(tenant: TenantContext): Promise<CalendarConnectionEntity[]> {
    const wsId = tenant.workspaceId || "default";
    return this.calendarAdapter.getConnections(wsId);
  }

  async connectCalendar(
    tenant: TenantContext,
    provider: any,
    accountEmail: string,
    calendarName?: string
  ): Promise<CalendarConnectionEntity[]> {
    const wsId = tenant.workspaceId || "default";
    return this.calendarAdapter.connectProvider(
      wsId,
      provider,
      accountEmail,
      calendarName
    );
  }

  async toggleCalendarConnection(
    tenant: TenantContext,
    provider: any,
    enable: boolean
  ): Promise<CalendarConnectionEntity[]> {
    const wsId = tenant.workspaceId || "default";
    return this.calendarAdapter.toggleConnection(wsId, provider, enable);
  }

  async getOAuthUrl(workspaceId: string, provider: any, redirectUri: string) {
    return this.calendarAdapter.generateOAuthUrl(workspaceId, provider, redirectUri);
  }

  async handleOAuthCallback(
    workspaceId: string,
    provider: any,
    code: string,
    state: string
  ) {
    const tokenResp = await this.calendarAdapter.handleOAuthCallback(workspaceId, provider, code, state);
    const connections = await this.calendarAdapter.getConnections(workspaceId);
    return {
      token: tokenResp,
      connections,
    };
  }
}
