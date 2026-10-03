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
  Sliders,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/context/workspace-context";
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
  const { currentWorkspace } = useWorkspace();
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
        description: "Updated voice persona, business hours, and escalation rules synchronized.",
      });
    } catch {
      toast.error("Failed to save configuration");
    }
  };

  const handleResetConfig = async () => {
    try {
      const reset = await aiAgentService.resetConfig();
      setConfiguration(reset);
      toast.info("Configuration reset", {
        description: "Restored baseline SpaciaOS luxury parameters.",
      });
    } catch {
      toast.error("Failed to reset configuration");
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
            {/* Workspace Identifier matching Homepage */}
            <div className="flex items-center gap-1.5 h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-2xs whitespace-nowrap">
              <Building2 className="h-3.5 w-3.5 text-stone-400 shrink-0" aria-hidden="true" />
              <span>{currentWorkspace?.name || "SpaciaOS Luxury Hub"}</span>
            </div>

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

      {/* 2. Top Metric Row (exact match to 4 StatMetricCards on Homepage) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. VOICE CALLS */}
        <StatMetricCard
          title="Voice Calls"
          value={telemetry.callsToday ?? telemetry.callsHandledToday ?? 0}
          subtext={
            telemetry.totalCalls
              ? `${telemetry.callsToday ?? 0} placed today · ${telemetry.totalCalls} total in workspace`
              : "0 calls placed today"
          }
          trend={{
            value: `+${telemetry.callsToday ?? 0} today`,
            isPositive: true,
          }}
          icon={Bot}
          variant="sky"
        />

        {/* 2. QUALIFIED INTENT */}
        <StatMetricCard
          title="Qualified Intent"
          value={`${telemetry.qualificationRate}%`}
          subtext={
            telemetry.totalLeads
              ? `${telemetry.qualifiedLeads ?? 4} of ${telemetry.totalLeads ?? 4} verified leads`
              : "BANT qualification active"
          }
          badge="BANT Verified"
          icon={CheckCircle2}
          variant="emerald"
        />

        {/* 3. ACTIVE CONCURRENCY */}
        <StatMetricCard
          title="Active Concurrency"
          value={`${telemetry.activeLines} / ${telemetry.maxConcurrency}`}
          subtext={
            telemetry.isOutboundPaused
              ? "Outbound paused by operator"
              : `${telemetry.averageLatencyMs}ms neural latency`
          }
          badge={telemetry.isOutboundPaused ? "Standby" : "Operational"}
          icon={PhoneCall}
          variant="indigo"
        />

        {/* 4. BOOKED VIEWINGS */}
        <StatMetricCard
          title="Booked Viewings"
          value={telemetry.appointmentsToday ?? telemetry.bookedAppointmentsToday ?? 0}
          subtext={
            telemetry.totalAppointments
              ? `${telemetry.appointmentsToday ?? 0} booked today · ${telemetry.totalAppointments} total viewings`
              : "0 viewings booked today"
          }
          trend={{
            value: `+${telemetry.appointmentsToday ?? 0} today`,
            isPositive: true,
          }}
          icon={CalendarCheck}
          variant="amber"
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
          onResetConfig={handleResetConfig}
        />
      )}
    </Container>
  );
}
