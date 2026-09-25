/**
 * CANONICAL CALENDAR ADAPTER CONTRACT & OAUTH FOUNDATION
 * 
 * Provider-agnostic domain contracts for external calendar synchronization,
 * OAuth2 handshake authorization, real-time free/busy conflict checking,
 * and automated inspection event management.
 * 
 * Boundary Rule:
 * AI voice agents, booking tools, and scheduling controllers interact solely
 * through these normalized contracts. Provider-specific OAuth tokens, payload
 * formats, or API quirks must never leak across this abstraction boundary.
 */

export type CalendarProviderType =
  | "native"
  | "google_calendar"
  | "cal_com"
  | "outlook";

export type CalendarSyncStatus =
  | "connected"
  | "disconnected"
  | "syncing"
  | "sync_error";

export interface OAuthAuthorizationRequest {
  authUrl: string;
  state: string;
  expiresAt: string;
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  accountEmail: string;
  calendarName?: string;
}

export interface BusyInterval {
  start: Date | string;
  end: Date | string;
  summary?: string;
  source?: string;
}

export interface FreeBusyQuery {
  accountEmail: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  calendarId?: string;
}

export interface CalendarEventPayload {
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  leadId?: string;
  propertyTitle: string;
  propertyId?: string;
  location: string;
  meetingType?: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  notes?: string;
  brokerEmail?: string;
}

export interface CalendarEventResult {
  calendarEventId: string;
  provider: CalendarProviderType;
  eventUrl?: string;
  meetingLink?: string;
  status: "confirmed" | "tentative" | "cancelled";
  syncedAt: string;
}

export interface CalendarHealthCapabilities {
  canReadFreeBusy: boolean;
  canCreateEvents: boolean;
  canUpdateEvents: boolean;
  canCancelEvents: boolean;
  supportsOAuth2: boolean;
}

export interface CalendarHealthStatus {
  providerId: CalendarProviderType;
  providerName: string;
  status: "healthy" | "degraded" | "disconnected" | "error";
  latencyMs: number;
  lastSyncAt?: string;
  message: string;
  capabilities: CalendarHealthCapabilities;
}

/**
 * Provider-agnostic Calendar Adapter Contract.
 * Every calendar system (Google Calendar, Outlook Graph, Cal.com, Native)
 * must implement this contract.
 */
export interface ICalendarProviderAdapter {
  readonly providerId: CalendarProviderType;
  readonly providerName: string;

  /**
   * Generates OAuth2 consent URL for account linking.
   */
  generateAuthUrl(
    workspaceId: string,
    redirectUri: string,
    state?: string
  ): Promise<OAuthAuthorizationRequest>;

  /**
   * Exchanges authorization code for access tokens.
   */
  handleOAuthCallback(
    code: string,
    state: string,
    workspaceId?: string
  ): Promise<OAuthTokenResponse>;

  /**
   * Queries free/busy blocks across a date range to prevent double-booking.
   */
  getFreeBusy(
    workspaceId: string,
    query: FreeBusyQuery
  ): Promise<BusyInterval[]>;

  /**
   * Creates a confirmed appointment on the external calendar.
   */
  createEvent(
    workspaceId: string,
    payload: CalendarEventPayload
  ): Promise<CalendarEventResult>;

  /**
   * Cancels or removes an event from the external calendar.
   */
  cancelEvent(
    workspaceId: string,
    calendarEventId: string
  ): Promise<boolean>;

  /**
   * Synchronizes external calendar state and returns updated count.
   */
  syncCalendar(
    workspaceId: string
  ): Promise<{ syncedCount: number; lastSyncedAt: string }>;

  /**
   * Health and capability report.
   */
  checkHealth(
    workspaceId: string
  ): Promise<CalendarHealthStatus>;
}
