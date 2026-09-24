export interface CallTranscriptTurnDto {
  id: string;
  speaker: "agent" | "prospect" | "system";
  speakerName: string;
  timestamp: string; // e.g. "01:24"
  timestampSeconds: number; // e.g. 84
  message: string;
  sentiment?: "positive" | "hesitant" | "neutral";
  bantTags?: string[];
  keyQuote?: boolean;
}

export interface CallSummaryDto {
  synthesis: string;
  keyTakeaways: string[];
  objectionsRaised: string[];
  actionItems: string[];
  suggestedNextStep?: string;
}

export interface CallMetricsDto {
  durationSeconds: number;
  durationFormatted: string; // e.g. "3m 42s"
  talkRatio: {
    aiPercent: number;
    prospectPercent: number;
  };
  turnCount: number;
  averageLatencyMs: number;
}

export interface CallResponseDto {
  id: string;
  leadId?: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  propertyTitle: string;
  propertyLocation: string;
  declaredBudget: string;
  score?: number | null;
  scoreCategory?: "HOT" | "WARM" | "COLD" | null;
  outcome?: string | null;
  recordingState: string;
  recordingUrl?: string | null;
  audioDurationSeconds: number;
  metrics: CallMetricsDto;
  summary?: CallSummaryDto | null;
  transcript: CallTranscriptTurnDto[];
  createdAt: string;
  relativeTime: string;
  isEscalated: boolean;
  isLive: boolean;
  agentPersona?: string | null;
}
