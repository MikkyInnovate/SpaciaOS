"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { Call } from "../types";
import { CallOutcomeBadge } from "./call-outcome-badge";
import { CallAudioPlayer } from "./call-audio-player";
import { CallMetricsStrip } from "./call-metrics-strip";
import { TranscriptViewer } from "./transcript-viewer";
import { CallSummaryCard } from "./call-summary-card";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Building,
  UserCheck,
  Share2,
  Calendar,
  FileText,
  Sparkles,
  Zap,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { toast } from "sonner";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export interface CallDetailCockpitProps {
  call: Call;
  onClose?: () => void;
  onTakeover?: (call: Call) => void;
  className?: string;
}

export function CallDetailCockpit({
  call,
  onClose,
  onTakeover,
  className,
}: CallDetailCockpitProps) {
  const [activeTab, setActiveTab] = React.useState<"transcript" | "summary" | "metrics">("transcript");
  const [activeTimestamp, setActiveTimestamp] = React.useState<number>(0);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const isProgrammaticScroll = React.useRef(false);

  const TABS = [
    {
      id: "transcript" as const,
      label: "Transcript",
      badge: `${call.transcript.length} turns`,
      icon: FileText,
    },
    {
      id: "summary" as const,
      label: "Executive Summary",
      badge: null,
      icon: Sparkles,
    },
    {
      id: "metrics" as const,
      label: "Speech Metrics & Latency",
      badge: call.metrics.durationFormatted,
      icon: Zap,
    },
  ];

  const handleTabClick = (tabId: "transcript" | "summary" | "metrics") => {
    setActiveTab(tabId);
    isProgrammaticScroll.current = true;

    // 1. Scroll tab button into center view horizontally
    tabRefs.current[tabId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    // 2. Smoothly scroll content container to target section
    const targetEl = sectionRefs.current[tabId];
    if (targetEl && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetTop = targetEl.offsetTop - 8;
      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    }

    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 700);
  };

  const handleScroll = () => {
    if (isProgrammaticScroll.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop + 90;

    const summaryEl = sectionRefs.current["summary"];
    const metricsEl = sectionRefs.current["metrics"];

    if (metricsEl && scrollTop >= metricsEl.offsetTop) {
      setActiveTab("metrics");
    } else if (summaryEl && scrollTop >= summaryEl.offsetTop) {
      setActiveTab("summary");
    } else {
      setActiveTab("transcript");
    }
  };

  const handleTakeover = () => {
    if (onTakeover) {
      onTakeover(call);
    } else {
      toast.success("Human Takeover Activated", {
        description: `Autonomous agent paused. Direct line assigned to on-call broker for ${call.leadName}.`,
      });
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${call.leadName}, this is Premier Realty following up on our voice call regarding ${call.propertyTitle}. Let me know if you would like to proceed with the viewing appointment.`
    );
    window.open(`https://wa.me/${call.leadPhone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-white border border-stone-200 rounded-xl shadow-2xs overflow-hidden",
        className
      )}
    >
      {/* 1. Cockpit Dossier Header (Client Profile & Spacious Layout) */}
      <div className="border-b border-stone-200 p-5 sm:p-5.5 bg-white space-y-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
            {/* Client Profile Avatar with Fallback */}
            <div className="relative shrink-0">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border border-stone-200/90 shadow-2xs ring-2 ring-stone-100">
                {call.leadAvatarUrl && (
                  <AvatarImage
                    src={call.leadAvatarUrl}
                    alt={call.leadName}
                    className="object-cover rounded-2xl"
                  />
                )}
                <AvatarFallback className="bg-[#0d4a36]/10 text-[#0d4a36] font-display font-bold text-sm sm:text-base rounded-2xl">
                  {getInitials(call.leadName)}
                </AvatarFallback>
              </Avatar>
              {call.recordingState === "live" && (
                <span
                  title="Live active call session"
                  className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse"
                />
              )}
            </div>

            {/* Client Identity & Metadata Hierarchy with Generous Breathing Room */}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-display text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-tight truncate">
                  {call.leadName}
                </h3>
                {call.isEscalated && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                    Takeover Alert
                  </span>
                )}
              </div>

              {/* Status Badges & Affiliation Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <CallOutcomeBadge outcome={call.outcome} size="sm" />
                <ScoreIndicator score={call.score} category={call.scoreCategory} variant="badge" size="sm" />
                {call.leadCompany && (
                  <span className="text-[11px] font-medium text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded-md border border-stone-200/60">
                    {call.leadCompany}
                  </span>
                )}
              </div>

              {/* Contact Information with Dedicated Interactive Chips */}
              <div className="flex items-center gap-2.5 text-xs text-stone-600 pt-0.5 flex-wrap">
                <a
                  href={`tel:${call.leadPhone}`}
                  className="inline-flex items-center gap-1.5 font-mono text-stone-600 hover:text-[#0d4a36] hover:border-[#0d4a36]/40 transition-colors bg-stone-50 hover:bg-emerald-50/40 border border-stone-200/80 px-2.5 py-1 rounded-md text-[11px] shadow-2xs"
                  title="Direct phone line"
                >
                  <Phone className="h-3 w-3 text-stone-400 shrink-0" />
                  <span>{call.leadPhone}</span>
                </a>
                {call.leadEmail && (
                  <a
                    href={`mailto:${call.leadEmail}`}
                    className="inline-flex items-center gap-1.5 text-stone-600 hover:text-[#0d4a36] hover:border-[#0d4a36]/40 transition-colors bg-stone-50 hover:bg-emerald-50/40 border border-stone-200/80 px-2.5 py-1 rounded-md text-[11px] truncate max-w-[240px] shadow-2xs"
                    title="Direct email address"
                  >
                    <Mail className="h-3 w-3 text-stone-400 shrink-0" />
                    <span className="truncate">{call.leadEmail}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
              onClick={onClose}
              aria-label="Close sidepanel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Commercial Property Context Card with Clear Spacing */}
        <div className="flex items-center justify-between rounded-lg border border-stone-200/90 bg-stone-50/60 p-3.5 text-xs gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-stone-200/90 text-stone-600 shrink-0 shadow-2xs">
              <Building className="h-4 w-4 text-[#0d4a36]" />
            </div>
            <div className="truncate space-y-0.5">
              <span className="font-semibold text-stone-900 truncate block text-xs sm:text-[13px]">
                {call.propertyTitle}
              </span>
              <span className="text-[11px] text-stone-500 flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5 text-stone-400 shrink-0" />
                {call.propertyLocation}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0 pl-3 border-l border-stone-200/80">
            <span className="font-mono font-bold text-stone-900 block tabular-nums text-xs sm:text-sm">
              {call.declaredBudget}
            </span>
            <span className="text-[10px] text-stone-400 font-medium">Declared Budget</span>
          </div>
        </div>

        {/* Quick Action Protocol Toolbar */}
        <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="default"
              onClick={handleTakeover}
              className="h-7 px-2.5 text-xs gap-1.5 bg-[#0d4a36] hover:bg-[#093829] text-white shadow-2xs cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
              <span>Human Takeover</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleWhatsApp}
              className="h-7 px-2.5 text-xs gap-1.5 bg-white text-stone-700 hover:text-stone-900"
            >
              <Share2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </Button>
          </div>

          {call.outcome === "viewing_booked" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/90 shadow-2xs select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
              <Calendar className="h-3 w-3" />
              <span>Viewing Scheduled</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Interactive Audio Waveform Player */}
      <div className="p-3 bg-stone-50/40 border-b border-stone-100">
        <CallAudioPlayer
          callId={call.id}
          leadName={call.leadName}
          recordingState={call.recordingState}
          durationSeconds={call.audioDurationSeconds}
          currentTimeSeconds={activeTimestamp}
          onTimeUpdate={setActiveTimestamp}
        />
      </div>

      {/* 3. Sticky Architectural Navigation Bar */}
      <div className="sticky top-0 z-20 border-b border-stone-200/90 bg-stone-50/50 backdrop-blur-md px-4 pt-1.5">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mb-px">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "group relative flex items-center gap-2 px-3.5 py-2 text-xs transition-all cursor-pointer whitespace-nowrap select-none border-b-2",
                  isSelected
                    ? "border-[#0d4a36] text-stone-900 font-semibold bg-white rounded-t-md shadow-2xs"
                    : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300 hover:bg-stone-100/50 font-medium rounded-t-md"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    isSelected ? "text-[#0d4a36]" : "text-stone-400 group-hover:text-stone-600"
                  )}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 text-[10px] font-mono rounded-[3px] border transition-colors",
                      isSelected
                        ? "bg-emerald-50 text-[#0d4a36] border-emerald-200/90 font-semibold"
                        : "bg-stone-100 text-stone-500 border-stone-200 group-hover:border-stone-300"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Unified Dossier Scroll Container with Smooth Section Scrolling */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {/* Section 1: Transcript */}
        <div
          ref={(el) => {
            sectionRefs.current["transcript"] = el;
          }}
          className="space-y-2.5 pt-1"
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#0d4a36]" />
              <span>Full Conversational Dialogue</span>
            </span>
            <span className="text-[11px] font-mono text-stone-400">
              {call.transcript.length} turns recorded
            </span>
          </div>

          <TranscriptViewer
            transcript={call.transcript}
            activeTimestampSeconds={activeTimestamp}
            onSeekToTimestamp={(sec) => {
              setActiveTimestamp(sec);
              toast.info("Seeking Audio", {
                description: `Jumped audio playback to turn at ${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}.`,
              });
            }}
          />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => handleTabClick("summary")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d4a36] hover:text-[#093829] bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/90 px-3 py-1.5 rounded-md shadow-2xs transition-all cursor-pointer"
            >
              <span>Scroll to Executive Summary</span>
              <ArrowDown className="h-3.5 w-3.5 text-emerald-700" />
            </button>
          </div>
        </div>

        {/* Section 2: Executive Summary */}
        <div
          ref={(el) => {
            sectionRefs.current["summary"] = el;
          }}
          className="space-y-2.5 pt-4 border-t border-stone-200/80"
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#0d4a36]" />
              <span>Executive AI Voice Brief</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Verified Synthesis
            </span>
          </div>

          <CallSummaryCard summary={call.summary} leadName={call.leadName} />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => handleTabClick("metrics")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d4a36] hover:text-[#093829] bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/90 px-3 py-1.5 rounded-md shadow-2xs transition-all cursor-pointer"
            >
              <span>Scroll to Speech Metrics</span>
              <ArrowDown className="h-3.5 w-3.5 text-emerald-700" />
            </button>
          </div>
        </div>

        {/* Section 3: Speech Metrics & Latency */}
        <div
          ref={(el) => {
            sectionRefs.current["metrics"] = el;
          }}
          className="space-y-2.5 pt-4 border-t border-stone-200/80 pb-6"
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#0d4a36]" />
              <span>Speech Performance & Latency Analytics</span>
            </span>
            <span className="text-[11px] font-mono text-stone-400">
              Avg {call.metrics.averageLatencyMs}ms
            </span>
          </div>

          <CallMetricsStrip metrics={call.metrics} />

          <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3.5 text-xs space-y-1.5">
            <span className="text-[11px] font-semibold text-stone-900 block">
              Agent Configuration Profile
            </span>
            <p className="text-stone-600 text-xs">
              Voice Model:{" "}
              <strong className="text-stone-900 font-semibold">
                {call.agentPersona || "Neural Executive v2.4"}
              </strong>
            </p>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Configured with 5-point BANT qualification gate and automatic human takeover escalation on friction.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => handleTabClick("transcript")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 px-3 py-1.5 rounded-md transition-all cursor-pointer shadow-2xs"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span>Back to Top (Transcript)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
