"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { WorkflowActivityEvent } from "../types";
import { ActivityEventCard } from "./activity-event-card";
import { eventsService } from "../services/events-service";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Bot,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Radio,
} from "lucide-react";
import { toast } from "sonner";

export interface AutomationEventFeedProps {
  entityId?: string;
  className?: string;
  initialEvents?: WorkflowActivityEvent[];
  showControls?: boolean;
}

export function AutomationEventFeed({
  entityId,
  className,
  initialEvents,
  showControls = true,
}: AutomationEventFeedProps) {
  const [events, setEvents] = React.useState<WorkflowActivityEvent[]>(
    initialEvents || []
  );
  const [activeTab, setActiveTab] = React.useState<
    "all" | "ai_only" | "human_only" | "failed_only"
  >("all");
  const [isLoading, setIsLoading] = React.useState(!initialEvents);

  React.useEffect(() => {
    let isMounted = true;
    if (!initialEvents) {
      eventsService
        .getEvents({ entityId })
        .then((response) => {
          if (isMounted) {
            setEvents(response.events);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLoading(false);
            toast.error("Failed to load automation events");
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [entityId, initialEvents]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await eventsService.getEvents({ entityId });
      setEvents(response.events);
    } catch {
      toast.error("Failed to load automation events");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryWorkflow = async (workflowId: string) => {
    try {
      const updated = await eventsService.retryWorkflow(workflowId);
      setEvents((prev) =>
        prev.map((e) => (e.workflowId === workflowId ? updated : e))
      );
      toast.success("Workflow Reconnected", {
        description: `Workflow ${workflowId} recovered and marked completed.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Retry failed";
      toast.error("Retry Error", { description: msg });
    }
  };

  const handleSimulateNewEvent = async () => {
    const isError = Math.random() > 0.5;
    const simulatedEvent: Omit<WorkflowActivityEvent, "id"> = isError
      ? {
          workflowId: `wf_sim_${Date.now()}`,
          entityId: entityId || "lead_01",
          title: "Telephony Handshake Dropout (Simulated)",
          description: "Circuit carrier packet loss detected during automated BANT dialer sequence.",
          category: "voice_call",
          status: "retrying",
          actor: {
            type: "ai_agent",
            name: "Spacia Voice Core",
            role: "Autonomous Sales Associate",
            modelIdentifier: "Neural Executive v2.4",
            latencyMs: 395,
          },
          timestamp: "Just now",
          channel: "Telephony Trunk",
          retry: {
            currentAttempt: 1,
            maxRetries: 3,
            backoffSeconds: 30,
            isRetrying: true,
            canManuallyRetry: true,
          },
          failure: {
            errorCode: "SIP_503_SERVICE_UNAVAILABLE",
            errorMessage: "Simulated telephony carrier gateway timeout.",
            technicalDetails: "SIP/2.0 503 Service Unavailable\nRetry-After: 30",
            recoverable: true,
            suggestedAction: "Automatic retry queued with secondary telephony trunk.",
            failedAt: "Just now",
          },
        }
      : {
          workflowId: `wf_sim_${Date.now()}`,
          entityId: entityId || "lead_01",
          title: "Autonomous BANT Qualification Score Calculated",
          description: "Prospect qualified at 94/100 following completed automated interview.",
          category: "underwriting",
          status: "completed",
          actor: {
            type: "ai_agent",
            name: "BANT Underwriter Core",
            role: "Risk & Readiness Engine",
            modelIdentifier: "Underwriting Engine v3",
            confidenceScore: 98,
          },
          timestamp: "Just now",
          channel: "Automated Underwriter",
          payload: {
            outcome: "HOT (94/100)",
            duration: "3m 42s",
            transcriptSnippet: "Verified corporate asset backing for ₦900M purchase.",
          },
        };

    const added = await eventsService.addEvent(simulatedEvent);
    setEvents((prev) => [added, ...prev]);
    toast.success(
      isError
        ? "Simulated Telephony Failure Added"
        : "Simulated AI Underwriting Event Added"
    );
  };

  // Filter events based on activeTab
  const filteredEvents = events.filter((e) => {
    if (activeTab === "ai_only") return e.actor.type === "ai_agent";
    if (activeTab === "human_only") return e.actor.type === "human_broker";
    if (activeTab === "failed_only")
      return e.status === "failed" || e.status === "retrying" || e.status === "blocked";
    return true;
  });

  const aiCount = events.filter((e) => e.actor.type === "ai_agent").length;
  const humanCount = events.filter((e) => e.actor.type === "human_broker").length;
  const alertCount = events.filter(
    (e) => e.status === "failed" || e.status === "retrying" || e.status === "blocked"
  ).length;

  return (
    <div className={cn("space-y-3.5", className)}>
      {/* Control Bar: Filter Tabs & Simulation */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-stone-200">
          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                activeTab === "all"
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              )}
            >
              All Events ({events.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ai_only")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                activeTab === "ai_only"
                  ? "bg-white text-emerald-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Bot className="h-3 w-3 text-[#0d4a36]" />
              <span>AI Autonomous ({aiCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("human_only")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                activeTab === "human_only"
                  ? "bg-white text-indigo-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              )}
            >
              <UserCheck className="h-3 w-3 text-indigo-700" />
              <span>Broker ({humanCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("failed_only")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                activeTab === "failed_only"
                  ? "bg-white text-amber-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              )}
            >
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              <span>Alerts / Retrying ({alertCount})</span>
            </button>
          </div>

          {/* Simulation & Refresh Trigger */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSimulateNewEvent}
              className="h-7 text-xs border-stone-200 bg-white text-stone-700 hover:bg-stone-50 gap-1 cursor-pointer"
            >
              <Radio className="h-3 w-3 text-emerald-600 animate-pulse" />
              <span>Simulate Async Event</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-7 w-7 p-0 text-stone-500 hover:text-stone-900 cursor-pointer"
              title="Refresh events"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
            <Activity className="h-8 w-8 text-stone-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-stone-700">
              No matching activity events found
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Switch filter tabs or trigger a simulated async event above.
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <ActivityEventCard
              key={event.id}
              event={event}
              onRetry={handleRetryWorkflow}
            />
          ))
        )}
      </div>
    </div>
  );
}
