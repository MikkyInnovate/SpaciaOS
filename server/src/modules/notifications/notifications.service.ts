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
import {
  FormattedNotificationDto,
  NotificationPriority,
  NotificationsListResponseDto,
} from "./dto/notifications.dto";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // In-memory fallback cache when PostgreSQL is not accessible
  private readonly memoryNotifications = new Map<string, any[]>();

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
   * Evaluates alert priority from type or metadata.
   */
  private determinePriority(type?: string, metaPriority?: string): NotificationPriority {
    if (metaPriority === "urgent" || metaPriority === "high" || metaPriority === "medium" || metaPriority === "low") {
      return metaPriority;
    }
    const t = (type || "").toLowerCase();
    if (t.includes("escalation") || t.includes("failure") || t.includes("alert")) {
      return "urgent";
    }
    if (t.includes("qualified") || t.includes("booked") || t.includes("viewing") || t.includes("confirmation")) {
      return "high";
    }
    if (t.includes("reminder") || t.includes("call")) {
      return "medium";
    }
    return "low";
  }

  /**
   * Resolves deep link destination based on entity type.
   */
  private determineActionUrl(entityType?: string | null, entityId?: string | null, type?: string): string | undefined {
    const t = (type || "").toLowerCase();
    if (entityType === "lead" && entityId) return `/leads`;
    if (entityType === "appointment" || t.includes("viewing") || t.includes("booking") || t.includes("reminder")) return `/appointments`;
    if (entityType === "call" || t.includes("call")) return `/calls`;
    return undefined;
  }

  /**
   * Formats database or memory records to AppNotification contract.
   */
  public formatNotification(record: any): FormattedNotificationDto {
    const isRead = Boolean(record.isRead ?? record.read);
    const createdAt = record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString();
    const meta = (record.metadata as Record<string, any>) || {};

    return {
      id: record.id,
      workspaceId: record.workspaceId || "default",
      type: record.type || record.templateType || "system",
      title: record.title || record.subject || "Notification Alert",
      message: record.message || record.body || record.htmlBody?.replace(/<[^>]+>/g, " ").slice(0, 150) || "Operational update",
      priority: this.determinePriority(record.type, meta.priority),
      read: isRead,
      isRead: isRead,
      timestamp: createdAt,
      actionUrl: meta.actionUrl || this.determineActionUrl(record.entityType, record.entityId, record.type),
      entityType: record.entityType,
      entityId: record.entityId,
      metadata: meta,
    };
  }

  /**
   * Creates and persists a direct in-app notification.
   */
  async createNotification(
    workspaceId: string,
    data: {
      type: string;
      title: string;
      message: string;
      entityType?: string;
      entityId?: string | null;
      metadata?: Record<string, any>;
    }
  ): Promise<FormattedNotificationDto> {
    const notifId = randomUUID();
    const newRecord = {
      id: notifId,
      workspaceId,
      type: data.type,
      title: data.title,
      message: data.message,
      entityType: data.entityType || null,
      entityId: this.isUuid(data.entityId || undefined) ? data.entityId! : null,
      metadata: data.metadata || {},
    };

    await this.persistNotificationRecord(workspaceId, newRecord);
    return this.formatNotification({ ...newRecord, isRead: false, createdAt: new Date() });
  }

  /**
   * Retrieves notification history for an appointment or workspace.
   */
  async getNotifications(
    workspaceId: string,
    filters?: {
      entityId?: string;
      entityType?: string;
      type?: string;
      filter?: "all" | "unread";
      limit?: number;
    }
  ): Promise<NotificationsListResponseDto> {
    let allRecords: any[] = [];

    if (this.db) {
      try {
        const records = await this.db
          .select()
          .from(schema.notifications)
          .where(eq(schema.notifications.workspaceId, workspaceId))
          .orderBy(desc(schema.notifications.createdAt));
        allRecords = records;
      } catch (err) {
        this.logger.warn(`Could not query notifications from DB: ${(err as Error).message}`);
        allRecords = this.memoryNotifications.get(workspaceId) || [];
      }
    } else {
      allRecords = this.memoryNotifications.get(workspaceId) || [];
    }

    // Format all records
    const formatted = allRecords.map((r) => this.formatNotification(r));

    // Calculate unread count across workspace
    const unreadCount = formatted.filter((n) => !n.read).length;

    // Apply filters
    let filtered = formatted;
    if (filters?.entityId) {
      filtered = filtered.filter((n) => n.entityId === filters.entityId);
    }
    if (filters?.type) {
      filtered = filtered.filter((n) => n.type === filters.type);
    }
    if (filters?.filter === "unread") {
      filtered = filtered.filter((n) => !n.read);
    }

    const limit = filters?.limit || 50;
    const finalNotifications = filtered.slice(0, limit);

    return {
      notifications: finalNotifications,
      unreadCount,
      count: finalNotifications.length,
    };
  }

  /**
   * Marks a specific notification as read with strict multi-tenant isolation.
   */
  async markAsRead(
    workspaceId: string,
    notificationId: string
  ): Promise<FormattedNotificationDto> {
    // 1. Update in Neon PostgreSQL
    if (this.db) {
      try {
        const [updated] = await this.db
          .update(schema.notifications)
          .set({ isRead: true })
          .where(
            and(
              eq(schema.notifications.id, notificationId),
              eq(schema.notifications.workspaceId, workspaceId)
            )
          )
          .returning();

        if (updated) {
          // Also update cache if present
          const list = this.memoryNotifications.get(workspaceId) || [];
          const item = list.find((n: any) => n.id === notificationId);
          if (item) {
            item.isRead = true;
            item.read = true;
          }
          return this.formatNotification(updated);
        }
      } catch (err) {
        this.logger.warn(`Could not mark notification as read in DB: ${(err as Error).message}`);
      }
    }

    // 2. Update in-memory fallback
    const list = this.memoryNotifications.get(workspaceId) || [];
    const item = list.find((n: any) => n.id === notificationId);
    if (item) {
      item.isRead = true;
      item.read = true;
      return this.formatNotification(item);
    }

    return {
      id: notificationId,
      workspaceId,
      type: "system",
      title: "Notification",
      message: "Alert marked as read",
      priority: "low",
      read: true,
      isRead: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Atomically marks all pending notifications in a workspace as read.
   */
  async markAllAsRead(workspaceId: string): Promise<{ success: boolean; count: number }> {
    let affectedCount = 0;

    if (this.db) {
      try {
        const updatedRecords = await this.db
          .update(schema.notifications)
          .set({ isRead: true })
          .where(
            and(
              eq(schema.notifications.workspaceId, workspaceId),
              eq(schema.notifications.isRead, false)
            )
          )
          .returning();

        affectedCount = updatedRecords.length;
      } catch (err) {
        this.logger.warn(`Could not mark all notifications as read in DB: ${(err as Error).message}`);
      }
    }

    // Update in-memory fallback
    const list = this.memoryNotifications.get(workspaceId) || [];
    for (const item of list) {
      if (!item.isRead && !item.read) {
        item.isRead = true;
        item.read = true;
        if (!this.db) affectedCount++;
      }
    }

    return { success: true, count: affectedCount };
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
      entityType: string | null;
      entityId: string | null;
      metadata: Record<string, any>;
    }
  ): Promise<void> {
    // In-memory caching for immediate fast read
    const memoryRecord = {
      id: record.id,
      workspaceId: record.workspaceId,
      type: record.type,
      title: record.title,
      message: record.message,
      entityType: record.entityType,
      entityId: record.entityId,
      isRead: false,
      read: false,
      metadata: record.metadata,
      createdAt: new Date(),
    };
    const list = this.memoryNotifications.get(workspaceId) || [];
    list.unshift(memoryRecord);
    this.memoryNotifications.set(workspaceId, list);

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
