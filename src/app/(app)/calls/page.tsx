"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CallList,
  CallDetailCockpit,
  InitiateCallDialog,
  MOCK_CALLS,
  type Call,
} from "@/features/calls";
import { leadsService } from "@/features/leads";
import { useWorkspace } from "@/lib/context/workspace-context";
import {
  Clock,
  PhoneCall,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function CallsPage() {
  const { currentWorkspace } = useWorkspace();
  const [calls, setCalls] = React.useState<Call[]>(MOCK_CALLS);
  const [selectedCall, setSelectedCall] = React.useState<Call | null>(null);
  const [isInitiateOpen, setIsInitiateOpen] = React.useState(false);

  // Close sidepanel on ESC key & lock background scroll
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCall(null);
      }
    };

    if (selectedCall) {
      window.addEventListener("keydown", handleKeyDown);
      const originalOverflow = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedCall]);

  const handleTakeover = (call: Call) => {
    if (call.leadId) {
      leadsService.takeoverLead(call.leadId, "Marcus Vance", "Broker takeover from live call cockpit");
    }
    setCalls((prev) =>
      prev.map((c) =>
        c.id === call.id
          ? { ...c, outcome: "escalated_takeover" as const, isEscalated: true }
          : c
      )
    );
    if (selectedCall && selectedCall.id === call.id) {
      setSelectedCall({
        ...selectedCall,
        outcome: "escalated_takeover",
        isEscalated: true,
      });
    }
    toast.success("Broker Takeover Activated", {
      description: `Autonomous voice engine paused for ${call.leadName}. Direct line routed to on-call broker.`,
    });
  };

  const handleCallCompleted = (newCall: Call) => {
    setCalls((prev) => [newCall, ...prev]);
    setSelectedCall(newCall);
  };

  return (
    <Container size="lg" className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Calls"
        description={`Autonomous voice interactions, audio recordings, and qualification logs for ${currentWorkspace?.name || "your workspace"}.`}
        actions={
          <Button
            size="sm"
            onClick={() => setIsInitiateOpen(true)}
            className="h-8 gap-1.5 text-xs bg-[#0d4a36] hover:bg-[#0a3a2a] text-white shadow-2xs cursor-pointer font-medium"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Initiate AI Call</span>
          </Button>
        }
      />

      {/* Voice Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 border-border bg-white shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
            <Clock className="h-3.5 w-3.5 text-stone-500 shrink-0" />
            <span>Avg. Call Duration</span>
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums">
              3
            </span>
            <span className="text-xs font-medium text-stone-500 font-sans ml-0.5 mr-1.5">
              m
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums">
              42
            </span>
            <span className="text-xs font-medium text-stone-500 font-sans ml-0.5">
              s
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">88% qualification rate</p>
        </Card>

        <Card className="p-3.5 border-border bg-white shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
            <PhoneCall className="h-3.5 w-3.5 text-stone-500 shrink-0" />
            <span>Calls Placed Today</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums">
              42
            </span>
            <span className="text-xs font-medium text-stone-500 font-sans">
              Outbound
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Sub-5s response to inquiries</p>
        </Card>

        <Card className="p-3.5 border-border bg-white shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
            <CalendarCheck className="h-3.5 w-3.5 text-stone-500 shrink-0" />
            <span>Viewings Booked via Voice</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums">
              11
            </span>
            <span className="text-xs font-medium text-stone-500 font-sans">
              Confirmed
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Auto-synced to Google Calendar</p>
        </Card>
      </div>

      {/* Main Full-Width Calls List Table */}
      <div className="w-full">
        <CallList
          calls={calls}
          selectedCallId={selectedCall?.id}
          onSelectCall={(call) => setSelectedCall(call)}
        />
      </div>

      {/* Gentle, Sleek Slide-over Sidepanel: Slides in from the right edge */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop Overlay with Gentle Fade */}
          <div
            className="fixed inset-0 bg-stone-950/35 backdrop-blur-2xs animate-fade-in-backdrop transition-opacity cursor-pointer"
            onClick={() => setSelectedCall(null)}
            aria-hidden="true"
          />

          {/* Sidepanel Drawer */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 pointer-events-none">
            <aside className="w-screen max-w-2xl lg:max-w-3xl bg-white shadow-2xl border-l border-stone-200 flex flex-col pointer-events-auto animate-gentle-slide-in h-full overflow-hidden">
              <CallDetailCockpit
                call={selectedCall}
                onClose={() => setSelectedCall(null)}
                onTakeover={handleTakeover}
                className="border-0 shadow-none rounded-none p-0 bg-transparent flex-1 h-full overflow-hidden"
              />
            </aside>
          </div>
        </div>
      )}

      {/* Day 14: Vapi Voice Call Initiation Dialog */}
      <InitiateCallDialog
        open={isInitiateOpen}
        onOpenChange={setIsInitiateOpen}
        onCallCompleted={handleCallCompleted}
      />
    </Container>
  );
}
