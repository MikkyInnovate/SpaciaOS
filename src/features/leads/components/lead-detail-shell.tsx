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
} from "lucide-react";
import { toast } from "sonner";

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
  isLoading = false,
}: LeadDetailShellProps) {
  const [copiedPhone, setCopiedPhone] = React.useState(false);
  const [selectedPropertyForSpecs, setSelectedPropertyForSpecs] = React.useState<Property | null>(null);
  const [prevLeadId, setPrevLeadId] = React.useState(lead?.id);

  // Cleanly reset property inspection when switching leads
  if (lead?.id !== prevLeadId) {
    setPrevLeadId(lead?.id);
    setSelectedPropertyForSpecs(null);
  }

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

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        lead ? (
          <div className="flex items-center gap-2.5 truncate">
            <span className="truncate">{lead.name}</span>
          </div>
        ) : (
          "Loading Prospect Dossier..."
        )
      }
      description={
        lead ? (
          <span>
            Lead ID: <strong className="font-mono text-stone-900">{lead.id}</strong> • Ingested {lead.createdAt}
            {lead.source ? ` • via ${lead.source}` : ""}
          </span>
        ) : undefined
      }
      icon={<User className="h-4 w-4" />}
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
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full text-xs text-stone-500">
          <span>Pacia Real-Estate Sales Operating System</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs cursor-pointer bg-white"
          >
            Close Dossier
          </Button>
        </div>
      }
    >
      {lead && (
        <div className="space-y-5 pb-2">
          {/* 1. Quick Broker Action Bar: Stage Switcher + Direct Contact */}
          <div className="rounded-xl border border-stone-200 bg-white p-3 flex flex-wrap items-center justify-between gap-3">
            <LeadStatusSelect
              currentStatus={lead.status}
              onStatusChange={handleStatusUpdate}
            />

            <div className="flex items-center gap-2">
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
                <span className="hidden sm:inline">Email</span>
              </a>
            </div>
          </div>

          {/* Day 13: Human-in-the-Loop Supervision Cockpit */}
          <HumanSupervisionCockpit
            lead={lead}
            onTakeover={(brokerName, reason) => onTakeover?.(lead.id, brokerName, reason)}
            onStopAI={(reason) => onStopAI?.(lead.id, reason)}
            onResumeAI={() => onResumeAI?.(lead.id)}
            onMarkNurture={(schedule, notes) => onMarkNurture?.(lead.id, schedule, notes)}
            onMarkLost={(lossDetails) => onMarkLost?.(lead.id, lossDetails)}
            onUpdateSchedule={(schedule) => onUpdateSchedule?.(lead.id, schedule)}
          />

          {/* 2. Operational Next-Action Directive Card */}
          <LeadNextActionCard
            directive={lead.nextActionDirective}
            fallbackAction={lead.nextAction}
            onExecuteAction={() => {
              toast.info("Action Protocol Triggered", {
                description: `Executing: ${lead.nextActionDirective?.action || lead.nextAction}`,
              });
            }}
          />

          {/* 3. Commercial Profile & Assigned Broker Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-1">
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                Declared Budget
              </span>
              <p className="font-mono text-base font-bold text-stone-900 tabular-nums">
                {lead.budget}
              </p>
              <span className="text-[11px] text-stone-500 block">
                Timeline: {lead.timeline}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-1">
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
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

            <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-1">
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                Transaction Intent
              </span>
              <p className="text-xs font-semibold text-stone-900 flex items-center gap-1.5 mt-1">
                <Building className="h-3.5 w-3.5 text-[#0d4a36]" />
                <span>{lead.intent} Acquisition</span>
              </p>
              <span className="text-[11px] text-stone-500 block">
                Primary Residential Goal
              </span>
            </div>
          </div>

          {/* 4. Target Property Intelligence & Inventory Link */}
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

          {/* 5. Comprehensive Autonomous Qualification Dossier (Day 11) */}
          <QualificationPanel lead={lead} />

          {/* 6. Chronological Multi-Channel Activity Timeline */}
          <LeadActivityTimeline
            activities={lead.activities}
            onAddNote={handleAddTimelineNote}
            onRetryActivity={handleRetryActivity}
          />
        </div>
      )}

      {/* 7. Deep-Dive Property Detail Presentation Modal */}
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
    </DetailDrawer>
  );
}
