import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { AIActorDetails } from "../types";
import { Bot, Sparkles, Cpu, Gauge } from "lucide-react";

export interface AIActivityIndicatorProps {
  actor: AIActorDetails;
  variant?: "badge" | "compact" | "detailed";
  isLive?: boolean;
  className?: string;
}

export function AIActivityIndicator({
  actor,
  variant = "compact",
  isLive = false,
  className,
}: AIActivityIndicatorProps) {
  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium bg-emerald-50/70 border-emerald-200/80 text-emerald-900 select-none",
          className
        )}
      >
        <span className="relative flex h-2 w-2">
          {isLive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
        </span>
        <Sparkles className="h-3 w-3 text-[#0d4a36]" />
        <span>{actor.name}</span>
      </span>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "p-3 rounded-lg border border-emerald-200/70 bg-gradient-to-r from-emerald-50/50 via-white to-stone-50/30 space-y-2",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0d4a36] text-emerald-100 shadow-2xs">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-stone-900 leading-tight">
                  {actor.name}
                </span>
                <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-900 uppercase tracking-wider">
                  AI Autonomous
                </span>
              </div>
              <p className="text-[11px] text-stone-500">{actor.role}</p>
            </div>
          </div>

          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Active
            </span>
          )}
        </div>

        {/* Model Spec Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-100/80 text-[10px] text-stone-600">
          <div className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded border border-stone-200 font-mono">
            <Cpu className="h-3 w-3 text-emerald-700" />
            <span>{actor.modelIdentifier}</span>
          </div>

          {actor.latencyMs !== undefined && (
            <div className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded border border-stone-200 font-mono text-stone-500">
              <Gauge className="h-3 w-3 text-stone-400" />
              <span>{actor.latencyMs}ms latency</span>
            </div>
          )}

          {actor.confidenceScore !== undefined && (
            <span className="font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {actor.confidenceScore}% Confidence
            </span>
          )}
        </div>
      </div>
    );
  }

  // Compact layout (Default)
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2 py-1 rounded-md border border-emerald-200/80 bg-emerald-50/50 text-xs text-stone-800",
        className
      )}
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#0d4a36] text-white">
        <Sparkles className="h-2.5 w-2.5 text-emerald-200" />
      </div>
      <div className="flex items-center gap-1.5 truncate">
        <span className="font-medium text-stone-900 text-[11px] truncate">
          {actor.name}
        </span>
        <span className="text-[10px] font-mono text-stone-500 truncate">
          ({actor.modelIdentifier})
        </span>
      </div>
    </div>
  );
}
