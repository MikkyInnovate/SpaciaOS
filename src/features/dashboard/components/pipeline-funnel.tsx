"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardFunnelStage } from "../types";

// 14-day operational trajectory showing Inbound Volume vs Qualified Progression
const trajectoryData = [
  { date: "2026-08-27", inquiries: 24, qualified: 11, viewings: 3 },
  { date: "2026-08-28", inquiries: 28, qualified: 13, viewings: 4 },
  { date: "2026-08-29", inquiries: 20, qualified: 9, viewings: 2 },
  { date: "2026-08-30", inquiries: 18, qualified: 8, viewings: 2 },
  { date: "2026-08-31", inquiries: 32, qualified: 16, viewings: 5 },
  { date: "2026-09-01", inquiries: 36, qualified: 18, viewings: 6 },
  { date: "2026-09-02", inquiries: 29, qualified: 14, viewings: 4 },
  { date: "2026-09-03", inquiries: 34, qualified: 17, viewings: 5 },
  { date: "2026-09-04", inquiries: 38, qualified: 19, viewings: 6 },
  { date: "2026-09-05", inquiries: 25, qualified: 12, viewings: 3 },
  { date: "2026-09-06", inquiries: 22, qualified: 10, viewings: 3 },
  { date: "2026-09-07", inquiries: 40, qualified: 21, viewings: 7 },
  { date: "2026-09-08", inquiries: 45, qualified: 24, viewings: 8 },
  { date: "2026-09-09", inquiries: 42, qualified: 22, viewings: 6 },
];

const chartConfig = {
  inquiries: {
    label: "Inbound Inquiries",
    color: "#3f3f46", // Clean Charcoal
  },
  qualified: {
    label: "Qualified Intent",
    color: "#0d4a36", // Pacia Signature Forest Green
  },
  viewings: {
    label: "Confirmed Viewings",
    color: "#2563eb", // Deep Royal Indigo/Blue
  },
} satisfies ChartConfig;

export interface PipelineFunnelProps {
  stages?: DashboardFunnelStage[];
  data?: Array<{ date: string; inquiries: number; qualified: number; viewings: number }>;
  periodDescription?: string;
  benchmarks?: {
    speedToLead: string;
    qualificationAccuracy: string;
    viewingVelocity: string;
  };
}

export function PipelineFunnel({
  data = trajectoryData,
  periodDescription = "Daily inbound volume, AI verified qualification, and viewing completions over the last 14 days",
  benchmarks,
}: PipelineFunnelProps) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("qualified");

  const totals = React.useMemo(
    () => ({
      inquiries: data.reduce((acc, curr) => acc + curr.inquiries, 0),
      qualified: data.reduce((acc, curr) => acc + curr.qualified, 0),
      viewings: data.reduce((acc, curr) => acc + curr.viewings, 0),
    }),
    [data]
  );

  return (
    <Card className="py-4 sm:py-0 bg-white border-border shadow-2xs">
      <CardHeader className="flex flex-col items-stretch border-b border-border p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 sm:py-0">
          <CardTitle className="font-display text-base font-bold text-stone-900">
            Pipeline Progression & Conversion Trajectory
          </CardTitle>
          <CardDescription className="text-xs text-stone-500">
            {periodDescription}
          </CardDescription>
        </div>

        {/* Interactive Metric Switcher Tabs */}
        <div className="flex border-t sm:border-t-0 sm:border-l border-border">
          {(["inquiries", "qualified", "viewings"] as const).map((key) => {
            const isActive = activeChart === key;
            return (
              <button
                key={key}
                type="button"
                data-active={isActive}
                className="flex flex-1 flex-col justify-center gap-1 px-4 py-3.5 sm:px-6 sm:py-4 text-left border-r last:border-r-0 border-border transition-colors cursor-pointer data-[active=true]:bg-stone-50/90 hover:bg-stone-50/50"
                onClick={() => setActiveChart(key)}
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
                  {totals[key].toLocaleString()}
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
          <LineChart
            accessibilityLayer
            data={trajectoryData}
            margin={{
              top: 10,
              left: 8,
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
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={28}
              stroke="#71717a"
              tick={{ fontSize: 11, fill: "#71717a" }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              stroke="#71717a"
              tick={{ fontSize: 11, fill: "#71717a" }}
              domain={[0, "auto"]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px] bg-white border border-stone-200 shadow-md p-2.5 rounded-lg text-xs"
                  labelFormatter={(value: unknown) => {
                    if (!value) return "";
                    return new Date(String(value)).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={chartConfig[activeChart].color}
              strokeWidth={2.5}
              dot={{
                r: 3.5,
                fill: chartConfig[activeChart].color,
                stroke: "#ffffff",
                strokeWidth: 1.5,
              }}
              activeDot={{
                r: 6,
                fill: chartConfig[activeChart].color,
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ChartContainer>

        {/* Velocity Benchmarks Under Chart */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-2 border-t border-border/80">
          <div className="p-3 rounded-md border border-stone-200/80 bg-stone-50/50">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Speed to Lead
            </span>
            <p className="font-display text-lg font-bold text-stone-900 mt-0.5">
              {benchmarks?.speedToLead || "48 seconds"}
            </p>
            <span className="text-[11px] text-stone-500">
              Autonomous AI dial & SMS response
            </span>
          </div>

          <div className="p-3 rounded-md border border-stone-200/80 bg-stone-50/50">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Qualification Accuracy
            </span>
            <p className="font-display text-lg font-bold text-stone-900 mt-0.5">
              {benchmarks?.qualificationAccuracy || "42.8% Verified"}
            </p>
            <span className="text-[11px] text-stone-500">
              Commercial budget & move timeline confirmed
            </span>
          </div>

          <div className="p-3 rounded-md border border-stone-200/80 bg-stone-50/50">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Viewing Velocity
            </span>
            <p className="font-display text-lg font-bold text-stone-900 mt-0.5">
              {benchmarks?.viewingVelocity || "+38% vs Manual"}
            </p>
            <span className="text-[11px] text-stone-500">
              Calendar bookings via voice agent
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
