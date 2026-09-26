"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { AnalyticsFunnelResponse } from "../types";

interface FunnelStageChartProps {
  data?: AnalyticsFunnelResponse | null;
  isLoading?: boolean;
}

type FunnelMetricKey = "count" | "percentageOfTop" | "stepConversionRate";

const chartConfig = {
  count: {
    label: "Lead Volume",
    color: "#0d4a36",
  },
  percentageOfTop: {
    label: "Funnel Retention",
    color: "#059669",
  },
  stepConversionRate: {
    label: "Step Pass-Through",
    color: "#2563eb",
  },
} satisfies ChartConfig;

const STAGE_BAR_COLORS = [
  "#71717a", // Leads (Zinc 500)
  "#52525b", // Contacted (Zinc 600)
  "#3f3f46", // Conversations (Zinc 700)
  "#0d9488", // Qualified (Teal 600)
  "#059669", // Hot (Emerald 600)
  "#0284c7", // Booked (Sky 600)
  "#2563eb", // Completed (Blue 600)
  "#0d4a36", // Won (Pacia Signature Forest Green)
];

const STAGE_SHORT_LABELS: Record<string, string> = {
  leads: "Leads",
  contacted: "Contacted",
  conversations: "In Talk",
  qualified: "Qualified",
  hot: "Hot",
  viewing_booked: "Booked",
  viewing_completed: "Completed",
  won: "Won",
};

interface TooltipPayloadItem {
  payload: {
    stage: string;
    label: string;
    stageNumber: number;
    count: number;
    percentageOfTop: number;
    stepConversionRate: number;
    dropOffCount: number;
    dropOffRate: number;
    description: string;
    isWon: boolean;
  };
}

function FunnelCustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="w-[220px] rounded-xl border border-stone-200 bg-white p-3 shadow-lg text-xs space-y-2">
      <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
        <span className="font-semibold text-stone-900">
          {item.stageNumber}. {item.label}
        </span>
        {item.isWon && (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#0d4a36]">
            Closed Won
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-[10px] text-stone-400 block">Volume</span>
          <span className="font-bold font-mono text-stone-900">{item.count} leads</span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 block">% of Funnel</span>
          <span className="font-bold font-mono text-[#0d4a36]">{item.percentageOfTop}%</span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 block">Step Conv.</span>
          <span className="font-bold font-mono text-stone-900">{item.stepConversionRate}%</span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 block">Drop-off</span>
          <span className="font-bold font-mono text-rose-600">
            {item.dropOffCount > 0 ? `-${item.dropOffCount} (${item.dropOffRate}%)` : "0"}
          </span>
        </div>
      </div>
      <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-100 leading-normal">
        {item.description}
      </div>
    </div>
  );
}

export function FunnelStageChart({ data, isLoading = false }: FunnelStageChartProps) {
  const [activeMetric, setActiveMetric] = React.useState<FunnelMetricKey>("count");

  if (isLoading || !data) {
    return (
      <Card className="py-4 sm:py-0 bg-white border-border shadow-2xs overflow-hidden">
        <CardHeader className="flex flex-col items-stretch border-b border-border p-0! sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1.5 px-6 py-4">
            <div className="h-5 w-44 bg-stone-200/80 rounded animate-pulse" />
            <div className="h-3 w-64 bg-stone-100 rounded animate-pulse" />
          </div>
          <div className="flex border-t sm:border-t-0 sm:border-l border-border">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-1 flex-col justify-center gap-1.5 px-4 py-3.5 sm:px-6 sm:py-4 border-r last:border-r-0 border-border min-w-[130px]"
              >
                <div className="h-3 w-20 bg-stone-100 rounded animate-pulse" />
                <div className="h-6 w-16 bg-stone-200/80 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:p-6 space-y-4">
          {/* Low-fidelity funnel bars skeleton */}
          <div className="h-[260px] w-full flex items-end justify-between gap-3 px-4 pb-4 pt-8 bg-stone-50/40 rounded-xl border border-dashed border-stone-200">
            {[100, 88, 76, 62, 50, 38, 26, 16].map((pct, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full max-w-[56px] rounded-t-lg bg-stone-200/70 animate-pulse"
                  style={{ height: `${pct}%` }}
                />
                <div className="h-3 w-10 bg-stone-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Bottom summary boxes skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 border-t border-border/80">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-md border border-stone-200/80 bg-stone-50/50 space-y-2">
                <div className="h-3 w-20 bg-stone-100 rounded animate-pulse" />
                <div className="h-6 w-14 bg-stone-200/80 rounded animate-pulse" />
                <div className="h-3 w-28 bg-stone-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { stages, totalLeads, wonCount, overallConversionRate } = data;

  const avgStepConversion = React.useMemo(() => {
    if (!stages.length) return 0;
    const nonFirst = stages.slice(1);
    if (!nonFirst.length) return 100;
    const sum = nonFirst.reduce((acc, curr) => acc + curr.stepConversionRate, 0);
    return Math.round((sum / nonFirst.length) * 10) / 10;
  }, [stages]);

  const chartData = React.useMemo(() => {
    return stages.map((s, idx) => ({
      stage: s.stage,
      label: s.label,
      shortLabel: STAGE_SHORT_LABELS[s.stage] || s.label,
      stageNumber: idx + 1,
      count: s.count,
      percentageOfTop: s.percentageOfTop,
      stepConversionRate: s.stepConversionRate,
      dropOffCount: s.dropOffCount,
      dropOffRate: s.dropOffRate,
      description: s.description,
      isWon: idx === stages.length - 1,
    }));
  }, [stages]);

  const qualifiedCount = React.useMemo(() => {
    return stages.find((s) => s.stage === "qualified")?.count ?? 0;
  }, [stages]);

  const viewingsCount = React.useMemo(() => {
    return stages.find((s) => s.stage === "viewing_completed")?.count ?? 0;
  }, [stages]);

  return (
    <Card className="py-4 sm:py-0 bg-white border-border shadow-2xs overflow-hidden">
      <CardHeader className="flex flex-col items-stretch border-b border-border p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 sm:py-0">
          <CardTitle className="font-display text-base font-bold text-stone-900">
            Conversion Funnel
          </CardTitle>
          <CardDescription className="text-xs text-stone-500">
            Stage-by-stage progression from inbound inquiry to closed won
          </CardDescription>
        </div>

        {/* Interactive Metric Switcher Tabs */}
        <div className="flex border-t sm:border-t-0 sm:border-l border-border">
          {(["count", "percentageOfTop", "stepConversionRate"] as const).map((key) => {
            const isActive = activeMetric === key;
            const displayValue =
              key === "count"
                ? totalLeads.toLocaleString()
                : key === "percentageOfTop"
                ? `${overallConversionRate}%`
                : `${avgStepConversion}%`;

            return (
              <button
                key={key}
                type="button"
                data-active={isActive}
                className="flex flex-1 flex-col justify-center gap-1 px-4 py-3.5 sm:px-6 sm:py-4 text-left border-r last:border-r-0 border-border transition-colors cursor-pointer data-[active=true]:bg-stone-50/90 hover:bg-stone-50/50"
                onClick={() => setActiveMetric(key)}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: chartConfig[key].color }}
                  />
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider truncate">
                    {chartConfig[key].label}
                  </span>
                </div>
                <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-stone-900 tabular-nums">
                  {displayValue}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="px-4 py-5 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              left: 0,
              right: 14,
              bottom: 0,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 4"
              stroke="#e4e4e7"
            />
            <XAxis
              dataKey="shortLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              stroke="#71717a"
              tick={{ fontSize: 11, fill: "#71717a" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              stroke="#71717a"
              tick={{ fontSize: 11, fill: "#71717a" }}
              domain={[0, "auto"]}
              tickFormatter={(val: number) => {
                if (activeMetric === "count") return `${val}`;
                return `${val}%`;
              }}
            />
            <ChartTooltip content={<FunnelCustomTooltip />} />
            <Bar
              dataKey={activeMetric}
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
            >
              <LabelList
                dataKey={activeMetric}
                position="top"
                offset={8}
                fontSize={10}
                fontWeight={600}
                fill="#52525b"
                formatter={(val: unknown) => {
                  const num = Number(val);
                  if (isNaN(num)) return "";
                  if (activeMetric === "count") return `${num}`;
                  return `${num}%`;
                }}
              />
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.stage}`}
                  fill={STAGE_BAR_COLORS[index % STAGE_BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Funnel Metrics Summary Under Chart */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 mt-2 border-t border-border/80">
          <div className="p-3 rounded-md border border-stone-200/80 bg-stone-50/50">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Total Inbound
            </span>
            <p className="font-display text-lg font-bold text-stone-900 mt-0.5">
              {totalLeads.toLocaleString()}
            </p>
            <span className="text-[11px] text-stone-500">
              Top of conversion funnel
            </span>
          </div>

          <div className="p-3 rounded-md border border-stone-200/80 bg-stone-50/50">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Qualified Intent
            </span>
            <p className="font-display text-lg font-bold text-stone-900 mt-0.5">
              {qualifiedCount.toLocaleString()}
            </p>
            <span className="text-[11px] text-stone-500">
              Passed qualification criteria
            </span>
          </div>

          <div className="p-3 rounded-md border border-stone-200/80 bg-stone-50/50">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Completed Viewings
            </span>
            <p className="font-display text-lg font-bold text-stone-900 mt-0.5">
              {viewingsCount.toLocaleString()}
            </p>
            <span className="text-[11px] text-stone-500">
              Attended property walkthroughs
            </span>
          </div>

          <div className="p-3 rounded-md border border-stone-200/80 bg-stone-50/50">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Overall Win Rate
            </span>
            <p className="font-display text-lg font-bold text-[#0d4a36] mt-0.5">
              {overallConversionRate}%
            </p>
            <span className="text-[11px] text-stone-500">
              {wonCount} closed deals
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
