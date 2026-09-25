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

export interface AppointmentEntity {
  id: string;
  workspaceId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
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
  notes?: string;
  meetingUrl?: string;
  calendarEventId?: string;
  calendarProvider?: CalendarProviderType;
  referenceCode?: string;
  shareableSummary?: string;
  cancelledReason?: string;
  rescheduledFromId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ViewingSlotEntity {
  id: string;
  startTime: string;
  endTime: string;
  formattedTime: string;
  formattedDate: string;
  isAvailable: boolean;
  brokerId?: string;
  brokerName?: string;
  reasonUnavailable?: string;
}

export interface CalendarConnectionEntity {
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
