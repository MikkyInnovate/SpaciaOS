"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import {
  CallList,
  CallDetailCockpit,
  MOCK_CALLS,
  type Call,
} from "@/features/calls";
import { useWorkspace } from "@/lib/context/workspace-context";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  Call02Icon,
  CalendarCheck01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

export default function CallsPage() {
  const { currentWorkspace } = useWorkspace();
  const [calls] = React.useState<Call[]>(MOCK_CALLS);
  const [selectedCall, setSelectedCall] = React.useState<Call | null>(null);

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
    toast.success("Broker Takeover Activated", {
      description: `Autonomous voice engine paused for ${call.leadName}. Direct line active.`,
    });
  };

  return (
    <Container size="lg" className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Calls"
        description={`Autonomous voice interactions, audio recordings, and qualification logs for ${currentWorkspace?.name || "your workspace"}.`}
      />

      {/* Voice Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 border-border bg-white shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
            <HugeiconsIcon
              icon={Clock01Icon}
              size={15}
              className="text-stone-500 shrink-0"
              strokeWidth={1.8}
            />
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
            <HugeiconsIcon
              icon={Call02Icon}
              size={15}
              className="text-stone-500 shrink-0"
              strokeWidth={1.8}
            />
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
            <HugeiconsIcon
              icon={CalendarCheck01Icon}
              size={15}
              className="text-stone-500 shrink-0"
              strokeWidth={1.8}
            />
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
    </Container>
  );
}
