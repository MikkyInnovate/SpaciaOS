export interface LeadActivityDto {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  channel?: string;
  status?: string;
  actor?: {
    type: string;
    id?: string;
    name?: string;
  };
  meta?: Record<string, any>;
}

export interface LeadSummaryDto {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyTitle: string;
  location: string;
  budget: string;
  score: number;
  scoreCategory: "HOT" | "WARM" | "COLD";
  status: string;
  intent: "Purchase" | "Rental" | "Investment";
  timeline: string;
  nextAction: string;
  createdAt: string;
  aiNotes?: string;
  source: string;
  assignedBroker?: string;
  propertyId?: string;
  managementMode?: string;
  isAiStopped?: boolean;
  aiStoppedReason?: string;
}

export interface LeadDetailDto extends LeadSummaryDto {
  property?: any;
  propertyDetails?: {
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
  };
  bantBreakdown?: {
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
  };
  qualificationProfile?: any;
  activities?: LeadActivityDto[];
  nextActionDirective?: {
    action: string;
    assignedTo: string;
    priority: "Immediate" | "Scheduled" | "Routine";
    dueDate?: string;
    protocolRecommendation?: string;
  };
  handoffContext?: any;
  recommendedAction?: any;
  followUpSchedule?: any;
  lossDetails?: any;
}

export interface PaginatedLeadsResponseDto {
  leads: LeadSummaryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
