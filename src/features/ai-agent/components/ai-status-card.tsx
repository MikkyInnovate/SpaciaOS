"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { AIAgentStatusTelemetry } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  PhoneCall,
  Gauge,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface AIAgentStatusCardProps {
  status?: AIAgentStatusTelemetry;
  telemetry?: AIAgentStatusTelemetry;
  onTogglePause?: () => Promise<boolean> | void;
  onToggleStatus?: () => Promise<void> | void;
  className?: string;
}

export function AIAgentStatusCard({
  status,
  telemetry,
  onTogglePause,
  onToggleStatus,
  className,
}: AIAgentStatusCardProps) {
  const currentStatus = telemetry ?? status;
  const [overridePaused, setOverridePaused] = React.useState<boolean | null>(null);
  const [isToggling, setIsToggling] = React.useState(false);

  if (!currentStatus) return null;

  const isPaused = overridePaused !== null ? overridePaused : currentStatus.isOutboundPaused;

  const handlePauseToggle = async () => {
    setIsToggling(true);
    try {
      if (onToggleStatus) {
        await onToggleStatus();
      } else if (onTogglePause) {
        await onTogglePause();
      }
      const next = !isPaused;
      setOverridePaused(next);
      if (next) {
        toast.warning("Outbound Calling Paused", {
          description: "AI Voice Core will not place automated calls until resumed.",
        });
      } else {
        toast.success("Outbound Calling Resumed", {
          description: "AI Voice Core is actively dialing inbound real-estate leads.",
        });
      }
    } catch {
      toast.error("Failed to update dialer state");
    } finally {
      setIsToggling(false);
    }
  };

  const activeStatus = currentStatus;

  const concurrencyPercent = Math.round(
    (activeStatus.activeLines / activeStatus.maxConcurrency) * 100
  );

  return (
    <Card className={cn("border-stone-200 bg-white shadow-xs", className)}>
      <CardHeader className="pb-3 border-b border-stone-100 bg-stone-50/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d4a36] text-white shadow-2xs border border-[#093829]">
              <Bot className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="font-display text-base font-bold text-stone-900 tracking-tight">
                  Spacia Voice Core Telemetry
                </CardTitle>
                <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 border border-emerald-200/80">
                  Engine v2.4
                </span>
              </div>
              <CardDescription className="text-xs text-stone-500">
                Uptime: {activeStatus.uptime} • Model sync: {activeStatus.lastTrainedAt}
              </CardDescription>
            </div>
          </div>

          {/* Operational Status Pill & Emergency Action */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs",
                isPaused
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-emerald-50 text-emerald-900 border-emerald-300"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isPaused
                    ? "bg-amber-500"
                    : "bg-emerald-500 animate-pulse"
                )}
              />
              <span>{isPaused ? "Outbound Paused" : "Voice Core Online"}</span>
            </div>

            <Button
              type="button"
              size="sm"
              variant={isPaused ? "default" : "outline"}
              onClick={handlePauseToggle}
              disabled={isToggling}
              className={cn(
                "h-8 text-xs gap-1.5 cursor-pointer shadow-2xs",
                isPaused
                  ? "bg-[#0d4a36] text-white hover:bg-[#093829]"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              )}
            >
              {isPaused ? (
                <>
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span>Resume Dialer</span>
                </>
              ) : (
                <>
                  <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Pause Dialer</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Concurrency Meter */}
          <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
              <span className="flex items-center gap-1">
                <PhoneCall className="h-3 w-3 text-emerald-700" />
                Line Concurrency
              </span>
              <span className="font-mono font-bold text-stone-900">
                {activeStatus.activeLines} / {activeStatus.maxConcurrency}
              </span>
            </div>
            {/* Miniature track bar */}
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0d4a36] h-full rounded-full transition-all duration-300"
                style={{ width: `${concurrencyPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-stone-400 font-mono">
              {concurrencyPercent}% capacity in use
            </p>
          </div>

          {/* Latency */}
          <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3 text-stone-500" />
                Response Latency
              </span>
              <Badge variant="outline" className="text-[9px] py-0 px-1 bg-emerald-50 text-emerald-800 border-emerald-200">
                Ultra-Low
              </Badge>
            </div>
            <p className="font-mono text-lg font-bold text-stone-900 leading-tight">
              {activeStatus.averageLatencyMs}ms
            </p>
            <p className="text-[10px] text-stone-400">Sub-second neural turnaround</p>
          </div>

          {/* Calls Handled Today */}
          <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-[#0d4a36]" />
                Calls Today
              </span>
            </div>
            <p className="font-mono text-lg font-bold text-stone-900 leading-tight">
              {activeStatus.callsHandledToday}
            </p>
            <p className="text-[10px] text-stone-400">Autonomous outbound &amp; intake</p>
          </div>

          {/* Qualification Rate */}
          <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                BANT Pass Rate
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-lg font-bold text-stone-900 leading-tight">
                {activeStatus.qualificationRate}%
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                ({activeStatus.bookedAppointmentsToday} viewings)
              </span>
            </div>
            <p className="text-[10px] text-stone-400">Verified buyer liquidity</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
