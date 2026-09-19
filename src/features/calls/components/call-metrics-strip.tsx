import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { CallMetrics } from "../types";
import { Clock, MessageSquare, Zap, Mic2, User } from "lucide-react";

export interface CallMetricsStripProps {
  metrics: CallMetrics;
  className?: string;
}

export function CallMetricsStrip({ metrics, className }: CallMetricsStripProps) {
  const { durationFormatted, talkRatio, turnCount, averageLatencyMs } = metrics;

  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200 bg-stone-50/70 p-3 shadow-2xs space-y-2.5",
        className
      )}
    >
      {/* Top row metrics */}
      <div className="grid grid-cols-3 gap-2 text-center sm:text-left">
        {/* Duration */}
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
            <Clock className="h-3 w-3 text-stone-500" />
            <span>Call Duration</span>
          </span>
          <p className="font-mono text-sm font-bold text-stone-900 tabular-nums">
            {durationFormatted}
          </p>
        </div>

        {/* Turn Count */}
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-stone-500" />
            <span>Dialogue Turns</span>
          </span>
          <p className="font-mono text-sm font-bold text-stone-900 tabular-nums">
            {turnCount} turns
          </p>
        </div>

        {/* Speech Latency */}
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
            <Zap className="h-3 w-3 text-emerald-600" />
            <span>AI Latency</span>
          </span>
          <p className="font-mono text-sm font-bold text-emerald-800 tabular-nums">
            {averageLatencyMs}ms
          </p>
        </div>
      </div>

      {/* Talk-to-Listen Ratio Bar */}
      <div className="space-y-1.5 pt-1 border-t border-stone-200/80">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-stone-500 font-medium flex items-center gap-1">
            <Mic2 className="h-3 w-3 text-stone-600" />
            <span>Talk-to-Listen Ratio</span>
          </span>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-stone-700 font-semibold">
              AI: {talkRatio.aiPercent}%
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-emerald-800 font-bold flex items-center gap-0.5">
              <User className="h-2.5 w-2.5" />
              Prospect: {talkRatio.prospectPercent}%
            </span>
          </div>
        </div>

        {/* Visual Split Progress Bar */}
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-stone-200 flex"
          title={`Talk Ratio: AI ${talkRatio.aiPercent}% | Prospect ${talkRatio.prospectPercent}%`}
        >
          <div
            className="h-full bg-stone-700 transition-all duration-300"
            style={{ width: `${talkRatio.aiPercent}%` }}
          />
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${talkRatio.prospectPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-stone-400 italic">
          High prospect talk time (60%+) indicates effective autonomous discovery.
        </p>
      </div>
    </div>
  );
}
