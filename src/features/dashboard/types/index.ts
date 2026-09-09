export type LeadScoreCategory = "HOT" | "WARM" | "COLD";

export type LeadStatus =
  | "New"
  | "Contacting"
  | "In Conversation"
  | "Qualified"
  | "Follow-up"
  | "Viewing Booked"
  | "Human Managed";

export interface DashboardLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyTitle: string;
  location: string;
  budget: string;
  score: number;
  scoreCategory: LeadScoreCategory;
  status: LeadStatus;
  intent: "Purchase" | "Rental" | "Investment";
  timeline: string;
  nextAction: string;
  createdAt: string;
  aiNotes?: string;
}

export interface DashboardViewing {
  id: string;
  prospectName: string;
  propertyTitle: string;
  agentName: string;
  date: string;
  time: string;
  status: "Confirmed" | "Scheduled" | "Pending";
  leadScore: number;
}

export interface CallTranscriptMessage {
  speaker: "agent" | "prospect";
  speakerName: string;
  time: string;
  message: string;
}

export interface DashboardAICallEvent {
  id: string;
  leadName: string;
  propertyTitle: string;
  location?: string;
  budget?: string;
  phone?: string;
  email?: string;
  score?: number;
  scoreCategory?: LeadScoreCategory;
  duration: string;
  outcome: "Qualified" | "In Conversation" | "Viewing Requested" | "Voicemail" | "Contacting" | "Follow-up";
  summary: string;
  timestamp: string;
  isEscalated?: boolean;
  transcript?: CallTranscriptMessage[];
}

export interface DashboardFunnelStage {
  label: string;
  count: number;
  percentage: number;
  highlight?: boolean;
}
