import type { WorkflowActivityEvent } from "../types";

export const MOCK_WORKFLOW_EVENTS: WorkflowActivityEvent[] = [
  {
    id: "evt_001",
    workflowId: "wf_intake_9021",
    entityId: "lead_01",
    entityType: "lead",
    title: "Autonomous AI Qualification Call Completed",
    description:
      "Spacia Voice Core engaged Dr. Babatunde Adeleke regarding the 5-Bed Fully Detached Contemporary Villa in Lekki Phase 1. Verified budget of ₦850,000,000 via corporate equity sale.",
    category: "voice_call",
    status: "completed",
    actor: {
      type: "ai_agent",
      name: "Spacia Voice Core",
      role: "Autonomous Sales Associate",
      modelIdentifier: "Neural Executive v2.4 (Lagos Neutral)",
      latencyMs: 380,
      confidenceScore: 96,
    },
    timestamp: "12 mins ago",
    channel: "Telephony Voice Core",
    payload: {
      duration: "4m 18s",
      outcome: "HOT Qualified (92/100)",
      propertyTitle: "5-Bed Contemporary Villa — Lekki Phase 1",
      transcriptSnippet:
        "AI: 'Good afternoon Dr. Adeleke, I have the Governor's Consent deed on file for the Admiralty Way villa. What timeline are you targeting for completion?'\nProspect: 'My firm is closing a funding round this quarter, so we can settle in 30 days.'",
    },
  },
  {
    id: "evt_002",
    workflowId: "wf_call_8842",
    entityId: "lead_01",
    entityType: "lead",
    title: "Telephony Connection Dropped — Auto-Retrying",
    description:
      "Outbound dialing interrupted by cellular handover error on prospect network. Circuit reported SIP 486 (Busy / Network Congestion).",
    category: "voice_call",
    status: "retrying",
    actor: {
      type: "ai_agent",
      name: "Spacia Telephony Dispatcher",
      role: "Autonomous Dialing Gateway",
      modelIdentifier: "SIP Trunk Relay v3.1",
      latencyMs: 410,
    },
    timestamp: "24 mins ago",
    channel: "Telephony Trunk",
    retry: {
      currentAttempt: 2,
      maxRetries: 3,
      backoffSeconds: 45,
      nextRetryAt: "in 45 seconds",
      isRetrying: true,
      canManuallyRetry: true,
    },
    failure: {
      errorCode: "SIP_486_BUSY_SUBSCRIBER",
      errorMessage: "Target mobile carrier returned busy / packet drop during voice payload handshake.",
      technicalDetails:
        "SIP/2.0 486 Busy Here\nCall-ID: c1893bf-492a-11ee-be56-0242ac120002@telephony.spacia.ai\nReason: Q.850;cause=17;text='User busy'",
      recoverable: true,
      suggestedAction: "System scheduled automated retry attempt 3 of 3 with alternate carrier route.",
      failedAt: "10:42 AM WAT",
    },
    payload: {
      duration: "0m 14s",
      outcome: "Call Interrupted",
    },
  },
  {
    id: "evt_003",
    workflowId: "wf_wa_3319",
    entityId: "lead_01",
    entityType: "lead",
    title: "WhatsApp Architectural Dossier Dispatched",
    description:
      "Encrypted WhatsApp message containing architectural floorplans, verified C of O deed preview, and developer payment terms delivered to prospect.",
    category: "whatsapp",
    status: "completed",
    actor: {
      type: "system",
      name: "WhatsApp Multi-Tenant Gateway",
      subsystem: "Meta Cloud API v20.0",
    },
    timestamp: "1 hour ago",
    channel: "WhatsApp Business API",
    payload: {
      deliveryStatus: "read",
      outcome: "Read by Recipient (Two Blue Ticks)",
      propertyTitle: "5-Bed Contemporary Villa — Lekki Phase 1",
      attachments: [
        {
          url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
          name: "Lekki_Villa_Floorplans_2026.pdf",
          type: "document",
        },
      ],
    },
  },
  {
    id: "evt_004",
    workflowId: "wf_takeover_1092",
    entityId: "lead_01",
    entityType: "lead",
    title: "Human Broker Takeover Activated",
    description:
      "Tunde Bakare engaged client directly following request for escrow account routing and legal title deed inspection at the Lagos State Lands Bureau.",
    category: "broker_note",
    status: "completed",
    actor: {
      type: "human_broker",
      name: "Tunde Bakare",
      role: "Senior Sales Associate",
      territory: "Lekki Phase 1 & Ikate",
      verifiedBadge: true,
      takeoverReason: "Direct escrow wire instruction & legal survey review requested by client.",
    },
    timestamp: "2 hours ago",
    channel: "Broker Command Desk",
    payload: {
      outcome: "In-Person Briefing Scheduled",
      transcriptSnippet:
        "Spoke with Dr. Adeleke's attorney directly. Confirmed they are satisfied with the Governor's Consent deed verification. Scheduled site meeting for Thursday at 11:00 AM.",
    },
  },
  {
    id: "evt_005",
    workflowId: "wf_cal_7721",
    entityId: "lead_01",
    entityType: "lead",
    title: "On-Site Physical Viewing Confirmed & Calendar Synced",
    description:
      "Viewing slot confirmed on Google Calendar with gate security clearance pre-authorized for Lekki Phase 1 estate security desk.",
    category: "calendar",
    status: "completed",
    actor: {
      type: "system",
      name: "Autonomous Calendar Dispatcher",
      subsystem: "Google Workspace API Sync",
    },
    timestamp: "Yesterday at 4:15 PM",
    channel: "Google Calendar",
    payload: {
      viewingSlot: "Thursday, Oct 1 • 11:00 AM WAT",
      outcome: "Confirmed & Synchronized",
      propertyTitle: "5-Bed Contemporary Villa — Lekki Phase 1",
    },
  },
  {
    id: "evt_006",
    workflowId: "wf_cal_fail_091",
    entityId: "lead_02",
    entityType: "lead",
    title: "Calendar Slot Conflict — Human Action Required",
    description:
      "Attempted automated booking on broker Ngozi Eze's calendar collided with an existing VIP closing session. Automated booking paused.",
    category: "calendar",
    status: "blocked",
    actor: {
      type: "system",
      name: "Autonomous Calendar Dispatcher",
      subsystem: "Google Workspace API Sync",
    },
    timestamp: "3 hours ago",
    channel: "Google Calendar",
    failure: {
      errorCode: "CALENDAR_SLOT_COLLISION",
      errorMessage: "Requested inspection time 2:00 PM conflicts with 'Banana Island Deed Signing' on Ngozi Eze's primary calendar.",
      recoverable: true,
      suggestedAction: "Select an alternative 45-minute window or assign secondary broker Femi Adeleke.",
      failedAt: "11:20 AM WAT",
    },
    payload: {
      viewingSlot: "Wednesday, Sep 30 • 2:00 PM WAT",
      outcome: "Booking Collision",
      propertyTitle: "Ultra-Luxury Waterfront Penthouse — Ikoyi",
    },
  },
  {
    id: "evt_007",
    workflowId: "wf_inbound_0012",
    entityId: "lead_01",
    entityType: "lead",
    title: "Inbound Lead Captured via Instagram Ad Webhook",
    description:
      "Verified prospect intake payload received from Meta Ads Webhook. Extracted name, telephone (+234 803 456 7890), and declared budget ₦800M+.",
    category: "system_webhook",
    status: "completed",
    actor: {
      type: "system",
      name: "Inbound Ingestion Gateway",
      subsystem: "Meta Lead Ads Webhook Processor",
    },
    timestamp: "Yesterday at 2:00 PM",
    channel: "Meta Webhook",
    payload: {
      outcome: "Instant Lead Created",
      propertyTitle: "5-Bed Contemporary Villa — Lekki Phase 1",
    },
  },
];
