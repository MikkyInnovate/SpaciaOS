"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardLead, DashboardAICallEvent } from "../types";
import { QualificationPanel, type Lead } from "@/features/leads";
import { cn } from "@/lib/utils/cn";
import {
  X,
  Play,
  Pause,
  Phone,
  Mail,
  Sparkles,
  UserCheck,
} from "lucide-react";

export interface LeadDossierPanelProps {
  lead: DashboardLead;
  onClose: () => void;
  onTakeover: (lead: DashboardLead) => void;
  callEvent?: DashboardAICallEvent;
}

export function LeadDossierPanel({ lead, onClose, onTakeover, callEvent }: LeadDossierPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"transcript" | "matrix">("transcript");
  const [isPlaying, setIsPlaying] = React.useState(false);
  const isHot = lead.scoreCategory === "HOT";

  return (
    <div className="flex h-full flex-col bg-white border border-border rounded-lg shadow-2xs overflow-hidden">
      {/* Dossier Header */}
      <div className="flex items-start justify-between border-b border-border p-4 bg-stone-50/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-stone-900 truncate">
              {lead.name}
            </h3>
            <Badge
              variant={isHot ? "hot" : "warm"}
              className="text-[11px] font-semibold"
            >
              {lead.score} {lead.scoreCategory}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-stone-400" />
              {lead.phone}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-stone-400" />
              {lead.email}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-stone-400 hover:text-stone-700 -mr-1 -mt-1"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Human Takeover Actions Bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-stone-50/20">
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <span className="font-medium text-stone-900">{lead.propertyTitle}</span>
          <span className="text-stone-400">•</span>
          <span className="font-semibold text-stone-900 tabular-nums">{lead.budget}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            className="h-7 px-3 text-xs gap-1.5 bg-stone-900 hover:bg-stone-800 text-white"
            onClick={() => onTakeover(lead)}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Take Lead</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border bg-stone-50/40 px-4 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("transcript")}
          className={`border-b-2 px-3 pb-2 text-xs font-semibold transition-colors ${
            activeTab === "transcript"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          AI Call Transcript (4m 18s)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("matrix")}
          className={`border-b-2 px-3 pb-2 text-xs font-semibold transition-colors ${
            activeTab === "matrix"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Qualification & Context
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "transcript" ? (
          <div className="space-y-4">
            {/* Call Audio Bar */}
            <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50/80 p-3">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full bg-white shadow-2xs hover:bg-stone-100 cursor-pointer"
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                  {isPlaying ? (
                    <Pause className="h-3.5 w-3.5 fill-stone-800 text-stone-800" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-stone-800 text-stone-800 ml-0.5" />
                  )}
                </Button>
                <div>
                  <p className="text-xs font-semibold text-stone-900">
                    {callEvent ? "AI Voice Qualification Call" : "Inbound Qualification Call"}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Duration: {callEvent?.duration || "4m 18s"} • Outcome: {callEvent?.outcome || lead.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {[4, 8, 14, 20, 12, 18, 24, 16, 22, 12, 6, 14, 20, 18, 10, 6].map((h, i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-all duration-200",
                      isPlaying ? "bg-emerald-600 animate-pulse" : "bg-stone-300"
                    )}
                    style={{
                      height: isPlaying ? `${Math.min(24, Math.max(5, (h * ((i % 3) + 2)) % 25))}px` : `${h}px`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Executive AI Call Summary */}
            <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-700">
                <Sparkles className="h-3 w-3 text-stone-500" />
                <span>Executive AI Call Summary</span>
              </div>
              <p className="text-xs text-stone-800 leading-relaxed font-normal">
                {callEvent?.summary || lead.aiNotes || "Inbound inquiry qualified via autonomous voice agent. All intent parameters verified."}
              </p>
            </div>

            {/* Conversation Turns */}
            <div className="space-y-3 text-xs leading-relaxed">
              {callEvent?.transcript && callEvent.transcript.length > 0 ? (
                callEvent.transcript.map((turn, idx) =>
                  turn.speaker === "agent" ? (
                    <div key={idx} className="rounded-lg bg-stone-50 p-3 border border-stone-100 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-emerald-700" />
                          {turn.speakerName}
                        </span>
                        <span className="text-stone-400 font-mono">{turn.time}</span>
                      </div>
                      <p className="text-stone-700">&ldquo;{turn.message}&rdquo;</p>
                    </div>
                  ) : (
                    <div key={idx} className="rounded-lg bg-white p-3 border border-stone-200 space-y-1 ml-4 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-900">
                        <span>{turn.speakerName} (Prospect)</span>
                        <span className="text-stone-400 font-mono">{turn.time}</span>
                      </div>
                      <p className="text-stone-800">&ldquo;{turn.message}&rdquo;</p>
                    </div>
                  )
                )
              ) : (
                <>
                  <div className="rounded-lg bg-stone-50 p-3 border border-stone-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-emerald-700" />
                        Spacia AI Agent
                      </span>
                      <span className="text-stone-400 font-mono">00:04</span>
                    </div>
                    <p className="text-stone-700">
                      &ldquo;Hello {lead.name}, this is Sarah from Premier Realty following up on your inquiry for the {lead.propertyTitle} in {lead.location}. Did you have a quick moment to discuss your preferred timeline?&rdquo;
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-stone-200 space-y-1 ml-4 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-900">
                      <span>{lead.name} (Prospect)</span>
                      <span className="text-stone-400 font-mono">00:22</span>
                    </div>
                    <p className="text-stone-800">
                      &ldquo;Hi Sarah, yes! We are relocating from Abuja in about 4 weeks. I saw the listing online and loved the open-plan layout and natural light.&rdquo;
                    </p>
                  </div>

                  <div className="rounded-lg bg-stone-50 p-3 border border-stone-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-emerald-700" />
                        Spacia AI Agent
                      </span>
                      <span className="text-stone-400 font-mono">01:05</span>
                    </div>
                    <p className="text-stone-700">
                      &ldquo;That is wonderful! The property is verified available, and the title deeds are fully clear. Regarding acquisition budget, the property is listed at {lead.budget}. Does that match your planned allocation?&rdquo;
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-stone-200 space-y-1 ml-4 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-900">
                      <span>{lead.name} (Prospect)</span>
                      <span className="text-stone-400 font-mono">01:48</span>
                    </div>
                    <p className="text-stone-800">
                      &ldquo;Yes, exactly within our allocation. We would like to do a private inspection this Thursday afternoon if possible.&rdquo;
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 overflow-y-auto">
            <QualificationPanel lead={lead as unknown as Lead} />
          </div>
        )}
      </div>
    </div>
  );
}
