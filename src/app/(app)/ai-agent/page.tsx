"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { 
  Cpu,
  PhoneCall,
  Zap,
  Bot,
  CheckCircle2,
  CalendarCheck,
  PauseCircle,
  PlayCircle,
  Radio,
  Sliders
} from "lucide-react";
import { toast } from "sonner";
import { StatMetricCard } from "@/features/dashboard/components/stat-metric-card";
import {
  aiAgentService,
  AIAgentConfigPresentation,
  AIAgentActivityState,
  AIAgentSkeletonLoading,
  type AIAgentStatusTelemetry,
  type AIAgentConfiguration,
  type ActiveCallTelemetry,
  type AIAgentRecentActivity,
} from "@/features/ai-agent";
import { cn } from "@/lib/utils/cn";

export default function AiAgentPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  // State slices
  const [telemetry, setTelemetry] = React.useState<AIAgentStatusTelemetry | null>(null);
  const [configuration, setConfiguration] = React.useState<AIAgentConfiguration | null>(null);
  const [activeCalls, setActiveCalls] = React.useState<ActiveCallTelemetry[]>([]);
  const [recentActivities, setRecentActivities] = React.useState<AIAgentRecentActivity[]>([]);
  const [activeSection, setActiveSection] = React.useState<"operations" | "studio">("operations");

  React.useEffect(() => {
    let mounted = true;

    const fetchTelemetry = () => {
      Promise.all([
        aiAgentService.getStatusTelemetry(),
        aiAgentService.getConfiguration(),
        aiAgentService.getActiveCalls(),
        aiAgentService.getRecentActivity(),
      ])
        .then(([tel, config, calls, acts]) => {
          if (!mounted) return;
          setTelemetry(tel);
          setConfiguration(config);
          setActiveCalls(calls);
          setRecentActivities(acts);
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
            {/* AI Status Indicator Pill - High visual bang when paused */}
            {telemetry.isOutboundPaused ? (
              <div className="flex items-center gap-1.5 h-8 rounded-md border border-rose-300 bg-rose-50 px-2.5 text-xs font-semibold text-rose-800 shadow-2xs whitespace-nowrap">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                </span>
                <span>AI Core: Outbound Paused</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 h-8 rounded-md border border-emerald-200/90 bg-emerald-50/80 px-2.5 text-xs font-medium text-emerald-800 shadow-2xs whitespace-nowrap">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                <span>AI Core: Operational</span>
              </div>
            )}

            {/* Operator Killswitch / Resume Action */}
            {telemetry.isOutboundPaused ? (
              <Button
                size="sm"
                onClick={handleToggleDialer}
                className="h-8 gap-1.5 text-xs bg-[#0d4a36] hover:bg-[#093829] text-white shadow-2xs whitespace-nowrap cursor-pointer font-semibold px-3.5 transition-colors"
              >
                <PlayCircle className="h-3.5 w-3.5 text-emerald-300" />
                <span>Resume Dialer</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleDialer}
                className="h-8 gap-1.5 text-xs border-rose-300 bg-rose-50/70 text-rose-700 hover:bg-rose-100 hover:border-rose-400 hover:text-rose-800 shadow-2xs whitespace-nowrap cursor-pointer font-semibold px-3.5 transition-colors"
              >
                <PauseCircle className="h-3.5 w-3.5 text-rose-600" />
                <span>Pause Dialer</span>
              </Button>
            )}
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

      {/* 3. Section Navigation Tabs (SpaciaOS Design System Standard) */}
      <div className="border-b border-stone-200">
        <div className="flex items-center gap-6 -mb-px overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSection("operations")}
            className={cn(
              "flex items-center gap-2 pb-2.5 pt-1 text-xs transition-colors cursor-pointer whitespace-nowrap select-none border-b-2",
              activeSection === "operations"
                ? "border-[#0d4a36] text-[#0d4a36] font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300 font-medium"
            )}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Live Fleet Operations &amp; Dispatch</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded text-[10px] font-mono border transition-colors",
                activeSection === "operations"
                  ? "bg-emerald-50 text-[#0d4a36] border-emerald-200/90 font-semibold"
                  : "bg-stone-100 text-stone-500 border-stone-200"
              )}
            >
              {activeCalls.length > 0 ? `${activeCalls.length} Active` : "Standby"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("studio")}
            className={cn(
              "flex items-center gap-2 pb-2.5 pt-1 text-xs transition-colors cursor-pointer whitespace-nowrap select-none border-b-2",
              activeSection === "studio"
                ? "border-[#0d4a36] text-[#0d4a36] font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300 font-medium"
            )}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Agent Studio &amp; Guardrails</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded text-[10px] font-mono border transition-colors",
                activeSection === "studio"
                  ? "bg-emerald-50 text-[#0d4a36] border-emerald-200/90 font-semibold"
                  : "bg-stone-100 text-stone-500 border-stone-200"
              )}
            >
              Voice &amp; BANT
            </span>
          </button>
        </div>
      </div>

      {/* 4. Active Section Content (Clean, unbloated, singular focus) */}
      {activeSection === "operations" ? (
        <AIAgentActivityState
          activeCalls={activeCalls}
          maxConcurrency={telemetry.maxConcurrency}
          isOutboundPaused={telemetry.isOutboundPaused}
          onToggleDialer={handleToggleDialer}
          recentActivities={recentActivities}
          onDisconnectCall={handleDisconnectCall}
          onTakeoverCall={handleTakeoverCall}
        />
      ) : (
        <AIAgentConfigPresentation
          configuration={configuration}
          onSaveConfig={handleSaveConfig}
        />
      )}
    </Container>
  );
}
