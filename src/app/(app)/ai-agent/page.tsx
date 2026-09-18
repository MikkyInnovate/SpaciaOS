"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { 
  Cpu,
  Building2,
  PhoneCall,
  Zap,
  Bot,
  CheckCircle2,
  CalendarCheck,
  PauseCircle,
  PlayCircle
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/context/workspace-context";
import { StatMetricCard } from "@/features/dashboard/components/stat-metric-card";
import {
  aiAgentService,
  AIAgentConfigPresentation,
  AIAgentActivityState,
  BuyerIntentCard,
  AIAgentSkeletonLoading,
  type AIAgentStatusTelemetry,
  type AIAgentConfiguration,
  type ActiveCallTelemetry,
  type BuyerIntentEvaluation,
  type AIAgentRecentActivity,
} from "@/features/ai-agent";
import { cn } from "@/lib/utils/cn";

export default function AiAgentPage() {
  const { currentWorkspace } = useWorkspace();

  const [isLoading, setIsLoading] = React.useState(true);
  // State slices
  const [telemetry, setTelemetry] = React.useState<AIAgentStatusTelemetry | null>(null);
  const [configuration, setConfiguration] = React.useState<AIAgentConfiguration | null>(null);
  const [activeCalls, setActiveCalls] = React.useState<ActiveCallTelemetry[]>([]);
  const [recentActivities, setRecentActivities] = React.useState<AIAgentRecentActivity[]>([]);
  const [evaluations, setEvaluations] = React.useState<BuyerIntentEvaluation[]>([]);

  // Filtering for intent cards
  const [intentFilter, setIntentFilter] = React.useState<string>("all");

  React.useEffect(() => {
    let mounted = true;

    const fetchTelemetry = () => {
      Promise.all([
        aiAgentService.getStatusTelemetry(),
        aiAgentService.getConfiguration(),
        aiAgentService.getActiveCalls(),
        aiAgentService.getRecentActivity(),
        aiAgentService.getBuyerIntentEvaluations(),
      ])
        .then(([tel, config, calls, acts, evals]) => {
          if (!mounted) return;
          setTelemetry(tel);
          setConfiguration(config);
          setActiveCalls(calls);
          setRecentActivities(acts);
          setEvaluations(evals);
          setIsLoading(false);
        })
        .catch(() => {
          if (!mounted) return;
          setIsLoading(false);
        });
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000); // Automatic live refresh every 10s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggleDialer = async () => {
    if (!telemetry) return;
    try {
      const updated = await aiAgentService.toggleDialerStatus();
      const updatedCalls = await aiAgentService.getActiveCalls();
      setTelemetry({ ...updated });
      setActiveCalls(updatedCalls);
      if (updated.isOutboundPaused) {
        toast.warning("AI Voice Dialer Paused", {
          description: "Active outbound attempts held. Inbound routing remains operational.",
        });
      } else {
        toast.success("AI Voice Dialer Active", {
          description: "Outbound qualification engine is actively processing the queue.",
        });
      }
    } catch {
      toast.error("Could not update dialer status");
    }
  };

  const handleSaveConfig = async (newConfig: AIAgentConfiguration) => {
    try {
      const updated = await aiAgentService.updateConfiguration(newConfig);
      setConfiguration(updated);
      toast.success("Agent configuration saved", {
        description: "Updated BANT criteria and voice parameters synchronized.",
      });
    } catch {
      toast.error("Failed to save configuration");
    }
  };

  const handleExecuteIntentAction = (leadId: string, action: string) => {
    if (action.includes("Payment") || action.includes("Closing")) {
      toast.success("Closing & Payment Handoff Initiated", {
        description: `Preparing escrow invoice and Governor's Consent deed closing documents for Lead #${leadId.toUpperCase()}.`,
      });
    } else {
      toast.info(`Company Calendar Synced for Lead #${leadId.toUpperCase()}`, {
        description: action,
      });
    }
  };

  const handleDisconnectCall = (callId: string) => {
    const callToDisconnect = activeCalls.find((c) => c.callId === callId);
    if (!callToDisconnect) return;

    setActiveCalls((prev) => prev.filter((c) => c.callId !== callId));
    setTelemetry((prev) =>
      prev
        ? {
            ...prev,
            activeLines: Math.max(0, prev.activeLines - 1),
          }
        : null
    );

    setRecentActivities((prev) => [
      {
        id: `act_${Date.now()}`,
        title: `Call Ended: ${callToDisconnect.leadName}`,
        description: `Call session disconnected by operator. Telephony session closed.`,
        timestamp: "Just now",
        type: "call_completed",
        outcomeTag: "Disconnected",
        leadName: callToDisconnect.leadName,
        propertyTitle: callToDisconnect.propertyTitle,
      },
      ...prev,
    ]);

    toast.warning("Call Terminated", {
      description: `Live call with ${callToDisconnect.leadName} disconnected safely. Line freed.`,
    });
  };

  const handleTakeoverCall = (callId: string) => {
    const callToTakeover = activeCalls.find((c) => c.callId === callId);
    if (!callToTakeover) return;

    setActiveCalls((prev) => prev.filter((c) => c.callId !== callId));
    setTelemetry((prev) =>
      prev
        ? {
            ...prev,
            activeLines: Math.max(0, prev.activeLines - 1),
          }
        : null
    );

    setRecentActivities((prev) => [
      {
        id: `act_${Date.now()}`,
        title: `Broker Takeover: ${callToTakeover.leadName}`,
        description: `Transferred from AI voice line directly to broker sales desk phone.`,
        timestamp: "Just now",
        type: "handoff_escalated",
        outcomeTag: "Broker Takeover",
        leadName: callToTakeover.leadName,
        propertyTitle: callToTakeover.propertyTitle,
      },
      ...prev,
    ]);

    toast.success("Broker Takeover Active", {
      description: `Transferred ${callToTakeover.leadName} directly to broker sales desk. Line freed.`,
    });
  };

  // Filtered buyer evaluations
  const filteredEvaluations = React.useMemo(() => {
    if (intentFilter === "all") return evaluations;
    return evaluations.filter((e) => (e.intentCategory || e.category) === intentFilter);
  }, [evaluations, intentFilter]);

  if (isLoading || !telemetry || !configuration) {
    return <AIAgentSkeletonLoading />;
  }

  return (
    <Container size="lg" className="space-y-4 pb-16">
      {/* 1. Page Header matching Homepage Overview */}
      <PageHeader
        title="AI Sales Agent"
        description="Autonomous prospect response, qualification, and viewing pipeline."
        actions={
          <div className="flex items-center gap-2">
            {/* Workspace Pill */}
            <div className="flex items-center gap-1.5 h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-2xs whitespace-nowrap">
              <Building2 className="h-3.5 w-3.5 text-stone-400 shrink-0" aria-hidden="true" />
              <span>{currentWorkspace?.name || "Workspace"}</span>
            </div>

            {/* AI Status Indicator Pill (exact match to homepage) */}
            <div className="flex items-center gap-1.5 h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-2xs whitespace-nowrap">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  telemetry.isOutboundPaused ? "bg-amber-500" : "bg-emerald-600 animate-pulse"
                )}
              />
              <span>AI Core: {telemetry.isOutboundPaused ? "Paused" : "Operational"}</span>
            </div>

            {/* Emergency Operator Toggle (matching [Export] button style) */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleDialer}
              className={cn(
                "h-8 gap-1.5 text-xs bg-white shadow-2xs whitespace-nowrap cursor-pointer transition-colors border-stone-200",
                telemetry.isOutboundPaused
                  ? "text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                  : "text-amber-700 hover:bg-amber-50 hover:border-amber-300"
              )}
            >
              {telemetry.isOutboundPaused ? (
                <>
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span>Resume Dialer</span>
                </>
              ) : (
                <>
                  <PauseCircle className="h-3.5 w-3.5" />
                  <span>Pause Dialer</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* 2. Top Metric Row (exact match to 5 StatMetricCards on Homepage) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatMetricCard
          title="ACTIVE CONCURRENCY"
          value={`${telemetry.activeLines} / ${telemetry.maxConcurrency}`}
          subtext={telemetry.isOutboundPaused ? "Outbound held by operator" : "Max concurrent channel capacity"}
          icon={PhoneCall}
          badge={telemetry.isOutboundPaused ? "Standby" : `${Math.round((telemetry.activeLines / telemetry.maxConcurrency) * 100)}% Load`}
        />

        <StatMetricCard
          title="AVG RESPONSE LATENCY"
          value={`${telemetry.averageLatencyMs}ms`}
          subtext="Sub-second neural turnaround"
          icon={Zap}
          badge="Ultra-Low"
        />

        <StatMetricCard
          title="CALLS TODAY"
          value={telemetry.callsHandledToday}
          trend={{ value: "+18.4%", isPositive: true }}
          subtext="Autonomous outbound & intake"
          icon={Bot}
        />

        <StatMetricCard
          title="QUALIFIED INTENT"
          value={`${telemetry.qualificationRate}%`}
          trend={{ value: "+12.1%", isPositive: true }}
          subtext="Verified BANT readiness"
          icon={CheckCircle2}
        />

        <StatMetricCard
          title="BOOKED VIEWINGS"
          value={telemetry.bookedAppointmentsToday}
          trend={{ value: "+3 today", isPositive: true }}
          subtext="Agent confirmed calendar"
          icon={CalendarCheck}
        />
      </div>

      {/* 3. Live Call Radar & Operational Activities (Full Width) */}
      <AIAgentActivityState
        activeCalls={activeCalls}
        maxConcurrency={telemetry.maxConcurrency}
        recentActivities={recentActivities}
        onDisconnectCall={handleDisconnectCall}
        onTakeoverCall={handleTakeoverCall}
      />

      {/* 4. Buyer Intent & Qualification Pipeline (matching Lead Qualification Feed) */}
      <div className="rounded-lg border border-border bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border p-4 bg-stone-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-stone-900">
                Buyer Intent &amp; Qualification Pipeline
              </h2>
              <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Live Feed
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Post-call outcomes, autonomous company calendar bookings, and human closing &amp; payment handoffs
            </p>
          </div>

          {/* Filter Pills matching Spacia design system (LeadFiltersBar style) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mr-1">
              CATEGORY:
            </span>
            {(
              [
                { label: "All Leads", value: "all" },
                { label: "High Intent", value: "high_purchase_intent" },
                { label: "Investors", value: "investment_yield_seeking" },
                { label: "Luxury", value: "luxury_relocation" },
                { label: "Exploratory", value: "exploratory" },
              ] as const
            ).map((filter) => {
              const isSelected = intentFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setIntentFilter(filter.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none whitespace-nowrap cursor-pointer",
                    isSelected
                      ? "bg-[#0d4a36] text-white font-semibold"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvaluations.map((evaluation) => (
              <BuyerIntentCard
                key={evaluation.id}
                evaluation={evaluation}
                onSelectAction={handleExecuteIntentAction}
                autoDispatch={Boolean(configuration?.guardrails?.autoDispatchBookings)}
              />
            ))}

            {filteredEvaluations.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-stone-200 p-8 text-center bg-stone-50/50">
                <Cpu className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-stone-700">
                  No prospects match the selected category
                </p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Select &ldquo;All Leads&rdquo; to view complete buyer intent evaluations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Agent Configuration & Guardrails (Full Width - Bottom Section) */}
      <AIAgentConfigPresentation
        configuration={configuration}
        onSaveConfig={handleSaveConfig}
      />
    </Container>
  );
}
