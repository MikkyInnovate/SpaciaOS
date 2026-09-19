"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { ActiveCallTelemetry, AIAgentRecentActivity } from "../types";
import { Button } from "@/components/ui/button";
import {
  PhoneCall,
  UserCheck,
  PhoneOff,
  CheckCircle2,
  CalendarCheck,
  AlertTriangle,
  Radio,
  ExternalLink,
  ArrowUpRight,
  Clock,
  Building2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface AIAgentActivityStateProps {
  activeCall?: ActiveCallTelemetry | null;
  activeCalls?: ActiveCallTelemetry[];
  maxConcurrency?: number;
  isOutboundPaused?: boolean;
  onToggleDialer?: () => void;
  recentActivities: AIAgentRecentActivity[];
  onDisconnectCall?: (callId: string) => void;
  onTakeoverCall?: (callId: string) => void;
  className?: string;
}

type ActivityFilterType =
  | "all"
  | "viewing_booked"
  | "hot_qualified"
  | "handoff_escalated"
  | "dropped_retry";

export function AIAgentActivityState({
  activeCall,
  activeCalls,
  maxConcurrency = 5,
  isOutboundPaused = false,
  onToggleDialer,
  recentActivities,
  onDisconnectCall,
  onTakeoverCall,
  className,
}: AIAgentActivityStateProps) {
  // Consolidate active calls
  const calls = React.useMemo(() => {
    if (activeCalls && activeCalls.length > 0) return activeCalls;
    if (activeCall) return [activeCall];
    return [];
  }, [activeCalls, activeCall]);

  const [selectedCallId, setSelectedCallId] = React.useState<string | null>(null);
  const currentCall =
    calls.find((c) => c.callId === selectedCallId) ?? calls[0] ?? null;

  // Track live duration elapsed
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [activityFilter, setActivityFilter] = React.useState<ActivityFilterType>("all");

  React.useEffect(() => {
    if (!calls.length) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [calls.length]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const handleTakeover = () => {
    if (!currentCall) return;
    if (onTakeoverCall) {
      onTakeoverCall(currentCall.callId);
    } else {
      toast.success("Broker Takeover Active", {
        description: `Transferred ${currentCall.leadName} directly to broker sales desk.`,
      });
    }
  };

  const handleTerminate = () => {
    if (!currentCall) return;
    if (onDisconnectCall) {
      onDisconnectCall(currentCall.callId);
    } else {
      toast.warning("Call Terminated", {
        description: `Call session for ${currentCall.leadName} safely disconnected.`,
      });
    }
  };

  // Filter activities
  const filteredActivities = React.useMemo(() => {
    if (activityFilter === "all") return recentActivities;
    return recentActivities.filter((act) => act.type === activityFilter);
  }, [recentActivities, activityFilter]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* 1. Compact Active Call Command Strip (Replacing the bulky 400px player/transcript) */}
      {currentCall ? (
        <div className="rounded-lg border border-emerald-200/90 bg-emerald-50/40 p-3 sm:p-3.5 shadow-2xs transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Caller Identity & Telephony Context */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0d4a36]" />
              </span>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-900 text-xs sm:text-sm">
                    Line {currentCall.lineNumber ?? 1}: {currentCall.leadName}
                  </span>
                  <span className="text-stone-400 text-xs hidden sm:inline">•</span>
                  <span className="text-stone-600 text-xs truncate max-w-[240px]">
                    {currentCall.propertyTitle}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-[3px] bg-white border border-emerald-200/90 text-[10px] font-mono text-[#0d4a36] font-semibold flex items-center gap-1 shrink-0 shadow-2xs">
                    <Clock className="h-3 w-3" />
                    {formatDuration((currentCall.durationSeconds ?? 0) + elapsedSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-stone-500">
                  <span>Phone: {currentCall.leadPhone}</span>
                  <span>•</span>
                  <span className="text-emerald-800 font-medium">
                    Step: {currentCall.currentStep.replace(/_/g, " ")}
                  </span>
                  <span className="hidden lg:inline text-stone-400 font-mono">
                    • 380ms neural latency
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Direct Link to Dedicated Calls Cockpit) */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <Link
                href="/calls"
                className="inline-flex items-center gap-1.5 h-7.5 px-3 text-xs font-semibold bg-[#0d4a36] hover:bg-[#093829] text-white rounded-md shadow-2xs transition-all cursor-pointer"
              >
                <PhoneCall className="h-3.5 w-3.5 text-emerald-300" />
                <span>Open in Calls Cockpit</span>
                <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
              </Link>

              <Button
                size="sm"
                variant="outline"
                onClick={handleTakeover}
                className="h-7.5 px-2.5 text-xs text-stone-800 bg-white hover:bg-stone-50 border-stone-200 shadow-2xs cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-stone-600 mr-1" />
                <span>Take Lead</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleTerminate}
                className="h-7.5 px-2 text-xs text-stone-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                title="Disconnect Line"
              >
                <PhoneOff className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : isOutboundPaused ? (
        /* Outbound Paused Banner - High Visual Impact */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50/90 p-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
            </span>
            <div>
              <span className="font-semibold text-rose-900">
                Outbound Fleet Halted:
              </span>{" "}
              <span className="text-rose-700 font-medium">
                Automated qualification dialer is paused. Active queues are frozen until resumed.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onToggleDialer && (
              <Button
                size="sm"
                onClick={onToggleDialer}
                className="h-7 px-2.5 text-xs bg-[#0d4a36] hover:bg-[#093829] text-white shadow-2xs font-semibold cursor-pointer gap-1"
              >
                <Radio className="h-3 w-3 text-emerald-300" />
                <span>Resume Fleet</span>
              </Button>
            )}
            <Link
              href="/calls"
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800 hover:text-rose-950 hover:underline px-1.5"
            >
              <span>View Call History</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* Standby State Banner */
        <div className="flex items-center justify-between rounded-lg border border-stone-200/90 bg-stone-50/60 p-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span className="font-medium text-stone-700">
              Autonomous Voice Engine Standby: All {maxConcurrency} concurrency channels operational.
            </span>
          </div>
          <Link
            href="/calls"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d4a36] hover:underline"
          >
            <span>View Call Records</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 2. Expanded Operational Activity & Dispatch History */}
      <div className="rounded-lg border border-border bg-white shadow-2xs overflow-hidden">
        {/* Card Header with Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border p-4 bg-stone-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-stone-900">
                Operational Activity &amp; Dispatch History
              </h2>
              <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Audit trail of voice qualifications, company calendar viewings, and human broker handoffs
            </p>
          </div>

          {/* Outcome Filter Chips (SpaciaOS Design System Standard) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { label: "All Activities", value: "all" },
                { label: "Bookings", value: "viewing_booked" },
                { label: "Qualified", value: "hot_qualified" },
                { label: "Escalations", value: "handoff_escalated" },
                { label: "Retries", value: "dropped_retry" },
              ] as const
            ).map((filter) => {
              const isSelected = activityFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActivityFilter(filter.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none whitespace-nowrap cursor-pointer",
                    isSelected
                      ? "bg-[#0d4a36] text-white font-semibold shadow-2xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity Feed Items */}
        <div className="p-4 space-y-2.5">
          {filteredActivities.map((act) => {
            const getIconConfig = () => {
              switch (act.type) {
                case "hot_qualified":
                  return {
                    icon: CheckCircle2,
                    containerClass: "bg-emerald-50 text-[#0d4a36] border-emerald-200/80",
                    tagClass: "bg-emerald-50 text-[#0d4a36] border-emerald-200/80",
                  };
                case "viewing_booked":
                  return {
                    icon: CalendarCheck,
                    containerClass: "bg-purple-50 text-purple-700 border-purple-200/80",
                    tagClass: "bg-purple-50 text-purple-800 border-purple-200/80",
                  };
                case "handoff_escalated":
                  return {
                    icon: UserCheck,
                    containerClass: "bg-amber-50 text-amber-800 border-amber-200/80",
                    tagClass: "bg-amber-50 text-amber-800 border-amber-200/80",
                  };
                case "dropped_retry":
                  return {
                    icon: AlertTriangle,
                    containerClass: "bg-rose-50 text-rose-700 border-rose-200/80",
                    tagClass: "bg-rose-50 text-rose-700 border-rose-200/80",
                  };
                default:
                  return {
                    icon: Radio,
                    containerClass: "bg-stone-100 text-stone-600 border-stone-200",
                    tagClass: "bg-stone-100 text-stone-700 border-stone-200",
                  };
              }
            };

            const config = getIconConfig();
            const Icon = config.icon;

            return (
              <div
                key={act.id}
                className="flex items-center justify-between rounded-md border border-stone-200/80 bg-white p-3 hover:border-stone-300 hover:bg-stone-50/50 transition-all shadow-2xs gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md border shrink-0 mt-0.5 shadow-2xs",
                      config.containerClass
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-900 text-xs">
                        {act.leadName}
                      </span>
                      <span
                        className={cn(
                          "rounded-[3px] px-1.5 py-0.2 text-[10px] font-mono font-semibold border",
                          config.tagClass
                        )}
                      >
                        {act.outcomeTag}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 leading-snug">
                      {act.description}
                    </p>

                    {act.propertyTitle && (
                      <p className="text-[11px] text-stone-400 font-medium flex items-center gap-1 pt-0.5">
                        <Building2 className="h-3 w-3 text-stone-400 shrink-0" />
                        <span className="truncate">{act.propertyTitle}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-stone-400 font-mono">
                    {act.timestamp}
                  </span>
                  <Link
                    href="/calls"
                    className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#0d4a36] hover:text-[#093829] hover:underline"
                  >
                    <span>View in Calls</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredActivities.length === 0 && (
            <div className="rounded-md border border-dashed border-stone-200 p-8 text-center bg-stone-50/50">
              <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-stone-700">
                No dispatches found in this category
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Select &ldquo;All Activities&rdquo; to view complete telemetry.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
