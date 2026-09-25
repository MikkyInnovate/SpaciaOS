import { Inject, Injectable, Logger, NotFoundException, ConflictException, BadRequestException, Optional } from "@nestjs/common";
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
import { eq, and, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  // In-memory appointments store scoped by workspace
  private appointments: Map<string, AppointmentEntity[]> = new Map();

  constructor(
    private readonly calendarAdapter: CalendarAdapterService,
    @Optional() @Inject(DRIZZLE_DATABASE) private readonly db?: DrizzleDb,
    @Optional() private readonly notificationsService?: NotificationsService
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
          const leadIds = [...new Set(dbAppointments.map((a) => a.leadId).filter((id): id is string => !!id))];
          const propertyIds = [...new Set(dbAppointments.map((a) => a.propertyId).filter((id): id is string => !!id))];
          const leadRows = leadIds.length
            ? await this.db
                .select({
                  id: schema.leads.id,
                  name: schema.leads.name,
                  phone: schema.leads.phone,
                })
                .from(schema.leads)
                .where(and(eq(schema.leads.workspaceId, wsId), inArray(schema.leads.id, leadIds)))
            : [];
          const propertyRows = propertyIds.length
            ? await this.db
                .select({
                  id: schema.properties.id,
                  title: schema.properties.title,
                  location: schema.properties.location,
                  formattedPrice: schema.properties.formattedPrice,
                })
                .from(schema.properties)
                .where(and(eq(schema.properties.workspaceId, wsId), inArray(schema.properties.id, propertyIds)))
            : [];
          const leadsById = new Map(leadRows.map((row) => [row.id, row]));
          const propertiesById = new Map(propertyRows.map((row) => [row.id, row]));

          const memList = this.appointments.get(wsId) || [];
          list = dbAppointments.map((a) => {
            const lead = a.leadId ? leadsById.get(a.leadId) : undefined;
            const property = a.propertyId ? propertiesById.get(a.propertyId) : undefined;
            const titleLead = a.title.includes("(") ? a.title.split("(")[1].replace(")", "").trim() : "";
            const titleProperty = a.title.includes("-") ? a.title.split("-")[0].trim() : a.title;
            const memMatch = memList.find((m) => m.id === a.id);
            const notesReason = a.notes?.startsWith("Cancellation Reason: ")
              ? a.notes.replace("Cancellation Reason: ", "")
              : undefined;

            return {
              id: a.id,
              workspaceId: a.workspaceId,
              leadId: a.leadId || "lead_unassigned",
              leadName: lead?.name || titleLead || "VIP Client",
              leadPhone: lead?.phone || "",
              propertyId: a.propertyId || "prop_default",
              propertyTitle: property?.title || titleProperty,
              propertyLocation: property?.location || a.location,
              propertyPrice: property?.formattedPrice || undefined,
              assignedBrokerId: a.assignedAgentId || "broker_ade",
              assignedBrokerName: "Ade Admin (Senior Luxury Closer)",
              startTime: a.scheduledStartAt.toISOString(),
              endTime: a.scheduledEndAt.toISOString(),
              status: (memMatch?.status || a.status) as any,
              meetingType: (a.type === "virtual_tour" ? "virtual_tour" : "in_person_viewing") as any,
              location: a.location,
              meetingUrl: a.meetingUrl || undefined,
              notes: a.notes || undefined,
              cancelledReason: memMatch?.cancelledReason || notesReason,
              referenceCode: `SP-BK-${a.id.slice(-6).toUpperCase()}`,
              calendarProvider: "google_calendar" as const,
              calendarEventId: `cal_evt_${a.id}`,
              createdAt: a.createdAt.toISOString(),
              updatedAt: a.updatedAt.toISOString(),
            };
          });
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
      const targetStatus = filters.status;
      if (targetStatus === "UPCOMING" || targetStatus === "upcoming") {
        const nowThreshold = Date.now() - 4 * 60 * 60 * 1000;
        list = list.filter(
          (a) =>
            (a.status === "scheduled" || a.status === "confirmed") &&
            new Date(a.endTime).getTime() >= nowThreshold
        );
      } else if (targetStatus === "rescheduled") {
        list = list.filter(
          (a) =>
            a.status === "rescheduled" ||
            (a.status === "cancelled" &&
              (a.cancelledReason?.toLowerCase().includes("resched") ||
                a.notes?.toLowerCase().includes("resched")))
        );
      } else {
        list = list.filter((a) => a.status === targetStatus);
      }
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

    if (startTime.getDay() === 0) {
      throw new BadRequestException(
        "Inspections are not scheduled on Sundays. Choose a Monday to Saturday slot."
      );
    }

    const identity = await this.resolveBookingIdentity(wsId, dto);
    const leadName = identity.leadName;
    const propertyTitle = identity.propertyTitle;

    // Inviolable double-booking collision lockout: check if slot overlaps an existing booking
    const existingAppointments = await this.getAppointments(tenant);
    const hasCollision = existingAppointments.some(
      (a) =>
        a.status !== "cancelled" &&
        (
          (dto.propertyId && a.propertyId === dto.propertyId) ||
          (propertyTitle && a.propertyTitle === propertyTitle) ||
          (dto.assignedBrokerId && a.assignedBrokerId === dto.assignedBrokerId)
        ) &&
        new Date(a.startTime).getTime() < endTime.getTime() &&
        new Date(a.endTime).getTime() > startTime.getTime()
    );
    if (hasCollision) {
      throw new ConflictException(
        "The selected viewing slot is already booked. Please choose another time slot."
      );
    }

    // Synchronize event with external calendar (Google Calendar)
    const calendarSync = await this.calendarAdapter.createCalendarEvent(wsId, {
      leadName,
      leadEmail: identity.leadEmail || "prospect@spacia.io",
      leadPhone: identity.leadPhone || "",
      propertyTitle,
      location: identity.location,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      meetingType: dto.meetingType || "in_person_viewing",
      notes: dto.notes,
    });

    const aptId = randomUUID();

    const referenceCode = `SP-BK-${aptId.slice(-6).toUpperCase()}`;
    const shareableSummary = `Property Inspection Confirmed for ${propertyTitle} on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Assigned Closer: Ade Admin. Ref: #${referenceCode}`;

    const isUuid = (str?: string) =>
      !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // Persist into Neon DB if available
    if (this.db) {
      try {
        await this.db.insert(schema.appointments).values({
          id: aptId,
          workspaceId: wsId,
          leadId: isUuid(dto.leadId) ? dto.leadId : null,
          propertyId: isUuid(dto.propertyId) ? dto.propertyId : null,
          title: `${propertyTitle} - Inspection (${leadName})`,
          type: (dto.meetingType === "virtual_tour" ? "virtual_tour" : "property_viewing") as any,
          status: "confirmed",
          scheduledStartAt: startTime,
          scheduledEndAt: endTime,
          location: identity.location,
          meetingUrl: calendarSync.meetingLink,
          notes: dto.notes,
        });
        this.logger.log(`[Appointment DB] Persisted appointment [${aptId}] in PostgreSQL`);

        await this.stopAgentAfterConfirmedViewing({
          workspaceId: wsId,
          leadId: dto.leadId,
          appointmentId: aptId,
          referenceCode,
          propertyTitle,
          startTime,
          actorId: dto.assignedBrokerId || tenant.userId || "broker",
        });

        // Emit transactional outbox domain event: BookingConfirmed
        try {
          await this.db.insert(schema.systemEvents).values({
            id: randomUUID(),
            workspaceId: wsId,
            eventName: "BookingConfirmed",
            aggregateType: "appointment",
            aggregateId: aptId,
            payload: {
              appointmentId: aptId,
              leadId: dto.leadId,
              leadName,
              propertyId: dto.propertyId,
              propertyTitle,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              meetingType: dto.meetingType || "in_person_viewing",
              calendarProvider: calendarSync.provider,
              calendarEventId: calendarSync.calendarEventId,
              meetingUrl: calendarSync.meetingLink,
              referenceCode,
            },
            status: "emitted",
          });
          this.logger.log(`[Event Outbox] Emitted 'BookingConfirmed' event for appointment [${aptId}]`);
        } catch (eventErr) {
          this.logger.warn(`Could not emit system event: ${(eventErr as Error).message}`);
        }

        // Compliance audit logging
        try {
          await this.db.insert(schema.auditLogs).values({
            id: randomUUID(),
            workspaceId: wsId,
            actorId: dto.assignedBrokerId || "broker_ade",
            actorType: "user",
            action: "appointment:confirmed",
            resource: "appointment",
            metadata: {
              appointmentId: aptId,
              propertyTitle,
              startTime: startTime.toISOString(),
              calendarProvider: calendarSync.provider,
              referenceCode,
            },
          });
          this.logger.log(`[Audit Log] Recorded 'appointment:confirmed' for [${aptId}]`);
        } catch (auditErr) {
          this.logger.warn(`Could not write audit log: ${(auditErr as Error).message}`);
        }
      } catch (err) {
        this.logger.warn(`Could not persist appointment to DB (isolated test workspace): ${(err as Error).message}`);
      }
    }

    // Dispatch Day 19 Booking Notifications (Prospect Confirmation + Company Alert)
    if (this.notificationsService) {
      try {
        await this.notificationsService.dispatchBookingNotifications(wsId, {
          appointmentId: aptId,
          referenceCode,
          leadId: dto.leadId,
          leadName,
          leadEmail: identity.leadEmail,
          leadPhone: identity.leadPhone,
          propertyId: dto.propertyId,
          propertyTitle,
          propertyLocation: identity.location,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          meetingType: dto.meetingType,
          meetingUrl: calendarSync.meetingLink,
          assignedBrokerName: "Ade Admin (Senior Luxury Closer)",
          notes: dto.notes,
        });
      } catch (notifErr) {
        this.logger.warn(`Failed to dispatch booking notifications: ${(notifErr as Error).message}`);
      }
    }

    const newApt: AppointmentEntity = {
      id: aptId,
      workspaceId: wsId,
      leadId: dto.leadId,
      leadName,
      leadPhone: identity.leadPhone,
      propertyId: dto.propertyId,
      propertyTitle,
      propertyLocation: identity.location,
      assignedBrokerId: dto.assignedBrokerId || "broker_ade",
      assignedBrokerName: "Ade Admin (Senior Luxury Closer)",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: "confirmed",
      meetingType: dto.meetingType || "in_person_viewing",
      location: identity.location,
      notes: dto.notes,
      calendarEventId: calendarSync.calendarEventId,
      calendarProvider: calendarSync.provider,
      meetingUrl: calendarSync.meetingLink,
      referenceCode,
      shareableSummary,
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
        const dbStatus = dto.status === "rescheduled" ? "cancelled" : (dto.status as any);
        await this.db
          .update(schema.appointments)
          .set({
            status: dbStatus,
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

    // Cancel on external calendar if status is cancelled or rescheduled
    if ((dto.status === "cancelled" || dto.status === "rescheduled") && appointment.calendarEventId) {
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

  private isUuid(value?: string): boolean {
    return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  /**
   * Prefer the booked lead and property records over placeholder names.
   */
  private async resolveBookingIdentity(
    workspaceId: string,
    dto: CreateAppointmentDto
  ): Promise<{ leadName: string; leadPhone: string; leadEmail?: string; propertyTitle: string; location: string }> {
    let leadName = dto.leadName?.trim() || "";
    let leadPhone = dto.leadPhone?.trim() || "";
    let leadEmail = dto.leadEmail?.trim() || undefined;
    let propertyTitle = dto.propertyTitle?.trim() || "";
    let location = dto.location?.trim() || "";

    if (this.db && this.isUuid(dto.leadId)) {
      const [lead] = await this.db
        .select({
          name: schema.leads.name,
          phone: schema.leads.phone,
          email: schema.leads.email,
          locationPreference: schema.leads.locationPreference,
        })
        .from(schema.leads)
        .where(and(eq(schema.leads.id, dto.leadId), eq(schema.leads.workspaceId, workspaceId)))
        .limit(1);
      if (lead) {
        leadName = leadName || lead.name;
        leadPhone = leadPhone || lead.phone;
        leadEmail = leadEmail || lead.email || undefined;
        location = location || lead.locationPreference || "";
      }
    }

    if (this.db && this.isUuid(dto.propertyId)) {
      const [property] = await this.db
        .select({
          title: schema.properties.title,
          location: schema.properties.location,
        })
        .from(schema.properties)
        .where(and(eq(schema.properties.id, dto.propertyId), eq(schema.properties.workspaceId, workspaceId)))
        .limit(1);
      if (property) {
        propertyTitle = propertyTitle || property.title;
        location = location || property.location;
      }
    }

    return {
      leadName: leadName || "Prospect",
      leadPhone,
      leadEmail,
      propertyTitle: propertyTitle || "Property inspection",
      location: location || "Lagos, Nigeria",
    };
  }

  /**
   * A confirmed viewing ends autonomous outreach for that lead.
   * Pending follow-ups are cancelled. Chat and outbound calls then refuse the lead.
   */
  private async stopAgentAfterConfirmedViewing(input: {
    workspaceId: string;
    leadId?: string;
    appointmentId: string;
    referenceCode: string;
    propertyTitle: string;
    startTime: Date;
    actorId: string;
  }): Promise<void> {
    if (!this.db || !this.isUuid(input.leadId)) return;

    try {
      const [lead] = await this.db
        .select({ id: schema.leads.id, status: schema.leads.status })
        .from(schema.leads)
        .where(and(eq(schema.leads.id, input.leadId!), eq(schema.leads.workspaceId, input.workspaceId)))
        .limit(1);

      if (!lead) return;

      const reason = `Viewing booked for ${input.propertyTitle}. Ref #${input.referenceCode}.`;

      await this.db
        .update(schema.leads)
        .set({
          status: "Viewing Booked",
          isAiStopped: true,
          aiStoppedReason: reason,
          nextAction: `Host the confirmed inspection. Ref #${input.referenceCode}.`,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.leads.id, input.leadId!), eq(schema.leads.workspaceId, input.workspaceId)));

      await this.db
        .update(schema.followUps)
        .set({
          status: "cancelled",
          notes: `Cancelled because a viewing was booked (${input.referenceCode}).`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.followUps.leadId, input.leadId!),
            eq(schema.followUps.workspaceId, input.workspaceId),
            eq(schema.followUps.status, "pending")
          )
        );

      await this.db.insert(schema.leadEvents).values({
        leadId: input.leadId!,
        workspaceId: input.workspaceId,
        type: "viewing_scheduled",
        title: "Viewing booked — AI stopped",
        description: `${reason} Previous status was '${lead.status}'.`,
        channel: "calendar",
        actorType: "system",
        actorId: input.actorId,
        metadata: {
          appointmentId: input.appointmentId,
          referenceCode: input.referenceCode,
          previousStatus: lead.status,
          startTime: input.startTime.toISOString(),
        },
      });

      this.logger.log(
        `[AI Stop] Lead [${input.leadId}] set to Viewing Booked after appointment [${input.appointmentId}].`
      );
    } catch (err) {
      this.logger.warn(
        `Viewing was saved but the lead could not be moved to Viewing Booked: ${(err as Error).message}`
      );
    }
  }
}
