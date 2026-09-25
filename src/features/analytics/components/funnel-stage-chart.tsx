import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  ArrowDown,
  TrendingDown,
  CheckCircle2,
  HelpCircle,
  Layers,
  Sparkles,
  Award,
} from "lucide-react";
import { AnalyticsFunnelResponse, FunnelStage } from "../types";

interface FunnelStageChartProps {
  data: AnalyticsFunnelResponse;
  isLoading?: boolean;
}

const STAGE_COLOR_MAP: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    bar: string;
    accent: string;
  }
> = {
  leads: {
    bg: "bg-stone-50",
    border: "border-stone-200",
    text: "text-stone-800",
    bar: "bg-stone-700",
    accent: "text-stone-600",
  },
  contacted: {
    bg: "bg-zinc-50",
    border: "border-zinc-200",
    text: "text-zinc-800",
    bar: "bg-zinc-600",
    accent: "text-zinc-600",
  },
  conversations: {
    bg: "bg-teal-50/50",
    border: "border-teal-200/70",
    text: "text-teal-900",
    bar: "bg-teal-700",
    accent: "text-teal-700",
  },
  qualified: {
    bg: "bg-emerald-50/60",
    border: "border-emerald-200",
    text: "text-emerald-950",
    bar: "bg-emerald-700",
    accent: "text-[#0d4a36]",
  },
  hot: {
    bg: "bg-amber-50/60",
    border: "border-amber-200",
    text: "text-amber-950",
    bar: "bg-amber-600",
    accent: "text-amber-700",
  },
  viewing_booked: {
    bg: "bg-sky-50/60",
    border: "border-sky-200",
    text: "text-sky-950",
    bar: "bg-sky-600",
    accent: "text-sky-700",
  },
  viewing_completed: {
    bg: "bg-indigo-50/60",
    border: "border-indigo-200",
    text: "text-indigo-950",
    bar: "bg-indigo-600",
    accent: "text-indigo-700",
  },
  won: {
    bg: "bg-emerald-50 border-emerald-300/80",
    border: "border-emerald-300",
    text: "text-[#0d4a36]",
    bar: "bg-[#0d4a36]",
    accent: "text-[#0d4a36]",
  },
};

export function FunnelStageChart({ data, isLoading = false }: FunnelStageChartProps) {
  const [selectedStage, setSelectedStage] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="bg-white border-border shadow-2xs">
        <CardHeader>
          <div className="h-6 w-48 bg-stone-100 rounded animate-pulse" />
          <div className="h-4 w-72 bg-stone-100 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-14 bg-stone-100 rounded-lg animate-pulse" />
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
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-display font-bold text-stone-900">
                8-Stage Operational Funnel
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-[#0d4a36] border-emerald-200 text-[10px] font-semibold"
              >
                Day 21 Certified
              </Badge>
            </div>
            <CardDescription className="text-xs text-stone-500 mt-1">
              Deterministic lead-to-won progression across all SpaciaOS autonomous pipeline stages
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

      <CardContent className="pt-6 pb-6 space-y-3">
        {stages.map((stageItem, index) => {
          const colors =
            STAGE_COLOR_MAP[stageItem.stage] || STAGE_COLOR_MAP.leads;
          const isSelected = selectedStage === stageItem.stage;
          const isFirst = index === 0;
          const isLast = index === stages.length - 1;

          // Bar width percentage relative to top (minimum 6% for visibility)
          const barWidthPercent = Math.max(stageItem.percentageOfTop, 8);

          return (
            <div key={stageItem.stage} className="relative group">
              {/* Connector Step-Rate Line between stages */}
              {!isFirst && (
                <div className="flex items-center justify-between px-6 py-0.5 -my-1 text-[11px] text-stone-400 z-10 relative">
                  <div className="flex items-center gap-1">
                    <ArrowDown className="w-3 h-3 text-stone-400" />
                    <span className="font-mono text-stone-600 font-medium">
                      {stageItem.stepConversionRate}% pass-through
                    </span>
                  </div>
                  {stageItem.dropOffCount > 0 && (
                    <div className="flex items-center gap-1 text-rose-600/90 text-[10px] font-mono">
                      <TrendingDown className="w-3 h-3 text-rose-500" />
                      <span>
                        -{stageItem.dropOffCount} ({stageItem.dropOffRate}% drop-off)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Main Funnel Bar Container */}
              <div
                onClick={() =>
                  setSelectedStage(isSelected ? null : stageItem.stage)
                }
                className={cn(
                  "relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs",
                  colors.bg,
                  colors.border,
                  isSelected
                    ? "ring-2 ring-[#0d4a36] shadow-sm"
                    : "hover:border-stone-400/80"
                )}
              >
                {/* Horizontal Progress Fill in the background */}
                <div
                  className="absolute inset-y-0 left-0 rounded-xl opacity-10 transition-all pointer-events-none"
                  style={{
                    width: `${barWidthPercent}%`,
                    backgroundColor: isLast ? "#0d4a36" : undefined,
                  }}
                />

                {/* Left: Stage Title & Description */}
                <div className="flex items-center gap-3 z-10">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold font-mono border",
                      isLast
                        ? "bg-[#0d4a36] text-white border-transparent"
                        : "bg-white text-stone-700 border-stone-300"
                    )}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900">
                        {stageItem.label}
                      </span>
                      {isLast && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-[#0d4a36] text-[9px] font-bold uppercase tracking-wider">
                          Closed Won
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {stageItem.description}
                    </div>
                  </div>
                </div>

                {/* Right: Stage Metrics (Count & % of Inbound) */}
                <div className="flex items-center gap-4 sm:gap-6 mt-2 sm:mt-0 z-10">
                  {/* Step Conversion Rate Chip */}
                  {!isFirst && (
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-stone-500 font-medium">
                        Step Conv
                      </div>
                      <div className="text-xs font-bold font-mono text-stone-700">
                        {stageItem.stepConversionRate}%
                      </div>
                    </div>
                  )}

                  {/* Percentage of Top Lead Volume */}
                  <div className="text-right">
                    <div className="text-[10px] text-stone-500 font-medium">
                      % of Funnel
                    </div>
                    <div className="text-xs font-bold font-mono text-stone-800">
                      {stageItem.percentageOfTop}%
                    </div>
                  </div>

                  {/* Absolute Count */}
                  <div className="min-w-[54px] text-right">
                    <div className="text-[10px] text-stone-500 font-medium">
                      Volume
                    </div>
                    <div
                      className={cn(
                        "text-base font-bold font-mono",
                        isLast ? "text-[#0d4a36]" : "text-stone-900"
                      )}
                    >
                      {stageItem.count}
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsible Inspection Details */}
              {isSelected && (
                <div className="mt-1.5 p-3 rounded-lg bg-stone-100/80 border border-stone-200/80 text-xs text-stone-700 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between font-medium">
                    <span className="font-semibold text-stone-900">
                      {stageItem.label} Deep Dive
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      Stage {index + 1} of 8
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="bg-white p-2 rounded border border-stone-200">
                      <div className="text-stone-400">Absolute Count</div>
                      <div className="font-bold font-mono text-stone-900">
                        {stageItem.count} leads
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border border-stone-200">
                      <div className="text-stone-400">Funnel Retention</div>
                      <div className="font-bold font-mono text-[#0d4a36]">
                        {stageItem.percentageOfTop}%
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border border-stone-200">
                      <div className="text-stone-400">Step Conversion</div>
                      <div className="font-bold font-mono text-stone-900">
                        {stageItem.stepConversionRate}%
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border border-stone-200">
                      <div className="text-stone-400">Drop-off Loss</div>
                      <div className="font-bold font-mono text-rose-700">
                        {stageItem.dropOffCount} ({stageItem.dropOffRate}%)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
