"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { Lead, FollowUpSchedule, LossDetails } from "../types";
import { HandoffContextCard } from "./handoff-context-card";
import { RecommendedActionCard } from "./recommended-action-card";
import { FollowUpScheduleCard } from "./follow-up-schedule-card";
import { MarkLostDialog } from "./mark-lost-dialog";
import { MarkNurtureDialog } from "./mark-nurture-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  PauseCircle,
  PlayCircle,
  CalendarHeart,
  UserX,
  AlertTriangle,
  Bot,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface HumanSupervisionCockpitProps {
  lead: Lead;
  onTakeover?: (brokerName?: string, reason?: string) => Promise<void> | void;
  onStopAI?: (reason?: string) => Promise<void> | void;
  onResumeAI?: () => Promise<void> | void;
  onMarkNurture?: (schedule: FollowUpSchedule, notes?: string) => Promise<void> | void;
  onMarkLost?: (lossDetails: LossDetails) => Promise<void> | void;
  onUpdateSchedule?: (schedule: FollowUpSchedule) => Promise<void> | void;
  className?: string;
}

export function HumanSupervisionCockpit({
  lead,
  onTakeover,
  onStopAI,
  onResumeAI,
  onMarkNurture,
  onMarkLost,
  onUpdateSchedule,
  className,
}: HumanSupervisionCockpitProps) {
  const [isLostDialogOpen, setIsLostDialogOpen] = React.useState(false);
  const [isNurtureDialogOpen, setIsNurtureDialogOpen] = React.useState(false);
  const [isActing, setIsActing] = React.useState(false);

  const isHumanManaged = lead.status === "Human Managed" || lead.managementMode === "human_managed";
  const isLost = lead.status === "Lost" || lead.managementMode === "lost";
  const isNurture = lead.status === "Nurture" || lead.managementMode === "nurture";

  const handleTakeoverClick = async () => {
    setIsActing(true);
    try {
      await onTakeover?.("Marcus Vance", "Broker manual takeover from lead dossier");
      toast.success("Broker Takeover Complete", {
        description: `Autonomous AI paused. You now have full operational leadership over ${lead.name}.`,
      });
    } catch {
      toast.error("Takeover failed. Please retry.");
    } finally {
      setIsActing(false);
    }
  };

  const handleStopAIClick = async () => {
    setIsActing(true);
    try {
      await onStopAI?.("Broker paused autonomous AI automation");
      toast.warning("AI Engine Paused", {
        description: `Autonomous voice and chat paused for ${lead.name}.`,
      });
    } catch {
      toast.error("Failed to pause AI");
    } finally {
      setIsActing(false);
    }
  };

  const handleResumeAIClick = async () => {
    setIsActing(true);
    try {
      await onResumeAI?.();
      toast.success("AI Engine Resumed", {
        description: `Autonomous voice and chat resumed for ${lead.name}.`,
      });
    } catch {
      toast.error("Failed to resume AI");
    } finally {
      setIsActing(false);
    }
  };

  const handleConfirmLost = async (lossDetails: LossDetails) => {
    setIsActing(true);
    try {
      await onMarkLost?.(lossDetails);
      toast.error("Deal Marked as Lost", {
        description: `${lead.name} marked as lost (${lossDetails.reasonLabel}).`,
      });
    } catch {
      toast.error("Failed to mark as lost");
    } finally {
      setIsActing(false);
    }
  };

  const handleConfirmNurture = async (schedule: FollowUpSchedule, notes?: string) => {
    setIsActing(true);
    try {
      await onMarkNurture?.(schedule, notes);
      toast.success("Moved to Nurture Pipeline", {
        description: `Follow-up set for ${schedule.scheduledFormatted} (${schedule.relativeCountdown}).`,
      });
    } catch {
      toast.error("Failed to set nurture schedule");
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 1. Human Supervision Control Toolbar */}
      <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Supervision Protocol:
            </span>
            {isHumanManaged ? (
              <Badge
                variant="outline"
                className="bg-sky-50 text-sky-800 border-sky-200 gap-1.5 py-0.5 px-2 text-xs font-semibold"
              >
                <UserCheck className="h-3.5 w-3.5 text-sky-700" />
                <span>Human Managed ({lead.assignedBroker || "Assigned Broker"})</span>
              </Badge>
            ) : isLost ? (
              <Badge
                variant="outline"
                className="bg-rose-50 text-rose-800 border-rose-200 gap-1.5 py-0.5 px-2 text-xs font-semibold"
              >
                <UserX className="h-3.5 w-3.5 text-rose-700" />
                <span>Opportunity Lost</span>
              </Badge>
            ) : isNurture ? (
              <Badge
                variant="outline"
                className="bg-teal-50 text-teal-800 border-teal-200 gap-1.5 py-0.5 px-2 text-xs font-semibold"
              >
                <CalendarHeart className="h-3.5 w-3.5 text-teal-700" />
                <span>Nurture Pipeline</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-800 border-emerald-200 gap-1.5 py-0.5 px-2 text-xs font-semibold"
              >
                <Bot className="h-3.5 w-3.5 text-emerald-700" />
                <span>AI Autonomous Queue</span>
              </Badge>
            )}

            {lead.isAiStopped && !isLost && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-200 text-[11px] font-medium gap-1 py-0.5"
              >
                <PauseCircle className="h-3 w-3 text-amber-600" />
                <span>AI Paused</span>
              </Badge>
            )}
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Take Over Button */}
            {!isHumanManaged && !isLost && (
              <Button
                size="sm"
                onClick={handleTakeoverClick}
                disabled={isActing}
                className="h-7 gap-1.5 bg-[#0d4a36] hover:bg-[#093829] text-white text-xs font-semibold shadow-2xs cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Take Over</span>
              </Button>
            )}

            {/* Stop AI / Resume AI Button */}
            {!isLost && (
              lead.isAiStopped ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResumeAIClick}
                  disabled={isActing}
                  className="h-7 gap-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-medium cursor-pointer shadow-2xs"
                >
                  <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Resume AI</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStopAIClick}
                  disabled={isActing}
                  className="h-7 gap-1.5 bg-white hover:bg-amber-50 text-amber-800 border-amber-200 text-xs font-medium cursor-pointer shadow-2xs"
                >
                  <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Stop AI</span>
                </Button>
              )
            )}

            {/* Mark Nurture */}
            {!isLost && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNurtureDialogOpen(true)}
                disabled={isActing}
                className="h-7 gap-1.5 bg-white hover:bg-teal-50 text-teal-800 border-teal-200 text-xs font-medium cursor-pointer shadow-2xs"
              >
                <CalendarHeart className="h-3.5 w-3.5 text-teal-600" />
                <span>Mark Nurture</span>
              </Button>
            )}

            {/* Mark Lost */}
            {!isLost && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLostDialogOpen(true)}
                disabled={isActing}
                className="h-7 gap-1.5 bg-white hover:bg-rose-50 text-rose-700 border-rose-200 text-xs font-medium cursor-pointer shadow-2xs"
              >
                <UserX className="h-3.5 w-3.5 text-rose-600" />
                <span>Mark Lost</span>
              </Button>
            )}
          </div>
        </div>

        {/* AI Paused Notice Banner */}
        {lead.isAiStopped && !isLost && (
          <div className="rounded-lg bg-amber-50/80 border border-amber-200 p-2 text-xs text-amber-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="font-medium">
                {lead.aiStoppedReason || "Autonomous AI outbound sequences are paused for this prospect."}
              </span>
            </div>
            <button
              type="button"
              onClick={handleResumeAIClick}
              className="text-[11px] font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer shrink-0"
            >
              Resume AI Now
            </button>
          </div>
        )}

        {/* Lost Details Banner */}
        {isLost && lead.lossDetails && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-900 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <UserX className="h-3.5 w-3.5 text-rose-600" />
                <span>Disqualified: {lead.lossDetails.reasonLabel}</span>
              </span>
              <span className="text-[11px] text-rose-700">{lead.lossDetails.lostAt}</span>
            </div>
            {lead.lossDetails.notes && (
              <p className="text-rose-800 text-[11px] pl-5">{lead.lossDetails.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* 2. Display Handoff Context (When present or taken over) */}
      {lead.handoffContext && (
        <HandoffContextCard handoffContext={lead.handoffContext} />
      )}

      {/* 3. Display Recommended Action */}
      {lead.recommendedAction && !isLost && (
        <RecommendedActionCard
          action={lead.recommendedAction}
          leadName={lead.name}
          leadPhone={lead.phone}
          leadEmail={lead.email}
        />
      )}

      {/* 4. Display Follow-up Schedule */}
      {lead.followUpSchedule && !isLost && (
        <FollowUpScheduleCard
          schedule={lead.followUpSchedule}
          leadName={lead.name}
          onUpdateSchedule={onUpdateSchedule}
        />
      )}

      {/* Dialogs */}
      <MarkLostDialog
        open={isLostDialogOpen}
        onOpenChange={setIsLostDialogOpen}
        leadName={lead.name}
        onConfirm={handleConfirmLost}
      />

      <MarkNurtureDialog
        open={isNurtureDialogOpen}
        onOpenChange={setIsNurtureDialogOpen}
        leadName={lead.name}
        onConfirm={handleConfirmNurture}
      />
    </div>
  );
}
