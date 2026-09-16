export type LeadScoreCategory = "HOT" | "WARM" | "COLD";

export type LeadStatus =
  | "New"
  | "Contacting"
  | "In Conversation"
  | "Qualified"
  | "Follow-up"
  | "Viewing Booked"
  | "Human Managed";

export interface Lead {
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

export interface LeadFilterParams {
  search?: string;
  scoreCategory?: LeadScoreCategory | "ALL";
  status?: LeadStatus | "ALL";
}

export interface LeadsApiResponse {
  leads: Lead[];
  total: number;
}
