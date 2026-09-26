import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import {
  ArrowDown,
  Award,
} from "lucide-react";
import { AnalyticsFunnelResponse, FunnelStage } from "../types";

interface FunnelStageChartProps {
  data: AnalyticsFunnelResponse;
  isLoading?: boolean;
}

const STAGE_COLORS: string[] = [
  "bg-stone-700",
  "bg-zinc-600",
  "bg-teal-700",
  "bg-emerald-700",
  "bg-amber-600",
  "bg-sky-600",
  "bg-indigo-600",
  "bg-[#0d4a36]",
];

const STAGE_BG_COLORS: string[] = [
  "bg-stone-100",
  "bg-zinc-100",
  "bg-teal-100",
  "bg-emerald-100",
  "bg-amber-100",
  "bg-sky-100",
  "bg-indigo-100",
  "bg-emerald-100",
];

const STAGE_TEXT_COLORS: string[] = [
  "text-stone-800",
  "text-zinc-800",
  "text-teal-900",
  "text-emerald-950",
  "text-amber-950",
  "text-sky-950",
  "text-indigo-950",
  "text-[#0d4a36]",
];

export function FunnelStageChart({ data, isLoading = false }: FunnelStageChartProps) {
  const [hoveredStage, setHoveredStage] = React.useState<number | null>(null);

  if (isLoading) {
    return (
      <Card className="bg-white border-border shadow-2xs">
        <CardHeader>
          <div className="h-6 w-48 bg-stone-100 rounded animate-pulse" />
          <div className="h-4 w-72 bg-stone-100 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-10 bg-stone-100 rounded-lg animate-pulse" style={{ width: `${100 - i * 10}%`, margin: "0 auto" }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  const { stages, totalLeads, wonCount, overallConversionRate } = data;

  return (
    <Card className="bg-white border-stone-200 shadow-2xs overflow-hidden">
      <CardHeader className="border-b border-stone-100 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-display font-bold text-stone-900">
              Conversion Funnel
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 mt-1">
              Lead-to-won progression across all pipeline stages
            </CardDescription>
          </div>

          {/* Aggregate Funnel Conversion Summary */}
          <div className="flex items-center gap-3 bg-stone-50 border border-stone-200/80 px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <span className="text-stone-400">Inbound:</span>
              <span className="font-bold text-stone-900 font-mono">{totalLeads}</span>
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-stone-400 -rotate-90" />
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <span className="text-stone-400">Won:</span>
              <span className="font-bold text-[#0d4a36] font-mono">{wonCount}</span>
            </div>
            <div className="h-4 w-px bg-stone-200 mx-1" />
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-semibold text-stone-900">Conversion:</span>
              <span className="text-xs font-bold font-mono text-[#0d4a36]">
                {overallConversionRate}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 pb-6">
        {/* Funnel Chart */}
        <div className="flex flex-col items-center gap-0">
          {stages.map((stageItem, index) => {
            const isLast = index === stages.length - 1;
            const isFirst = index === 0;
            const isHovered = hoveredStage === index;

            // Width tapers from 100% to a minimum based on percentageOfTop
            const barWidthPercent = Math.max(stageItem.percentageOfTop, 12);
            const barColor = STAGE_COLORS[index] || "bg-stone-600";
            const bgColor = STAGE_BG_COLORS[index] || "bg-stone-100";
            const textColor = STAGE_TEXT_COLORS[index] || "text-stone-800";

            return (
              <React.Fragment key={stageItem.stage}>
                {/* Stage Bar */}
                <div
                  className="relative w-full flex justify-center"
                  onMouseEnter={() => setHoveredStage(index)}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  <div
                    className={cn(
                      "relative flex items-center justify-between px-4 py-3 transition-all duration-300 cursor-pointer",
                      isFirst ? "rounded-t-xl" : "",
                      isLast ? "rounded-b-xl" : "",
                      isHovered ? "shadow-md z-10 scale-[1.02]" : "shadow-2xs",
                      barColor,
                    )}
                    style={{ width: `${barWidthPercent}%`, minWidth: "280px" }}
                  >
                    {/* Stage Label */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {stageItem.label}
                      </span>
                      {isLast && (
                        <span className="px-1.5 py-0.5 rounded bg-white/20 text-[9px] font-bold text-white uppercase tracking-wider">
                          Closed Won
                        </span>
                      )}
                    </div>

                    {/* Stage Count & Percentage */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-white/70">
                        {stageItem.percentageOfTop}%
                      </span>
                      <span className="text-base font-bold font-mono text-white">
                        {stageItem.count}
                      </span>
                    </div>
                  </div>

                  {/* Hover Tooltip */}
                  {isHovered && (
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full z-20 hidden lg:block">
                      <div className="bg-white border border-stone-200 shadow-lg rounded-xl p-3 min-w-[200px] animate-in fade-in slide-in-from-left-2 duration-150">
                        <div className="text-xs font-semibold text-stone-900 mb-2">
                          {stageItem.label}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <div className="text-stone-400">Volume</div>
                            <div className="font-bold font-mono text-stone-900">{stageItem.count}</div>
                          </div>
                          <div>
                            <div className="text-stone-400">% of Funnel</div>
                            <div className="font-bold font-mono text-[#0d4a36]">{stageItem.percentageOfTop}%</div>
                          </div>
                          {!isFirst && (
                            <>
                              <div>
                                <div className="text-stone-400">Step Rate</div>
                                <div className="font-bold font-mono text-stone-900">{stageItem.stepConversionRate}%</div>
                              </div>
                              <div>
                                <div className="text-stone-400">Drop-off</div>
                                <div className="font-bold font-mono text-rose-700">-{stageItem.dropOffCount}</div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-2 border-t border-stone-100 pt-2">
                          {stageItem.description}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Connector between stages */}
                {!isLast && (
                  <div className="flex items-center justify-center py-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-stone-400">
                      <ArrowDown className="w-3 h-3" />
                      <span className="font-mono font-medium text-stone-500">
                        {stages[index + 1].stepConversionRate}%
                      </span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Legend / Stage Descriptions (below chart, compact) */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stages.map((stageItem, index) => {
            const bgColor = STAGE_BG_COLORS[index] || "bg-stone-100";
            const textColor = STAGE_TEXT_COLORS[index] || "text-stone-800";
            const barColor = STAGE_COLORS[index] || "bg-stone-600";

            return (
              <div
                key={stageItem.stage}
                className={cn("p-2.5 rounded-lg border border-stone-200/60", bgColor)}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={cn("w-2 h-2 rounded-full", barColor)} />
                  <span className={cn("text-[11px] font-semibold", textColor)}>
                    {stageItem.label}
                  </span>
                </div>
                <div className="text-[10px] text-stone-500 line-clamp-2">
                  {stageItem.description}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
