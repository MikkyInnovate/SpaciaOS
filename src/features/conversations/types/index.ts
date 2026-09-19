import type { BuyerIntentCategory } from "@/features/ai-agent";

export type ConversationChannel = "whatsapp" | "web_chat" | "voice_transcript";

export type ConversationStatus =
  | "active_ai"
  | "awaiting_prospect"
  | "qualified"
  | "viewing_booked"
  | "human_takeover"
  | "escalated"
  | "closed";

export type MessageSenderType = "ai_agent" | "prospect" | "human_broker" | "system";

export type MessageDeliveryStatus = "sending" | "sent" | "delivered" | "read";

export type MessageArtifactType =
  | "property_card"
  | "viewing_invite"
  | "bant_milestone"
  | "document";

export interface MessageArtifact {
  type: MessageArtifactType;
  // Property artifact fields
  propertyId?: string;
  propertyTitle?: string;
  propertyPrice?: string;
  propertyLocation?: string;
  propertyImage?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  // Viewing appointment fields
  viewingDate?: string;
  viewingTime?: string;
  viewingLocation?: string;
  viewingBroker?: string;
  viewingStatus?: "confirmed" | "pending" | "cancelled";
  // BANT qualification milestone fields
  milestoneTitle?: string;
  milestoneScore?: number;
  milestoneDetails?: string;
  // Document fields
  documentName?: string;
  documentUrl?: string;
  documentSize?: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  sender: MessageSenderType;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string; // ISO string
  deliveryStatus?: MessageDeliveryStatus;
  aiMetadata?: {
    model: string;
    latencyMs?: number;
    confidence?: number;
    intentDetected?: string;
  };
  brokerMetadata?: {
    brokerId: string;
    brokerName: string;
    role?: string;
  };
  artifact?: MessageArtifact;
}

export interface ConversationProspect {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  leadId?: string;
}

export interface ConversationTargetProperty {
  id?: string;
  title: string;
  location: string;
  price: string;
  image?: string;
}

export interface ConversationBantSummary {
  budgetVerified: boolean;
  authorityVerified: boolean;
  needVerified: boolean;
  timelineVerified: boolean;
  propertyFitVerified: boolean;
  notes: string;
}

export interface Conversation {
  id: string;
  prospect: ConversationProspect;
  channel: ConversationChannel;
  status: ConversationStatus;
  targetProperty: ConversationTargetProperty;
  budget: string;
  timeline: string;
  qualificationScore: number;
  confidenceScore: number;
  buyerIntent: BuyerIntentCategory;
  intentSignals: Array<{
    id: string;
    type: "budget" | "timeline" | "authority" | "property_fit" | "objection";
    label: string;
    strength: "high" | "medium" | "low";
  }>;
  unreadCount: number;
  lastMessage: {
    text: string;
    timestamp: string;
    sender: MessageSenderType;
  };
  assignedBroker?: {
    name: string;
    role: string;
    avatar?: string;
  };
  bantSummary: ConversationBantSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationFilterParams {
  search?: string;
  status?: ConversationStatus | "ALL";
  channel?: ConversationChannel | "ALL";
}

export interface ConversationsApiResponse {
  conversations: Conversation[];
  total: number;
}
