import { Inject, Injectable, Logger, NotFoundException, Optional } from "@nestjs/common";
import {
  CalendarConnectionEntity,
  ViewingSlotEntity,
  CalendarProviderType,
} from "./interfaces/appointment.interface";
import {
  ICalendarProviderAdapter,
  CalendarEventPayload,
  CalendarEventResult,
  CalendarHealthStatus,
  OAuthAuthorizationRequest,
  OAuthTokenResponse,
} from "./adapters/calendar-adapter.interface";
import { NativeCalendarAdapter } from "./adapters/native-calendar.adapter";
import { GoogleCalendarAdapter } from "./adapters/google-calendar.adapter";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { eq, and } from "drizzle-orm";

@Injectable()
export class CalendarAdapterService {
  private readonly logger = new Logger(CalendarAdapterService.name);
  private readonly adapterRegistry = new Map<CalendarProviderType, ICalendarProviderAdapter>();

  // In-memory workspace connections store
  private connections: Map<string, CalendarConnectionEntity[]> = new Map();

  constructor(
    private readonly nativeAdapter: NativeCalendarAdapter,
    private readonly googleAdapter: GoogleCalendarAdapter,
    @Optional() @Inject(DRIZZLE_DATABASE) private readonly db?: DrizzleDb
  ) {
    this.registerAdapters([
      this.nativeAdapter,
      this.googleAdapter,
    ]);
    this.initDefaultConnections("default");
  }

  private registerAdapters(adapters: ICalendarProviderAdapter[]) {
    for (const adapter of adapters) {
      this.adapterRegistry.set(adapter.providerId, adapter);
      this.logger.log(`[Calendar Registry] Registered provider adapter: [${adapter.providerId}]`);
    }
  }

  private initDefaultConnections(workspaceId: string) {
    if (!this.connections.has(workspaceId)) {
      this.connections.set(workspaceId, [
        {
          id: `conn_native_${workspaceId}`,
          workspaceId,
          provider: "native",
          providerName: "Pacia Native Scheduler",
          accountEmail: "agency-ops@spacia.io",
          status: "connected",
          calendarName: "Master Agency Calendar",
          isPrimary: true,
          autoSyncEnabled: true,
          lastSyncedAt: new Date().toISOString(),
        },
        {
          id: `conn_google_${workspaceId}`,
          workspaceId,
          provider: "google_calendar",
          providerName: "Google Calendar",
          accountEmail: "ade.admin@spacia.io",
          status: "connected",
          calendarName: "VIP Viewings & Inspections",
          isPrimary: false,
          autoSyncEnabled: true,
          lastSyncedAt: new Date().toISOString(),
        },
      ]);
    }
  }

  /**
   * Retrieves all calendar connections for a tenant workspace, hydrated from Neon PostgreSQL.
   */
  async getConnections(workspaceId: string): Promise<CalendarConnectionEntity[]> {
    this.initDefaultConnections(workspaceId);
    const inMemory = this.connections.get(workspaceId) || [];

    if (this.db) {
      try {
        const dbRows = await this.db
          .select()
          .from(schema.calendarConnections)
          .where(eq(schema.calendarConnections.workspaceId, workspaceId));

        if (dbRows.length > 0) {
          for (const row of dbRows) {
            const meta = (row.metadata as any) || {};
            const providerKey = (row.provider === "google" ? "google_calendar" : row.provider) as CalendarProviderType;
            const existing = inMemory.find((c) => c.provider === providerKey);

            if (existing) {
              existing.status = row.status as any;
              existing.accountEmail = meta.accountEmail || existing.accountEmail;
              existing.calendarName = meta.calendarName || existing.calendarName;
              existing.autoSyncEnabled = meta.autoSyncEnabled ?? true;
              existing.lastSyncedAt = meta.lastSyncedAt || row.updatedAt?.toISOString();
            } else {
              inMemory.push({
                id: row.id,
                workspaceId: row.workspaceId,
                provider: providerKey,
                providerName: providerKey === "google_calendar" ? "Google Calendar" : providerKey,
                accountEmail: meta.accountEmail || "connected@spacia.io",
                status: row.status as any,
                calendarName: meta.calendarName || "Primary Calendar",
                isPrimary: false,
                autoSyncEnabled: meta.autoSyncEnabled ?? true,
                lastSyncedAt: meta.lastSyncedAt || row.updatedAt?.toISOString(),
              });
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Could not load calendar connections from DB: ${(err as Error).message}`);
      }
    }

    return inMemory;
  }

  /**
   * Generates OAuth2 consent URL for linking Google Calendar.
   */
  async generateOAuthUrl(
    workspaceId: string,
    provider: CalendarProviderType,
    redirectUri: string,
    state?: string
  ): Promise<OAuthAuthorizationRequest> {
    const adapter = this.adapterRegistry.get(provider);
    if (!adapter) {
      throw new NotFoundException(`Calendar provider [${provider}] not supported.`);
    }
    return adapter.generateAuthUrl(workspaceId, redirectUri, state);
  }

  /**
   * Handles OAuth2 code exchange and activates live connection.
   */
  async handleOAuthCallback(
    workspaceId: string,
    provider: CalendarProviderType,
    code: string,
    state: string
  ): Promise<OAuthTokenResponse> {
    const adapter = this.adapterRegistry.get(provider);
    if (!adapter) {
      throw new NotFoundException(`Calendar provider [${provider}] not supported.`);
    }
    const tokenResponse = await adapter.handleOAuthCallback(code, state, workspaceId);
    await this.connectProvider(
      workspaceId,
      provider,
      tokenResponse.accountEmail,
      tokenResponse.calendarName
    );
    return tokenResponse;
  }

  /**
   * Connects or updates a calendar provider connection.
   */
  async connectProvider(
    workspaceId: string,
    provider: CalendarProviderType,
    accountEmail: string,
    calendarName?: string
  ): Promise<CalendarConnectionEntity[]> {
    this.initDefaultConnections(workspaceId);
    const list = this.connections.get(workspaceId)!;
    const existing = list.find((c) => c.provider === provider);

    if (existing) {
      existing.status = "connected";
      existing.accountEmail = accountEmail;
      existing.calendarName = calendarName || "VIP Viewings & Inspections";
      existing.autoSyncEnabled = true;
      existing.lastSyncedAt = new Date().toISOString();
    } else {
      list.push({
        id: `conn_${provider}_${workspaceId}`,
        workspaceId,
        provider,
        providerName: provider === "google_calendar" ? "Google Calendar" : provider,
        accountEmail,
        status: "connected",
        calendarName: calendarName || "VIP Viewings & Inspections",
        isPrimary: false,
        autoSyncEnabled: true,
        lastSyncedAt: new Date().toISOString(),
      });
    }

    // Persist to Neon DB if available
    if (this.db) {
      try {
        const dbExisting = await this.db
          .select()
          .from(schema.calendarConnections)
          .where(
            and(
              eq(schema.calendarConnections.workspaceId, workspaceId),
              eq(schema.calendarConnections.provider, provider)
            )
          )
          .limit(1);

        if (dbExisting.length > 0) {
          await this.db
            .update(schema.calendarConnections)
            .set({
              status: "connected",
              metadata: {
                accountEmail,
                calendarName: calendarName || "VIP Viewings & Inspections",
                autoSyncEnabled: true,
                lastSyncedAt: new Date().toISOString(),
              },
              updatedAt: new Date(),
            })
            .where(eq(schema.calendarConnections.id, dbExisting[0].id));
        } else {
          await this.db.insert(schema.calendarConnections).values({
            workspaceId,
            provider,
            status: "connected",
            calendarId: "primary",
            metadata: {
              accountEmail,
              calendarName: calendarName || "VIP Viewings & Inspections",
              autoSyncEnabled: true,
              lastSyncedAt: new Date().toISOString(),
            },
          });
        }
      } catch (err) {
        this.logger.warn(`Could not update connection in DB: ${(err as Error).message}`);
      }
    }

    this.logger.log(
      `[Calendar Sync] Connected calendar provider [${provider}] for workspace [${workspaceId}] -> ${accountEmail}`
    );
    return list;
  }

  /**
   * Toggles or disconnects a calendar provider.
   */
  async toggleConnection(
    workspaceId: string,
    provider: CalendarProviderType,
    enable: boolean
  ): Promise<CalendarConnectionEntity[]> {
    this.initDefaultConnections(workspaceId);
    const list = this.connections.get(workspaceId)!;
    const existing = list.find((c) => c.provider === provider);

    if (existing && !existing.isPrimary) {
      existing.status = enable ? "connected" : "disconnected";
      existing.autoSyncEnabled = enable;
      existing.lastSyncedAt = enable ? new Date().toISOString() : undefined;
    }

    // Persist update in DB
    if (this.db) {
      try {
        await this.db
          .update(schema.calendarConnections)
          .set({
            status: enable ? "connected" : "disconnected",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.calendarConnections.workspaceId, workspaceId),
              eq(schema.calendarConnections.provider, provider)
            )
          );
      } catch (err) {
        this.logger.warn(`Could not update calendar connection status in DB: ${(err as Error).message}`);
      }
    }

    return list;
  }

  /**
   * Calculates real-time viewing slots for a property and date,
   * querying active external calendar adapters (Google Calendar) for busy blocks.
   */
  async calculateAvailableSlots(
    workspaceId: string,
    propertyId: string,
    targetDateStr: string,
    bookedIntervals: Array<{ start: Date; end: Date }> = []
  ): Promise<ViewingSlotEntity[]> {
    const normalizedDate = targetDateStr.includes("T") ? targetDateStr.split("T")[0] : targetDateStr;
    const [year, month, day] = normalizedDate.split("-").map((part) => parseInt(part, 10));
    const calendarDay = new Date(year, (month || 1) - 1, day || 1);
    if (calendarDay.getDay() === 0) {
      return [];
    }

    const dayStartISO = `${normalizedDate}T00:00:00.000Z`;
    const dayEndISO = `${normalizedDate}T23:59:59.999Z`;

    // Query active external calendar provider (Google Calendar) for free/busy intervals
    const connections = await this.getConnections(workspaceId);
    const googleConn = connections.find(
      (c) => c.provider === "google_calendar" && c.status === "connected"
    );

    let externalBusyIntervals: Array<{ start: Date; end: Date; source: string; summary?: string }> = [];

    if (googleConn) {
      try {
        const busy = await this.googleAdapter.getFreeBusy(workspaceId, {
          accountEmail: googleConn.accountEmail || "primary",
          startTime: dayStartISO,
          endTime: dayEndISO,
        });
        externalBusyIntervals = busy.map((b) => ({
          start: new Date(b.start),
          end: new Date(b.end),
          source: "google_calendar",
          summary: b.summary,
        }));
      } catch (err) {
        this.logger.warn(`Failed to fetch external freeBusy for slots: ${(err as Error).message}`);
      }
    }

    const slotTimes = [
      { label: "10:00 AM", hour: 10, minute: 0 },
      { label: "11:30 AM", hour: 11, minute: 30 },
      { label: "01:00 PM", hour: 13, minute: 0 },
      { label: "02:30 PM", hour: 14, minute: 30 },
      { label: "04:00 PM", hour: 16, minute: 0 },
      { label: "05:30 PM", hour: 17, minute: 30 },
    ];

    const pad = (n: number) => n.toString().padStart(2, "0");

    return slotTimes.map((t, idx) => {
      const slotStart = new Date(`${normalizedDate}T${pad(t.hour)}:${pad(t.minute)}:00.000Z`);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

      // Check conflict against internal booked appointments
      const internalClash = bookedIntervals.some((interval) => {
        return (
          (slotStart >= interval.start && slotStart < interval.end) ||
          (slotEnd > interval.start && slotEnd <= interval.end)
        );
      });

      // Check conflict against external Google Calendar busy intervals
      const externalClash = externalBusyIntervals.find((interval) => {
        return (
          (slotStart >= interval.start && slotStart < interval.end) ||
          (slotEnd > interval.start && slotEnd <= interval.end)
        );
      });

      const isAvailable = !internalClash && !externalClash;
      let reasonUnavailable: string | undefined;

      if (externalClash) {
        reasonUnavailable = externalClash.summary
          ? `Conflicting appointment on Google Calendar (${externalClash.summary})`
          : "Conflicting appointment on broker's Google Calendar";
      } else if (internalClash) {
        reasonUnavailable = "Viewing slot already booked by another prospect";
      }

      return {
        id: `slot_${idx}_${slotStart.getTime()}`,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        formattedTime: `${t.label} – ${slotEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        formattedDate: slotStart.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        isAvailable,
        brokerId: "broker_ade",
        brokerName: "Ade Admin (Senior Luxury Closer)",
        reasonUnavailable,
      };
    });
  }

  /**
   * Dispatches calendar event creation to the active primary / Google Calendar provider.
   */
  async createCalendarEvent(
    workspaceId: string,
    payload: CalendarEventPayload
  ): Promise<CalendarEventResult> {
    const connections = await this.getConnections(workspaceId);
    const googleConn = connections.find(
      (c) => c.provider === "google_calendar" && c.status === "connected"
    );

    const activeProvider = googleConn ? "google_calendar" : "native";
    const adapter = this.adapterRegistry.get(activeProvider) || this.nativeAdapter;

    this.logger.log(
      `[Calendar Event Dispatch] Workspace [${workspaceId}] -> Using adapter [${adapter.providerId}] for ${payload.leadName}`
    );

    return adapter.createEvent(workspaceId, payload);
  }

  /**
   * Cancels or removes an event from the external calendar provider.
   */
  async cancelEvent(workspaceId: string, calendarEventId: string): Promise<boolean> {
    const adapter = this.adapterRegistry.get("google_calendar") || this.nativeAdapter;
    return adapter.cancelEvent(workspaceId, calendarEventId);
  }

  /**
   * Checks health and latency for calendar adapters.
   */
  async checkAllHealth(workspaceId: string): Promise<CalendarHealthStatus[]> {
    const results: CalendarHealthStatus[] = [];
    for (const adapter of this.adapterRegistry.values()) {
      const health = await adapter.checkHealth(workspaceId);
      results.push(health);
    }
    return results;
  }
}
