import { Injectable, Logger, Inject, Optional } from "@nestjs/common";
import { randomUUID } from "crypto";
import { eq, and, desc } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { ResendNotificationAdapter } from "./adapters/resend-notification.adapter";
import {
  NotificationResult,
  ProspectConfirmationData,
  ProspectReminderData,
  CompanyAppointmentData,
} from "./interfaces/notification.interface";
import {
  renderProspectBookingConfirmation,
  renderProspectViewingReminder,
  renderCompanyNewAppointmentAlert,
} from "./templates/email-templates";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // In-memory fallback cache when PostgreSQL is not accessible
  private readonly memoryNotifications = new Map<string, NotificationResult[]>();

  constructor(
    private readonly resendAdapter: ResendNotificationAdapter,
    @Optional() @Inject(DRIZZLE_DATABASE) private readonly db?: DrizzleDb
  ) {}

  /**
   * Helper to check UUID format
   */
  private isUuid(str?: string): boolean {
    return !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  /**
   * 1. Send Prospect Booking Confirmation & Viewing Details
   */
  async sendProspectBookingConfirmation(
    workspaceId: string,
    data: ProspectConfirmationData
  ): Promise<NotificationResult> {
    const { subject, html, text } = renderProspectBookingConfirmation(data);

    const dispatch = await this.resendAdapter.sendEmail({
      to: data.leadEmail,
      subject,
      html,
      text,
    });

    const notifId = randomUUID();
    const result: NotificationResult = {
      id: notifId,
      resendMessageId: dispatch.id,
      recipient: data.leadEmail,
      recipientType: "prospect",
      templateType: "prospect_booking_confirmation",
      subject,
      status: dispatch.status,
      sentAt: new Date().toISOString(),
      htmlBody: html,
    };

    await this.persistNotificationRecord(workspaceId, {
      id: notifId,
      workspaceId,
      type: "prospect_booking_confirmation",
      title: `Viewing Confirmed: ${data.propertyTitle}`,
      message: `Inspection confirmed with ${data.leadName} for ${data.scheduledStartAt}`,
      entityType: "appointment",
      entityId: this.isUuid(data.appointmentId) ? data.appointmentId : null,
      metadata: {
        recipient: data.leadEmail,
        recipientType: "prospect",
        templateType: "prospect_booking_confirmation",
        resendMessageId: dispatch.id,
        referenceCode: data.referenceCode,
        status: dispatch.status,
        propertyTitle: data.propertyTitle,
      },
    });

    this.cacheNotification(workspaceId, result);
    return result;
  }

  /**
   * 2. Send Prospect Viewing Reminder (24h or 1h before inspection)
   */
  async sendProspectViewingReminder(
    workspaceId: string,
    data: ProspectReminderData
  ): Promise<NotificationResult> {
    const { subject, html, text } = renderProspectViewingReminder(data);

    const dispatch = await this.resendAdapter.sendEmail({
      to: data.leadEmail,
      subject,
      html,
      text,
    });

    const notifId = randomUUID();
    const result: NotificationResult = {
      id: notifId,
      resendMessageId: dispatch.id,
      recipient: data.leadEmail,
      recipientType: "prospect",
      templateType: "prospect_viewing_reminder",
      subject,
      status: dispatch.status,
      sentAt: new Date().toISOString(),
      htmlBody: html,
    };

    await this.persistNotificationRecord(workspaceId, {
      id: notifId,
      workspaceId,
      type: "prospect_viewing_reminder",
      title: `Viewing Reminder (${data.reminderWindow}): ${data.propertyTitle}`,
      message: `Inspection reminder sent to ${data.leadName} for ${data.scheduledStartAt}`,
      entityType: "appointment",
      entityId: this.isUuid(data.appointmentId) ? data.appointmentId : null,
      metadata: {
        recipient: data.leadEmail,
        recipientType: "prospect",
        templateType: "prospect_viewing_reminder",
        reminderWindow: data.reminderWindow,
        resendMessageId: dispatch.id,
        referenceCode: data.referenceCode,
        status: dispatch.status,
      },
    });

    this.cacheNotification(workspaceId, result);
    return result;
  }

  /**
   * 3. Send Company / Internal Team Alert with Lead Context, Property Context & AI Summary
   */
  async sendCompanyNewAppointmentAlert(
    workspaceId: string,
    data: CompanyAppointmentData
  ): Promise<NotificationResult> {
    const { subject, html, text } = renderCompanyNewAppointmentAlert(data);

    const dispatch = await this.resendAdapter.sendEmail({
      to: data.companyRecipientEmail,
      subject,
      html,
      text,
    });

    const notifId = randomUUID();
    const result: NotificationResult = {
      id: notifId,
      resendMessageId: dispatch.id,
      recipient: data.companyRecipientEmail,
      recipientType: "company",
      templateType: "company_new_appointment",
      subject,
      status: dispatch.status,
      sentAt: new Date().toISOString(),
      htmlBody: html,
    };

    await this.persistNotificationRecord(workspaceId, {
      id: notifId,
      workspaceId,
      type: "company_new_appointment",
      title: `New Viewing Booked: ${data.leadContext.name} (${data.leadContext.score}/100)`,
      message: `Inspection scheduled for ${data.propertyContext.title} with closer ${data.meetingDetails.assignedCloser}`,
      entityType: "appointment",
      entityId: this.isUuid(data.appointmentId) ? data.appointmentId : null,
      metadata: {
        recipient: data.companyRecipientEmail,
        recipientType: "company",
        templateType: "company_new_appointment",
        resendMessageId: dispatch.id,
        referenceCode: data.referenceCode,
        status: dispatch.status,
        leadScore: data.leadContext.score,
        leadCategory: data.leadContext.scoreCategory,
        propertyTitle: data.propertyContext.title,
      },
    });

    this.cacheNotification(workspaceId, result);
    return result;
  }

  /**
   * 4. Unified Dispatcher: Dispatches BOTH Prospect Confirmation & Company Alert on Booking
   */
  async dispatchBookingNotifications(
    workspaceId: string,
    appointmentData: {
      appointmentId: string;
      referenceCode: string;
      leadId: string;
      leadName: string;
      leadEmail?: string;
      leadPhone?: string;
      propertyId: string;
      propertyTitle: string;
      propertyLocation?: string;
      propertyPrice?: string;
      startTime: string;
      endTime: string;
      meetingType?: string;
      meetingUrl?: string;
      assignedBrokerName?: string;
      notes?: string;
    }
  ): Promise<{ prospect: NotificationResult; company: NotificationResult }> {
    const prospectEmail = appointmentData.leadEmail || "prospect@spacia.io";
    const companyEmail = "closers@spacia.io";

    // 1. Dispatch Prospect Confirmation
    const prospectPayload: ProspectConfirmationData = {
      appointmentId: appointmentData.appointmentId,
      referenceCode: appointmentData.referenceCode,
      leadName: appointmentData.leadName,
      leadEmail: prospectEmail,
      leadPhone: appointmentData.leadPhone,
      propertyTitle: appointmentData.propertyTitle,
      propertyLocation: appointmentData.propertyLocation || "Lekki Phase 1, Lagos",
      propertyPrice: appointmentData.propertyPrice || "₦450,000,000",
      scheduledStartAt: appointmentData.startTime,
      scheduledEndAt: appointmentData.endTime,
      meetingType: (appointmentData.meetingType as any) || "in_person_viewing",
      meetingUrl: appointmentData.meetingUrl,
      gatePassCode: `SP-${Math.floor(1000 + Math.random() * 9000)}-VIP`,
      assignedBrokerName: appointmentData.assignedBrokerName || "Ade Admin (Senior Luxury Closer)",
      assignedBrokerPhone: "+234 803 555 0199",
      notes: appointmentData.notes,
    };

    const prospectResult = await this.sendProspectBookingConfirmation(workspaceId, prospectPayload);

    // 2. Dispatch Company Alert with Lead Context, Property Context & AI Summary
    const companyPayload: CompanyAppointmentData = {
      appointmentId: appointmentData.appointmentId,
      referenceCode: appointmentData.referenceCode,
      companyRecipientEmail: companyEmail,
      leadContext: {
        id: appointmentData.leadId,
        name: appointmentData.leadName,
        email: prospectEmail,
        phone: appointmentData.leadPhone || "+234 800 000 0000",
        score: 92,
        scoreCategory: "HOT",
        budget: "₦500M – ₦750M",
        timeline: "< 30 days (Urgent)",
        decisionReadiness: "Sole decision maker ready to transact",
        buyingCatalyst: "Relocating executive seeking immediate waterfront occupancy with verified liquidity.",
      },
      propertyContext: {
        id: appointmentData.propertyId,
        title: appointmentData.propertyTitle,
        location: appointmentData.propertyLocation || "Lekki Phase 1, Lagos",
        price: appointmentData.propertyPrice || "₦450,000,000",
        bedrooms: 5,
        bathrooms: 6,
        commission: "5% (₦22,500,000)",
      },
      aiSummary: {
        synthesis: "Prospect qualified autonomously across 5 BANT dimensions. Confirmed liquid funds and non-contingent timeline.",
        buyerSentiment: "bullish",
        keyRequirements: ["Governor's Consent title verified", "Private jetty access", "24/7 serviced power"],
        objectionsResolved: ["Service charge capped at ₦4.5M/year", "Deed of Assignment ready for legal audit"],
        recommendedClosingStrategy: "Present original title deeds during walkthrough and prepare luxury reservation deposit form.",
      },
      meetingDetails: {
        scheduledStartAt: appointmentData.startTime,
        scheduledEndAt: appointmentData.endTime,
        meetingType: appointmentData.meetingType || "in_person_viewing",
        meetingUrl: appointmentData.meetingUrl,
        assignedCloser: appointmentData.assignedBrokerName || "Ade Admin (Senior Luxury Closer)",
      },
    };

    const companyResult = await this.sendCompanyNewAppointmentAlert(workspaceId, companyPayload);

    this.logger.log(
      `[Notifications Dispatched] Appointment [${appointmentData.referenceCode}] -> Prospect [${prospectResult.resendMessageId}] & Company [${companyResult.resendMessageId}]`
    );

    return { prospect: prospectResult, company: companyResult };
  }

  /**
   * Retrieves notification history for an appointment or workspace
   */
  async getNotifications(
    workspaceId: string,
    filters?: { entityId?: string; entityType?: string; type?: string; limit?: number }
  ): Promise<any[]> {
    if (this.db) {
      try {
        let query = this.db
          .select()
          .from(schema.notifications)
          .where(eq(schema.notifications.workspaceId, workspaceId))
          .orderBy(desc(schema.notifications.createdAt));

        const records = await query;
        let filtered = records;
        if (filters?.entityId) {
          filtered = filtered.filter((r) => r.entityId === filters.entityId);
        }
        if (filters?.type) {
          filtered = filtered.filter((r) => r.type === filters.type);
        }
        return filtered.slice(0, filters?.limit || 50);
      } catch (err) {
        this.logger.warn(`Could not query notifications from DB: ${(err as Error).message}`);
      }
    }

    const cached = this.memoryNotifications.get(workspaceId) || [];
    return cached.slice(0, filters?.limit || 50);
  }

  /**
   * Helper to persist records into Neon PostgreSQL
   */
  private async persistNotificationRecord(
    workspaceId: string,
    record: {
      id: string;
      workspaceId: string;
      type: string;
      title: string;
      message: string;
      entityType: string;
      entityId: string | null;
      metadata: Record<string, any>;
    }
  ): Promise<void> {
    if (this.db) {
      try {
        await this.db.insert(schema.notifications).values({
          id: record.id,
          workspaceId: record.workspaceId,
          type: record.type,
          title: record.title,
          message: record.message,
          entityType: record.entityType,
          entityId: record.entityId,
          isRead: false,
          metadata: record.metadata,
        });
      } catch (err) {
        this.logger.warn(`[Notification DB] Could not persist notification to PostgreSQL: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Helper to cache notifications in memory
   */
  private cacheNotification(workspaceId: string, result: NotificationResult): void {
    const list = this.memoryNotifications.get(workspaceId) || [];
    list.unshift(result);
    this.memoryNotifications.set(workspaceId, list);
  }
}
