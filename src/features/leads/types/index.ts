import type { Property } from "@/features/properties";

export type LeadScoreCategory = "HOT" | "WARM" | "COLD";

export type LeadStatus =
  | "New"
  | "Contacting"
  | "In Conversation"
  | "Qualified"
  | "Follow-up"
  | "Viewing Booked"
  | "Human Managed";

export interface PropertyDetails {
  propertyTitle: string;
  location: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  targetPrice: string;
  budgetMatch: "Within Budget" | "Budget Stretch" | "Sub-Budget";
  developmentStage?: string;
  estateName?: string;
  featuredImage?: string;
  images?: string[];
}

export interface BantBreakdown {
  budgetScore: number;
  budgetNote: string;
  authorityScore: number;
  authorityNote: string;
  needScore: number;
  needNote: string;
  timelineScore: number;
  timelineNote: string;
  propertyFitScore: number;
  propertyFitNote: string;
}

import type {
  WorkflowExecutionStatus,
  WorkflowActor,
  RetryPolicy,
  FailureDiagnostic,
} from "@/features/events";

export type ActivityType =
  | "inbound_capture"
  | "ai_voice_call"
  | "whatsapp_message"
  | "viewing_scheduled"
  | "human_note"
  | "status_change";

export interface LeadActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  channel?: string;
  status?: WorkflowExecutionStatus;
  actor?: WorkflowActor;
  retry?: RetryPolicy;
  failure?: FailureDiagnostic;
  meta?: {
    duration?: string;
    outcome?: string;
    brokerName?: string;
    viewingDate?: string;
    imageUrl?: string;
    imageCaption?: string;
    transcriptSnippet?: string;
  };
}

export interface NextActionDirective {
  action: string;
  assignedTo: string;
  priority: "Immediate" | "Scheduled" | "Routine";
  dueDate?: string;
  protocolRecommendation?: string;
}

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
  source?: string;
  assignedBroker?: string;
  propertyId?: string;
  property?: Property;
  propertyDetails?: PropertyDetails;
  bantBreakdown?: BantBreakdown;
  activities?: LeadActivity[];
  nextActionDirective?: NextActionDirective;
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
