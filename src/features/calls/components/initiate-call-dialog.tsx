"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { callsService } from "../services/calls-service";
import type { Call } from "../types";
import { MOCK_LEADS } from "@/features/leads/data/mock-leads";
import {
  PhoneCall,
  PhoneOff,
  Radio,
  Sparkles,
  UserCheck,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

interface InitiateCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLeadId?: string;
  onCallCompleted?: (call: Call) => void;
}

const VOICE_PERSONAS = [
  {
    id: "victoria",
    name: "Victoria — Senior Luxury Specialist",
    description: "British-Nigerian Executive, warm tone, strategic closer.",
    latency: "380ms",
  },
  {
    id: "david",
    name: "David — Technical Real Estate Underwriter",
    description: "Analytical, direct, specialized in land titles & payment schedules.",
    latency: "340ms",
  },
];

export function InitiateCallDialog({
  open,
  onOpenChange,
  defaultLeadId,
  onCallCompleted,
}: InitiateCallDialogProps) {
  const [selectedLeadId, setSelectedLeadId] = React.useState(MOCK_LEADS[0]?.id || "");
  const [personaId, setPersonaId] = React.useState("victoria");
  const [callState, setCallState] = React.useState<"idle" | "dialing" | "active" | "completing">("idle");
  const [activeSeconds, setActiveSeconds] = React.useState(0);

  // Selected lead details derived cleanly from default or user selection
  const effectiveLeadId = defaultLeadId || selectedLeadId;
  const targetLead = React.useMemo(() => {
    return MOCK_LEADS.find((l) => l.id === effectiveLeadId) || MOCK_LEADS[0];
  }, [effectiveLeadId]);

  const selectedPersona = React.useMemo(() => {
    return VOICE_PERSONAS.find((p) => p.id === personaId) || VOICE_PERSONAS[0];
  }, [personaId]);

  // Timer for active call
  React.useEffect(() => {
    if (callState !== "active") return;
    const interval = setInterval(() => {
      setActiveSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartDialing = () => {
    setActiveSeconds(0);
    setCallState("dialing");

    // Simulate dialing delay (1.8s) -> auto-connect
    setTimeout(() => {
      setCallState("active");
    }, 1800);
  };

  const handleFinishCall = async () => {
    setCallState("completing");

    try {
      const createdCall = await callsService.initiateVapiCall({
        leadId: targetLead.id,
        leadName: targetLead.name,
        leadPhone: targetLead.phone,
        propertyTitle: targetLead.propertyTitle,
        propertyLocation: targetLead.location,
        declaredBudget: targetLead.budget,
        score: targetLead.score,
        scoreCategory: targetLead.scoreCategory,
        persona: selectedPersona.name,
      });

      toast.success("Vapi Voice Call Logged", {
        description: `Autonomous session with ${targetLead.name} completed. Audio and transcript synchronized.`,
      });

      if (onCallCompleted) {
        onCallCompleted(createdCall);
      }

      setCallState("idle");
      onOpenChange(false);
    } catch {
      toast.error("Failed to complete call session.");
      setCallState("idle");
    }
  };

  const handleTakeover = async () => {
    toast.info("Broker Takeover Triggered", {
      description: `Autonomous Vapi line disconnected. Routed to human broker desk.`,
    });
    await handleFinishCall();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (callState === "active") {
          if (confirm("Call is currently live. Disconnect and log call?")) {
            handleFinishCall();
          }
          return;
        }
        setCallState("idle");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md p-0 gap-0 border border-stone-200/80 bg-white shadow-xl rounded-xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-stone-100 bg-[#fcfcfb] text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200/70 text-[#0d4a36] shadow-2xs shrink-0">
                <PhoneCall className="h-4.5 w-4.5 text-[#0d4a36]" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-sm font-semibold text-stone-900 tracking-tight">
                  Vapi Voice Telephony
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Autonomous conversational qualification & inspection scheduling.
                </DialogDescription>
              </div>
            </div>

            {callState === "active" && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#0d4a36] text-[11px] font-mono font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>LIVE {formatTimer(activeSeconds)}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-5 space-y-3.5">
          {callState === "idle" && (
            <>
              {/* Target Lead Card */}
              <div className="rounded-lg border border-stone-200/80 bg-[#fcfcfb] p-3 space-y-1.5">
                <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Target Prospect
                </div>
                {!defaultLeadId ? (
                  <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                    <SelectTrigger className="h-8.5 text-xs border-stone-200 bg-white focus:ring-[#0d4a36]/20 focus:border-[#0d4a36]">
                      <SelectValue placeholder="Select target lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_LEADS.slice(0, 10).map((lead) => (
                        <SelectItem key={lead.id} value={lead.id} className="text-xs">
                          <span className="font-medium text-stone-900">{lead.name}</span>{" "}
                          <span className="text-stone-400 font-mono">({lead.phone})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-stone-900">{targetLead.name}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{targetLead.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-stone-900">{targetLead.budget}</div>
                      <div className="text-[10px] text-stone-400 truncate max-w-[160px]">
                        {targetLead.propertyTitle}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Persona Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700">AI Voice Persona</label>
                <Select value={personaId} onValueChange={setPersonaId}>
                  <SelectTrigger className="h-8.5 text-xs border-stone-200 bg-white focus:ring-[#0d4a36]/20 focus:border-[#0d4a36]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_PERSONAS.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        <span className="font-medium text-stone-900">{p.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-stone-500 leading-normal">
                  {selectedPersona.description}
                </p>
              </div>

              {/* Telephony Specs */}
              <div className="rounded-lg border border-stone-200/60 bg-stone-50/60 p-2.5 text-[11px] text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Telephony Engine:</span>
                  <span className="font-mono font-medium text-stone-900">Vapi WebRTC / SIP Gateway</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Target Latency:</span>
                  <span className="font-mono font-medium text-emerald-700">~{selectedPersona.latency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Language & Accent:</span>
                  <span className="font-medium text-stone-900">English (West African Executive)</span>
                </div>
              </div>
            </>
          )}

          {callState === "dialing" && (
            <div className="py-6 flex flex-col items-center justify-center space-y-3.5 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#0d4a36] text-white shadow-lg">
                <Radio className="h-7 w-7 animate-spin" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-900">Dialing {targetLead.name}...</h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">{targetLead.phone}</p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Allocating Vapi voice session ({selectedPersona.name.split(" ")[0]})...
                </p>
              </div>
            </div>
          )}

          {callState === "active" && (
            <div className="space-y-3.5">
              {/* Active Speaker Card */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#0d4a36] font-medium">
                  <Volume2 className="h-4 w-4 text-[#0d4a36] animate-bounce" />
                  <span>Call in Progress</span>
                </div>

                {/* Animated Waveform Bars */}
                <div className="flex items-center justify-center gap-1 h-8 py-1">
                  {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65].map((height, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-[#0d4a36] transition-all duration-200"
                      style={{
                        height: `${Math.max(20, (height * ((activeSeconds % 3) + 1)) / 3)}%`,
                      }}
                    />
                  ))}
                </div>

                <div className="text-xs font-semibold text-[#0d4a36] font-mono">
                  {formatTimer(activeSeconds)}
                </div>
              </div>

              {/* Live Turn Preview */}
              <div className="rounded-lg border border-stone-200 bg-[#fcfcfb] p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span className="font-semibold">{selectedPersona.name.split(" ")[0]} (AI)</span>
                  <span className="text-emerald-700 font-mono font-medium">Speaking</span>
                </div>
                <p className="text-xs text-stone-700 italic">
                  &ldquo;Reaching out regarding your inquiry on {targetLead.propertyTitle}. We have scheduled viewings available this weekend.&rdquo;
                </p>
              </div>
            </div>
          )}

          {callState === "completing" && (
            <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-[#0d4a36]">
                <Sparkles className="h-5 w-5 animate-spin" />
              </div>
              <div className="text-xs font-semibold text-stone-900">
                Synthesizing Call & Ingesting Transcript...
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-3.5 px-5 border-t border-stone-100 bg-[#fcfcfb]">
          {callState === "idle" && (
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs text-stone-600 bg-white hover:bg-stone-50 border-stone-200 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleStartDialing}
                className="h-8 text-xs bg-[#0d4a36] hover:bg-[#093829] text-white gap-1.5 cursor-pointer shadow-2xs font-medium px-3.5"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Dispatch Vapi Call</span>
              </Button>
            </div>
          )}

          {callState === "active" && (
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTakeover}
                className="h-8 text-xs text-amber-900 border-amber-300 bg-amber-50 hover:bg-amber-100 gap-1.5 cursor-pointer font-medium"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Broker Takeover</span>
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleFinishCall}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer shadow-2xs font-medium"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                <span>End Call & Log</span>
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
