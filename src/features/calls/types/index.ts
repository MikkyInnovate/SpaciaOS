export type CallOutcome =
  | "viewing_booked"
  | "qualified"
  | "callback_requested"
  | "nurture"
  | "voicemail"
  | "escalated_takeover";

export type CallRecordingState =
  | "ready"
  | "processing"
  | "live"
  | "failed"
  | "no_audio";

export type TranscriptSentiment = "positive" | "hesitant" | "neutral";

export type BANTTag = "budget" | "authority" | "need" | "timeline" | "property_fit";

export interface CallTranscriptTurn {
  id: string;
  speaker: "agent" | "prospect" | "system";
  speakerName: string;
  timestamp: string; // e.g. "01:24"
  timestampSeconds: number; // e.g. 84
  message: string;
  sentiment?: TranscriptSentiment;
  bantTags?: BANTTag[];
  keyQuote?: boolean;
}

export interface CallSummary {
  synthesis: string;
  keyTakeaways: string[];
  objectionsRaised: string[];
  actionItems: string[];
  suggestedNextStep: string;
}

export interface CallMetrics {
  durationSeconds: number;
  durationFormatted: string; // e.g. "4m 18s"
  talkRatio: {
    aiPercent: number;
    prospectPercent: number;
  };
  turnCount: number;
  averageLatencyMs: number; // e.g. 390
}

export interface Call {
  id: string;
  leadId?: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  leadAvatarUrl?: string;
  leadCompany?: string;
  propertyTitle: string;
  propertyLocation: string;
  declaredBudget: string;
  targetPrice?: string;
  score: number | null;
  scoreCategory: "HOT" | "WARM" | "COLD" | null;
  outcome: CallOutcome | null;
  recordingState: CallRecordingState;
  recordingUrl?: string;
  audioDurationSeconds: number;
  metrics: CallMetrics;
  summary: CallSummary | null;
  transcript: CallTranscriptTurn[];
  createdAt: string;
  relativeTime: string;
  isEscalated?: boolean;
  isLive?: boolean;
  agentPersona?: string;
}

export interface CallFilters {
  searchTerm?: string;
  outcome?: CallOutcome | "ALL";
  recordingState?: CallRecordingState | "ALL";
  minScore?: number;
  sortBy?: "timestamp" | "duration" | "score";
  sortOrder?: "asc" | "desc";
}
