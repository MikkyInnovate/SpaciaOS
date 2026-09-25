export type NotificationRecipientType = "prospect" | "company";

export type NotificationTemplateType =
  | "prospect_booking_confirmation"
  | "prospect_viewing_reminder"
  | "company_new_appointment";

export type NotificationDeliveryStatus = "queued" | "sent" | "delivered" | "failed" | "mock_delivered";

export interface ProspectConfirmationData {
  appointmentId: string;
  referenceCode: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice?: string;
  propertyImage?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  meetingType: "in_person_viewing" | "virtual_tour" | "vip_private_showing" | "office_consultation";
  meetingUrl?: string;
  gatePassCode?: string;
  assignedBrokerName: string;
  assignedBrokerPhone?: string;
  notes?: string;
}

export interface ProspectReminderData extends ProspectConfirmationData {
  reminderWindow: "24h" | "1h";
  confirmationActionUrl?: string;
}

export interface CompanyLeadContext {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  scoreCategory: "HOT" | "WARM" | "COLD";
  budget: string;
  timeline: string;
  decisionReadiness: string;
  buyingCatalyst?: string;
}

export interface CompanyPropertyContext {
  id: string;
  title: string;
  location: string;
  price: string;
  bedrooms?: number;
  bathrooms?: number;
  commission?: string;
}

export interface CompanyAiSummary {
  synthesis: string;
  buyerSentiment: "bullish" | "neutral" | "cautious";
  keyRequirements: string[];
  objectionsResolved: string[];
  recommendedClosingStrategy?: string;
}

export interface CompanyAppointmentData {
  appointmentId: string;
  referenceCode: string;
  companyRecipientEmail: string;
  leadContext: CompanyLeadContext;
  propertyContext: CompanyPropertyContext;
  aiSummary: CompanyAiSummary;
  meetingDetails: {
    scheduledStartAt: string;
    scheduledEndAt: string;
    meetingType: string;
    meetingUrl?: string;
    assignedCloser: string;
  };
}

export interface NotificationResult {
  id: string;
  resendMessageId: string;
  recipient: string;
  recipientType: NotificationRecipientType;
  templateType: NotificationTemplateType;
  subject: string;
  status: NotificationDeliveryStatus;
  sentAt: string;
  htmlBody?: string;
  error?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}
