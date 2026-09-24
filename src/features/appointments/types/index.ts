/**
 * APPOINTMENTS & CALENDAR DOMAIN TYPES
 * 
 * Domain models and contracts for in-person property inspections,
 * calendar synchronization, and broker scheduling.
 */

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export type MeetingType =
  | "in_person_viewing"
  | "virtual_tour"
  | "office_consultation"
  | "vip_private_showing";

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

export interface Appointment {
  id: string;
  workspaceId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadScore?: number;
  leadScoreCategory?: "HOT" | "WARM" | "COLD";
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice?: string;
  propertyImage?: string;
  assignedBrokerId: string;
  assignedBrokerName: string;
  assignedBrokerAvatar?: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  status: AppointmentStatus;
  meetingType: MeetingType;
  location: string;
  gatePassCode?: string;
  gatePassExpiresAt?: string;
  notes?: string;
  calendarEventId?: string;
  calendarProvider?: CalendarProviderType;
  cancelledReason?: string;
  rescheduledFromId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ViewingSlot {
  id: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  formattedTime: string; // e.g. "10:00 AM – 11:00 AM"
  formattedDate: string; // e.g. "Saturday, Oct 12"
  isAvailable: boolean;
  brokerId?: string;
  brokerName?: string;
  reasonUnavailable?: string;
}

export interface CalendarConnection {
  id: string;
  workspaceId: string;
  provider: CalendarProviderType;
  providerName: string;
  accountEmail?: string;
  status: CalendarSyncStatus;
  calendarId?: string;
  calendarName?: string;
  isPrimary: boolean;
  autoSyncEnabled: boolean;
  lastSyncedAt?: string;
  errorDetails?: string;
}

export interface CreateAppointmentPayload {
  leadId: string;
  propertyId: string;
  assignedBrokerId?: string;
  startTime: string;
  endTime?: string;
  meetingType?: MeetingType;
  location?: string;
  notes?: string;
  generateGatePass?: boolean;
}

export interface AppointmentsFilterState {
  search: string;
  status: AppointmentStatus | "ALL";
  timeframe: "all" | "today" | "upcoming" | "past";
  brokerId?: string;
}
