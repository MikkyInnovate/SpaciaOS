"use client";

import * as React from "react";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { Button } from "@/components/ui/button";
import { LeadStatusSelect } from "./lead-status-select";
import { LeadNextActionCard } from "./lead-next-action-card";
import { LeadPropertyCard } from "./lead-property-card";
import { QualificationPanel } from "./qualification-panel";
import { LeadActivityTimeline } from "./lead-activity-timeline";
import {
  PropertyCard,
  PropertyDetailPresentation,
  PropertyUnavailableState,
  PropertyUnknownState,
} from "@/features/properties";
import { HumanSupervisionCockpit } from "./human-supervision-cockpit";
import {
  callsService,
  CallAudioPlayer,
  CallSummaryCard,
  CallDetailCockpit,
  InitiateCallDialog,
  type Call,
} from "@/features/calls";
import type { Property } from "@/features/properties";
import type { Lead, LeadStatus, FollowUpSchedule, LossDetails } from "../types";
import {
  User,
  Phone,
  Mail,
  Copy,
  Check,
  Building,
  UserCheck,
  PhoneCall,
  History,
  ShieldCheck,
  Sparkles,
  PauseCircle,
  Compass,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export type CommandCenterTab =
  | "overview"
  | "qualification"
  | "calls"
  | "timeline"
  | "supervision";

export interface LeadDetailShellProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => Promise<void> | void;
  onAddNote?: (leadId: string, noteText: string, imageUrl?: string) => Promise<void> | void;
  onTakeover?: (leadId: string, brokerName?: string, reason?: string) => Promise<void> | void;
  onStopAI?: (leadId: string, reason?: string) => Promise<void> | void;
  onResumeAI?: (leadId: string) => Promise<void> | void;
  onMarkNurture?: (leadId: string, schedule: FollowUpSchedule, notes?: string) => Promise<void> | void;
  onMarkLost?: (leadId: string, lossDetails: LossDetails) => Promise<void> | void;
  onUpdateSchedule?: (leadId: string, schedule: FollowUpSchedule) => Promise<void> | void;
  onObjectionStatusChange?: (leadId: string, objectionId: string, status: "open" | "resolved", note?: string) => Promise<void> | void;
  onInspectCall?: (call: Call) => void;
  isLoading?: boolean;
}

export function LeadDetailShell({
  lead,
  open,
  onOpenChange,
  onStatusChange,
  onAddNote,
  onTakeover,
  onStopAI,
  onResumeAI,
  onMarkNurture,
  onMarkLost,
  onUpdateSchedule,
  onObjectionStatusChange,
  onInspectCall,
  isLoading = false,
}: LeadDetailShellProps) {
  const [copiedPhone, setCopiedPhone] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<CommandCenterTab>("overview");
  const [selectedPropertyForSpecs, setSelectedPropertyForSpecs] = React.useState<Property | null>(null);
  const [connectedCalls, setConnectedCalls] = React.useState<Call[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = React.useState(false);
  const [isInitiateCallOpen, setIsInitiateCallOpen] = React.useState(false);
  const [selectedCallForCockpit, setSelectedCallForCockpit] = React.useState<Call | null>(null);
  const [prevLeadId, setPrevLeadId] = React.useState<string | undefined>(lead?.id);

  // Cleanly reset transient inspection when switching leads
  if (lead?.id !== prevLeadId) {
    setPrevLeadId(lead?.id);
    setSelectedPropertyForSpecs(null);
    setSelectedCallForCockpit(null);
    setActiveTab("overview");
  }

  // Fetch linked Vapi voice calls whenever lead changes or drawer opens
  React.useEffect(() => {
    let isCancelled = false;
    if (!lead || !open) {
      return;
    }

    const loadCalls = async () => {
      setIsLoadingCalls(true);
      try {
        const calls = await callsService.getCallsByLeadId(lead.id, lead.phone, lead.name);
        if (!isCancelled) {
          setConnectedCalls(calls);
        }
      } catch {
        if (!isCancelled) {
          setConnectedCalls([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingCalls(false);
        }
      }
    };

    loadCalls();

    return () => {
      isCancelled = true;
    };
  }, [lead, open]);

  if (!lead && !isLoading) return null;

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    toast.success("Phone number copied to clipboard", {
      description: phone,
    });
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleStatusUpdate = async (newStatus: LeadStatus) => {
    if (!lead || !onStatusChange) return;
    try {
      await onStatusChange(lead.id, newStatus);
      toast.success("Lead Stage Updated", {
        description: `${lead.name} transitioned to ${newStatus}.`,
      });
    } catch {
      toast.error("Failed to update status", {
        description: "Please check your network connection and retry.",
      });
    }
  };

  const handleAddTimelineNote = (noteText: string, imageUrl?: string) => {
    if (!lead || !onAddNote) return;
    onAddNote(lead.id, noteText, imageUrl);
    toast.success("Operational note appended", {
      description: "Recorded in lead interaction timeline.",
    });
  };

  const handleRetryActivity = (activityId: string) => {
    toast.success("Workflow Retry Initiated", {
      description: `Dispatched retry handshake for activity ${activityId}.`,
    });
  };

  const handleObjectionToggle = async (objectionId: string, status: "open" | "resolved", note?: string) => {
    if (!lead || !onObjectionStatusChange) return;
    try {
      await onObjectionStatusChange(lead.id, objectionId, status, note);
    } catch {
      toast.error("Failed to update objection status");
    }
  };

  const handleOpenCallInspection = (callId?: string) => {
    if (connectedCalls.length > 0) {
      const match = callId ? connectedCalls.find((c) => c.id === callId) || connectedCalls[0] : connectedCalls[0];
      if (onInspectCall) {
        onInspectCall(match);
      } else {
        setSelectedCallForCockpit(match);
      }
    } else {
      toast.info("No recorded audio file attached to this event.");
    }
  };

  const cleanWhatsAppPhone = lead?.phone ? lead.phone.replace(/[\s+-]/g, "") : "";

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        lead ? (
          <div className="flex items-center gap-2.5 truncate">
            <span className="font-semibold text-stone-900 truncate">{lead.name}</span>
          </div>
        ) : (
          "Loading Prospect Dossier..."
        )
      }
      description={
        lead ? (
          <span className="truncate">
            Lead ID: <strong className="font-mono text-stone-900 font-semibold">{lead.id}</strong> • Ingested {lead.createdAt}
            {lead.source ? ` • via ${lead.source}` : ""}
          </span>
        ) : undefined
      }
      icon={<User className="h-4 w-4 text-white" />}
      badge={
        lead ? (
          <ScoreIndicator
            score={lead.score}
            category={lead.scoreCategory}
            variant="badge"
            size="sm"
          />
        ) : undefined
      }
      maxWidth="xl"
    >
      {/* SKELETON LOADING STATE */}
      {isLoading && (
        <div className="space-y-4 p-2 animate-pulse">
          <div className="h-14 rounded-xl bg-stone-100 border border-stone-200" />
          <div className="h-10 rounded-lg bg-stone-100 border border-stone-200" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="h-24 rounded-xl bg-stone-100" />
            <div className="h-24 rounded-xl bg-stone-100" />
            <div className="h-24 rounded-xl bg-stone-100" />
          </div>
          <div className="h-48 rounded-xl bg-stone-100" />
        </div>
      )}

      {lead && !isLoading && (
        <div className="space-y-4 pb-2">
          {/* 1. APEX OPERATIONAL ACTION & TELEMETRY BAR */}
          <div className="rounded-xl border border-stone-200/70 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Live AI Engine State Pill with Instant Killswitch */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  AI Telemetry:
                </span>
                {lead.isAiStopped ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                    <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                    <span>AI Engine Paused</span>
                    {onResumeAI && (
                      <button
                        type="button"
                        onClick={() => onResumeAI(lead.id)}
                        className="ml-1 text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                ) : lead.status === "Human Managed" ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-900 text-xs font-medium">
                    <UserCheck className="h-3.5 w-3.5 text-sky-700" />
                    <span>Human Supervised ({lead.assignedBroker || "Assigned Broker"})</span>
                  </div>
                ) : lead.status === "Lost" ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium">
                    <span>Deal Marked Lost</span>
                  </div>
                ) : lead.status === "Nurture" ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-800 text-xs font-medium">
                    <span>Nurture Cadence Active</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                    </span>
                    <span>AI Autonomous Active</span>
                    {onStopAI && (
                      <button
                        type="button"
                        onClick={() => onStopAI(lead.id, "Broker manual emergency pause")}
                        className="ml-1 text-[11px] font-semibold text-amber-700 hover:underline cursor-pointer"
                      >
                        Pause
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Stage Switcher */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 select-none">
                  Stage:
                </span>
                <LeadStatusSelect
                  currentStatus={lead.status}
                  onStatusChange={handleStatusUpdate}
                  showLabel={false}
                />
              </div>
            </div>

            {/* Direct Contact Action Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-stone-200 bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-50 text-xs font-medium transition-colors"
                  title="Initiate phone call"
                >
                  <Phone className="h-3 w-3 text-stone-500" />
                  <span className="font-mono">{lead.phone}</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyPhone(lead.phone)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-stone-200 bg-white text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
                  title="Copy phone number"
                  aria-label="Copy phone"
                >
                  {copiedPhone ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>

                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-stone-200 bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-50 text-xs font-medium transition-colors"
                  title="Send email"
                >
                  <Mail className="h-3 w-3 text-stone-500" />
                  <span>Email</span>
                </a>

                {cleanWhatsAppPhone && (
                  <a
                    href={`https://wa.me/${cleanWhatsAppPhone}?text=${encodeURIComponent(
                      `Hello ${lead.name}, this is your broker representative following up on your inquiry for ${lead.propertyTitle}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-medium transition-colors"
                    title="Direct WhatsApp"
                  >
                    <MessageSquare className="h-3 w-3 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 2. COMMAND CENTER SEGMENT NAVIGATION */}
          <div className="flex items-center gap-1 border-b border-stone-200 pb-px overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                activeTab === "overview"
                  ? "border-[#0d4a36] text-[#0d4a36] bg-[#0d4a36]/5 rounded-t-lg"
                  : "border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50"
              )}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Overview &amp; Property</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("qualification")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                activeTab === "qualification"
                  ? "border-[#0d4a36] text-[#0d4a36] bg-[#0d4a36]/5 rounded-t-lg"
                  : "border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              <span>Qualification &amp; Score</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {lead.score}/100
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("calls")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                activeTab === "calls"
                  ? "border-[#0d4a36] text-[#0d4a36] bg-[#0d4a36]/5 rounded-t-lg"
                  : "border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50"
              )}
            >
              <PhoneCall className="h-3.5 w-3.5 text-emerald-700" />
              <span>Voice Calls &amp; Audio</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700 font-bold">
                {connectedCalls.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                activeTab === "timeline"
                  ? "border-[#0d4a36] text-[#0d4a36] bg-[#0d4a36]/5 rounded-t-lg"
                  : "border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50"
              )}
            >
              <History className="h-3.5 w-3.5" />
              <span>Timeline Log</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700 font-bold">
                {lead.activities?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("supervision")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                activeTab === "supervision"
                  ? "border-[#0d4a36] text-[#0d4a36] bg-[#0d4a36]/5 rounded-t-lg"
                  : "border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-700" />
              <span>Supervision</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & PROPERTY */}
          {activeTab === "overview" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Operational Next-Action Directive Card */}
              <LeadNextActionCard
                directive={lead.nextActionDirective}
                fallbackAction={lead.nextAction}
                onExecuteAction={() => {
                  toast.info("Action Protocol Triggered", {
                    description: `Executing: ${lead.nextActionDirective?.action || lead.nextAction}`,
                  });
                }}
              />

              {/* Commercial Profile Summary — Clean Unboxed Key Metrics Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/70 py-1 px-1 gap-3 sm:gap-0">
                <div className="sm:pr-5 space-y-0.5">
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
                    Declared Allocation
                  </span>
                  <p className="font-mono text-base font-bold text-stone-900 tabular-nums">
                    {lead.budget}
                  </p>
                  <span className="text-[11px] text-stone-500 block">
                    Timeline: {lead.timeline}
                  </span>
                </div>

                <div className="pt-2 sm:pt-0 sm:px-5 space-y-0.5">
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
                    Assigned Sales Pod
                  </span>
                  <p className="text-xs font-semibold text-stone-900 flex items-center gap-1.5 mt-1">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{lead.assignedBroker || "Lekki Luxury Pod"}</span>
                  </p>
                  <span className="text-[11px] text-stone-500 block">
                    Autonomous AI Supervision
                  </span>
                </div>

                <div className="pt-2 sm:pt-0 sm:pl-5 space-y-0.5">
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
                    Transaction Intent
                  </span>
                  <p className="text-xs font-semibold text-stone-900 flex items-center gap-1.5 mt-1">
                    <Building className="h-3.5 w-3.5 text-[#0d4a36]" />
                    <span>{lead.intent} Acquisition</span>
                  </p>
                  <span className="text-[11px] text-stone-500 block">
                    Target Corridor: {lead.location}
                  </span>
                </div>
              </div>

              {/* Target Property Inventory Connection */}
              {!lead.property && !lead.propertyDetails ? (
                <PropertyUnknownState
                  prospectPreference={{
                    declaredBudget: lead.budget,
                    location: lead.location,
                    intent: lead.intent,
                  }}
                  onMatchProperty={() => {
                    toast.info("Opening Property Matching Inventory", {
                      description: `Searching active listings matching ${lead.budget} in ${lead.location}...`,
                    });
                  }}
                />
              ) : lead.property ? (
                <div className="space-y-3">
                  {(lead.property.availability === "Unavailable" || lead.property.availability === "Sold") && (
                    <PropertyUnavailableState
                      property={lead.property}
                      onViewSpecs={() => setSelectedPropertyForSpecs(lead.property!)}
                      onSelectAlternative={(altId) => {
                        toast.info("Alternative Listing Selected", {
                          description: `Replaced active interest with property ${altId}.`,
                        });
                      }}
                    />
                  )}
                  <PropertyCard
                    property={lead.property}
                    declaredBudget={lead.budget}
                    intent={lead.intent}
                    budgetMatch={lead.propertyDetails?.budgetMatch || "Within Budget"}
                    onInspectFullSpecs={(prop: Property) => setSelectedPropertyForSpecs(prop)}
                  />
                </div>
              ) : (
                <LeadPropertyCard
                  property={lead.propertyDetails}
                  fallbackTitle={lead.propertyTitle}
                  fallbackLocation={lead.location}
                  declaredBudget={lead.budget}
                  intent={lead.intent}
                />
              )}
            </div>
          )}

          {/* TAB 2: QUALIFICATION & SCORE */}
          {activeTab === "qualification" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <QualificationPanel
                lead={lead}
                onObjectionStatusChange={(objectionId, status, note) =>
                  handleObjectionToggle(objectionId, status, note)
                }
              />
            </div>
          )}

          {/* TAB 3: VOICE CALLS & AUDIO */}
          {activeTab === "calls" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Connected Vapi Voice Telephony</span>
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    Live synthetic playback, conversational metrics, and turn transcripts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-stone-400 font-medium">
                    {connectedCalls.length} Records Found
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setIsInitiateCallOpen(true)}
                    className="h-7 text-[11px] bg-[#0d4a36] hover:bg-[#0a3a2a] text-white shadow-2xs cursor-pointer gap-1.5 font-medium px-2.5"
                  >
                    <PhoneCall className="h-3 w-3" />
                    <span>Dispatch Vapi Call</span>
                  </Button>
                </div>
              </div>

              {isLoadingCalls ? (
                <div className="h-40 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-xs text-stone-500">
                  <span>Loading voice call records...</span>
                </div>
              ) : connectedCalls.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-400 mx-auto">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-semibold text-stone-900">
                    No Voice Interactions Recorded Yet
                  </h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    This lead was captured via {lead.source || "inbound channel"}. An autonomous Vapi voice qualification call is queued or can be triggered directly by the broker.
                  </p>
                  <div className="pt-2">
                    <Button
                      size="sm"
                      onClick={() => setIsInitiateCallOpen(true)}
                      className="h-8 text-xs bg-[#0d4a36] hover:bg-[#0a3a2a] text-white cursor-pointer shadow-2xs font-medium"
                    >
                      <PhoneCall className="h-3.5 w-3.5 mr-1.5" />
                      <span>Initiate AI Telephony Call</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {connectedCalls.map((call) => (
                    <div
                      key={call.id}
                      className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-4"
                    >
                      {/* Call Telemetry Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900 text-xs">
                              {call.agentPersona || "Neural Executive (Sarah)"}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              • {call.relativeTime}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Subject Property: <strong className="text-stone-700">{call.propertyTitle}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCallInspection(call.id)}
                            className="h-7 text-xs px-2.5 bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            <span>Inspect in Call Cockpit</span>
                          </Button>
                        </div>
                      </div>

                      {/* Embedded Audio Player */}
                      <CallAudioPlayer
                        callId={call.id}
                        leadName={call.leadName}
                        recordingState={call.recordingState}
                        durationSeconds={call.audioDurationSeconds}
                      />

                      {/* AI Call Summary */}
                      <CallSummaryCard
                        summary={call.summary}
                        leadName={call.leadName}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INTERACTION TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <LeadActivityTimeline
                activities={lead.activities}
                onAddNote={handleAddTimelineNote}
                onRetryActivity={handleRetryActivity}
                onInspectCall={handleOpenCallInspection}
              />
            </div>
          )}

          {/* TAB 5: SUPERVISION & DIRECTIVES */}
          {activeTab === "supervision" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <HumanSupervisionCockpit
                lead={lead}
                onTakeover={(brokerName, reason) => onTakeover?.(lead.id, brokerName, reason)}
                onStopAI={(reason) => onStopAI?.(lead.id, reason)}
                onResumeAI={() => onResumeAI?.(lead.id)}
                onMarkNurture={(schedule, notes) => onMarkNurture?.(lead.id, schedule, notes)}
                onMarkLost={(lossDetails) => onMarkLost?.(lead.id, lossDetails)}
                onUpdateSchedule={(schedule) => onUpdateSchedule?.(lead.id, schedule)}
              />
            </div>
          )}
        </div>
      )}

      {/* Deep-Dive Property Detail Presentation Modal */}
      <PropertyDetailPresentation
        property={selectedPropertyForSpecs}
        open={!!selectedPropertyForSpecs}
        onOpenChange={(open) => {
          if (!open) setSelectedPropertyForSpecs(null);
        }}
        leadName={lead?.name}
        leadPhone={lead?.phone}
        leadEmail={lead?.email}
      />

      {/* Embedded Deep-Dive Call Detail Cockpit Modal */}
      {selectedCallForCockpit && (
        <CallDetailCockpit
          call={selectedCallForCockpit}
          onClose={() => setSelectedCallForCockpit(null)}
          onTakeover={(call) => {
            onTakeover?.(lead?.id || "", "Marcus Vance", `Takeover from Call ${call.id}`);
            setSelectedCallForCockpit(null);
          }}
        />
      )}

      {/* Day 14: Vapi Call Initiation Dialog */}
      {lead && (
        <InitiateCallDialog
          open={isInitiateCallOpen}
          onOpenChange={setIsInitiateCallOpen}
          defaultLeadId={lead.id}
          onCallCompleted={(newCall) => {
            setConnectedCalls((prev) => [newCall, ...prev]);
            toast.success("Voice Session Active", {
              description: `Vapi call with ${lead.name} recorded and added to timeline.`,
            });
          }}
        />
      )}
    </DetailDrawer>
  );
}

