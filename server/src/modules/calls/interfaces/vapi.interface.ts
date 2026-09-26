import { CallOutcome, CallRecordingState } from "../../../database/schema/calls.schema";

export type VapiCallStatus =
  | "queued"
  | "ringing"
  | "in-progress"
  | "forwarding"
  | "ended";

export type PaciaCallState =
  | "queued"
  | "ringing"
  | "in_progress"
  | "ended"
  | "failed";

export interface VapiCustomer {
  number: string;
  name?: string;
}

export interface VapiAssistantOverrides {
  variableValues?: Record<string, any>;
}

export interface VapiOutboundCallPayload {
  type: "outboundPhoneCall";
  phoneNumberId?: string;
  customer: VapiCustomer;
  assistantId?: string;
  assistantOverrides?: VapiAssistantOverrides;
  metadata?: {
    workspaceId: string;
    leadId: string;
    callId: string;
    [key: string]: any;
  };
}

export interface VapiCallResponse {
  id: string;
  status: VapiCallStatus;
  phoneNumberId?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  cost?: number;
}

export interface VapiTranscriptTurn {
  role: "assistant" | "user" | "bot" | "system";
  message: string;
  time?: number;
  secondsFromStart?: number;
  sentiment?: "positive" | "hesitant" | "neutral";
}

export interface VapiWebhookMessage {
  type:
    | "status-update"
    | "end-of-call-report"
    | "speech-update"
    | "transcript"
    | "conversation-update"
    | string;
  id?: string;
  timestamp?: number | string;
  status?: VapiCallStatus;
  endedReason?: string;
  call?: {
    id: string;
    status: VapiCallStatus;
    endedReason?: string;
    startedAt?: string;
    endedAt?: string;
    duration?: number;
    durationSeconds?: number;
    cost?: number;
    transcript?: string;
    recordingUrl?: string;
    summary?: string;
    analysis?: {
      summary?: string;
      structuredData?: Record<string, any>;
      successEvaluation?: string;
    };
    artifact?: {
      recordingUrl?: string;
      transcript?: string;
      messages?: any[];
    };
    metadata?: {
      workspaceId?: string;
      leadId?: string;
      callId?: string;
      [key: string]: any;
    };
  };
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  analysis?: {
    summary?: string;
    structuredData?: Record<string, any>;
    successEvaluation?: string;
  };
  artifact?: {
    recordingUrl?: string;
    transcript?: string;
    messages?: VapiTranscriptTurn[];
  };
}

export interface VapiWebhookPayload {
  message: VapiWebhookMessage;
}

export interface IVapiTelephonyProvider {
  readonly providerName: "vapi" | "mock";
  createOutboundCall(payload: VapiOutboundCallPayload): Promise<VapiCallResponse>;
}
