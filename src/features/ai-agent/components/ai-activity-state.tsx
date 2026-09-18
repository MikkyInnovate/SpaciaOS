"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { ActiveCallTelemetry, AIAgentRecentActivity } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Building,
  Sparkles,
  UserCheck,
  Volume2,
  VolumeX,
  Radio,
  PhoneOff,
  CheckCircle2,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export interface AIAgentActivityStateProps {
  activeCall?: ActiveCallTelemetry | null;
  activeCalls?: ActiveCallTelemetry[];
  maxConcurrency?: number;
  recentActivities: AIAgentRecentActivity[];
  onDisconnectCall?: (callId: string) => void;
  onTakeoverCall?: (callId: string) => void;
  className?: string;
}

export function AIAgentActivityState({
  activeCall,
  activeCalls,
  maxConcurrency = 5,
  recentActivities,
  onDisconnectCall,
  onTakeoverCall,
  className,
}: AIAgentActivityStateProps) {
  // Consolidate calls
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
  // Live Audio Monitoring (listening in on real-time neural speech stream)
  const [isAudioMonitoring, setIsAudioMonitoring] = React.useState(true);

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

  return (
    <div className={cn("space-y-4", className)}>
      {/* 1. Live Active Call Radar Card */}
      <Card className="rounded-lg border border-border bg-white shadow-2xs overflow-hidden">
        {/* Card Header matching Spacia Lead Intake Table header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-stone-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-stone-900">
                Live Voice Radar
              </h2>
              {currentCall ? (
                <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {calls.length} Active Line{calls.length > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                  Standby
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Real-time neural speech stream &amp; automated BANT qualification
            </p>
          </div>

          {currentCall && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7.5 px-2.5 text-xs text-stone-700 bg-white hover:bg-stone-50 cursor-pointer shadow-2xs border-stone-200"
                onClick={handleTerminate}
              >
                <PhoneOff className="h-3.5 w-3.5 text-stone-400 mr-1" />
                <span>Disconnect</span>
              </Button>
              <Button
                size="sm"
                variant="default"
                className="h-7.5 px-3 text-xs gap-1.5 bg-stone-900 hover:bg-stone-800 text-white shadow-2xs cursor-pointer"
                onClick={handleTakeover}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Take Lead</span>
              </Button>
            </div>
          )}
        </div>

        {/* Multi-Line Workstation Tab Navigation (matching Spacia Lead Dossier Tabs) */}
        {calls.length > 0 && (
          <div className="flex items-center justify-between border-b border-border bg-stone-50/40 px-4 pt-1.5 text-xs">
            <div className="flex items-center overflow-x-auto scrollbar-none -mb-px">
              {calls.map((c, idx) => {
                const isSelected = c.callId === currentCall.callId;
                const lineNum = c.lineNumber ?? (idx + 1);
                const dur = formatDuration(
                  (c.durationSeconds ?? 0) + elapsedSeconds
                );
                return (
                  <button
                    key={c.callId}
                    type="button"
                    onClick={() => setSelectedCallId(c.callId)}
                    className={cn(
                      "flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs transition-all cursor-pointer whitespace-nowrap",
                      isSelected
                        ? "border-stone-900 text-stone-900 font-semibold bg-white rounded-t-md shadow-2xs"
                        : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300 font-medium"
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                    <span>
                      Call {lineNum}: {c.leadName.split(" ").slice(0, 2).join(" ")}
                    </span>
                    <span className="font-mono text-[11px] text-stone-400 font-normal">
                      ({dur})
                    </span>
                    {c.score && (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.2 text-[10px] font-bold shrink-0",
                          isSelected
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-stone-100 text-stone-600 border border-stone-200"
                        )}
                      >
                        {c.score} HOT
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Standby Open Channels */}
              {Array.from({
                length: Math.max(0, maxConcurrency - calls.length),
              }).map((_, i) => {
                const lineNum = calls.length + i + 1;
                return (
                  <div
                    key={`open-${i}`}
                    className="flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-xs text-stone-400 select-none whitespace-nowrap shrink-0 opacity-70"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300 shrink-0" />
                    <span>Line {lineNum} (Open)</span>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-1.5 pb-2 text-[11px] font-medium text-stone-500 shrink-0 whitespace-nowrap">
              <Radio className="h-3 w-3 text-emerald-600" />
              <span>
                {calls.length} / {maxConcurrency} Channels In Use
              </span>
            </div>
          </div>
        )}

        <CardContent className="p-4 space-y-4 text-xs">
          {!currentCall ? (
            <div className="py-12 text-center space-y-2">
              <Phone className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="font-semibold text-stone-800 text-sm">Voice Line Standby</p>
              <p className="text-stone-500 text-xs">
                No active voice call in progress. Next automated queue sweep scheduled in 2 minutes.
              </p>
            </div>
          ) : (
            <>
              {/* Prospect Metadata Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-900 text-sm">
                    {currentCall.leadName}
                  </span>
                  <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                    {currentCall.score ?? 94} HOT
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-500 font-mono">{currentCall.leadPhone}</span>
                </div>

                <div className="flex items-center gap-1.5 text-stone-600">
                  <Building className="h-3.5 w-3.5 text-stone-400" />
                  <span className="font-medium text-stone-900">{currentCall.propertyTitle}</span>
                </div>
              </div>

              {/* Live Audio Monitoring Stream (listening in to real-time speech) */}
              <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50/80 p-3">
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    className={cn(
                      "h-8 w-8 rounded-full shadow-2xs cursor-pointer shrink-0 transition-colors",
                      isAudioMonitoring
                        ? "bg-white text-stone-900 border-stone-300 hover:bg-stone-50"
                        : "bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200"
                    )}
                    onClick={() => setIsAudioMonitoring(!isAudioMonitoring)}
                    title={
                      isAudioMonitoring
                        ? "Mute live audio monitor"
                        : "Listen in live to caller audio"
                    }
                    aria-label={
                      isAudioMonitoring
                        ? "Mute live audio monitor"
                        : "Listen in live to caller audio"
                    }
                  >
                    {isAudioMonitoring ? (
                      <Volume2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-stone-400" />
                    )}
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-stone-900">
                        Live Audio Monitor — Line {currentCall.lineNumber ?? 1}
                      </p>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider",
                          isAudioMonitoring
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-stone-100 text-stone-500 border border-stone-200"
                        )}
                      >
                        {isAudioMonitoring ? "Listening In" : "Monitor Muted"}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      {isAudioMonitoring
                        ? "Live speech stream active • 380ms Latency • Step: " +
                          (currentCall.currentStep === "evaluating_bant"
                            ? "Evaluating BANT"
                            : currentCall.currentStep === "synthesizing_speech"
                            ? "Synthesizing Speech"
                            : currentCall.currentStep.replace(/_/g, " "))
                        : "Operator monitor muted • Click speaker icon to listen in live"}
                    </p>
                  </div>
                </div>

                {/* Subtle light equalizer bars reflecting live audio feed */}
                <div
                  className="flex items-center gap-1"
                  title={
                    isAudioMonitoring
                      ? "Live audio stream active"
                      : "Audio monitor muted"
                  }
                >
                  {[4, 8, 14, 20, 12, 18, 24, 16, 22, 12, 6, 14, 20, 18, 10, 6].map(
                    (h, i) => (
                      <span
                        key={i}
                        className={cn(
                          "w-1 rounded-full transition-all duration-200",
                          isAudioMonitoring
                            ? "bg-emerald-600 animate-pulse"
                            : "bg-stone-200"
                        )}
                        style={{
                          height: isAudioMonitoring
                            ? `${Math.min(24, Math.max(5, (h * ((i % 3) + 2)) % 25))}px`
                            : "4px",
                        }}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Executive Context Summary Box (matching Homepage) */}
              <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-700">
                  <Sparkles className="h-3 w-3 text-stone-500" />
                  <span>Executive AI Call Summary</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-normal">
                  {currentCall.executiveSummary ??
                    (currentCall.budget
                      ? `Budget pre-confirmed at ${currentCall.budget}. Qualified purchase intent.`
                      : "Budget pre-confirmed via corporate equity sale. Verified title registry details. Urgent closing window.")}
                </p>
              </div>

              {/* Conversation Turns (matching Homepage Lead Dossier Panel) */}
              <div className="space-y-3 text-xs leading-relaxed max-h-56 overflow-y-auto pr-1">
                {currentCall.liveTranscript.map((turn, idx) =>
                  turn.speaker === "ai" ? (
                    <div
                      key={idx}
                      className="rounded-lg bg-stone-50 p-3 border border-stone-100 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-emerald-700" />
                          Spacia AI Agent
                        </span>
                        <span className="text-stone-400 font-mono">{turn.timestamp}</span>
                      </div>
                      <p className="text-stone-700">&ldquo;{turn.text}&rdquo;</p>
                    </div>
                  ) : (
                    <div
                      key={idx}
                      className="rounded-lg bg-white p-3 border border-stone-200 space-y-1 ml-4 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-900">
                        <span>{currentCall.leadName} (Prospect)</span>
                        <span className="text-stone-400 font-mono">{turn.timestamp}</span>
                      </div>
                      <p className="text-stone-800">&ldquo;{turn.text}&rdquo;</p>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 2. Recent AI Executions Feed (Styled like Homepage Recent Feed) */}
      <div className="rounded-lg border border-border bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4 bg-stone-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-stone-900">
                Recent AI Dispatches
              </h2>
              <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Live Feed
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Autonomous qualification, bookings, and human handoffs
            </p>
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          {recentActivities.map((act) => {
            const getIcon = () => {
              switch (act.type) {
                case "hot_qualified":
                  return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
                case "viewing_booked":
                  return <CalendarCheck className="h-3.5 w-3.5 text-purple-600" />;
                case "handoff_escalated":
                  return <UserCheck className="h-3.5 w-3.5 text-amber-600" />;
                case "dropped_retry":
                  return <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />;
                default:
                  return <Radio className="h-3.5 w-3.5 text-stone-500" />;
              }
            };

            return (
              <div
                key={act.id}
                className="flex items-center justify-between rounded-lg border border-stone-200/80 bg-white p-3 hover:bg-stone-50/60 transition-colors shadow-2xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">{getIcon()}</div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900 text-xs">
                        {act.leadName}
                      </span>
                      <span className="rounded bg-stone-100 px-1.5 py-0.2 text-[10px] font-semibold text-stone-700 border border-stone-200">
                        {act.outcomeTag}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-snug">{act.description}</p>
                    {act.propertyTitle && (
                      <p className="text-[11px] text-stone-400 font-medium">
                        {act.propertyTitle}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-stone-400 font-mono shrink-0 ml-3">
                  {act.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
