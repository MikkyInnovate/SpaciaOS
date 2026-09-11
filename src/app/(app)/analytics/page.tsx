"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { PipelineFunnel } from "@/features/dashboard/components/pipeline-funnel";
import { StatMetricCard } from "@/features/dashboard/components/stat-metric-card";
import { useWorkspace } from "@/lib/context/workspace-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  Users,
  Zap,
  CalendarCheck,
  TrendingUp,
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react";

type MonthKey = "sep-2026" | "aug-2026" | "jul-2026" | "q3-2026";

interface MonthAnalyticsConfig {
  id: MonthKey;
  label: string;
  badge?: string;
  periodDescription: string;
  metrics: {
    grossInbound: { value: string; trend: string; subtext: string; isPositive: boolean };
    qualificationRate: { value: string; trend: string; subtext: string; isPositive: boolean };
    bookedViewings: { value: string; trend: string; subtext: string; isPositive: boolean };
    pipelinePotential: { value: string; trend: string; subtext: string; isPositive: boolean };
  };
  benchmarks: {
    speedToLead: string;
    qualificationAccuracy: string;
    viewingVelocity: string;
  };
  trajectoryData: Array<{ date: string; inquiries: number; qualified: number; viewings: number }>;
}

const MONTH_DATASETS: Record<MonthKey, MonthAnalyticsConfig> = {
  "sep-2026": {
    id: "sep-2026",
    label: "September 2026",
    badge: "MTD",
    periodDescription:
      "Daily inbound volume, AI verified qualification, and viewing completions for September 2026 (Month-to-Date)",
    metrics: {
      grossInbound: { value: "128", trend: "+18.4%", subtext: "vs last week", isPositive: true },
      qualificationRate: { value: "76.5%", trend: "+5.2%", subtext: "autonomous pass", isPositive: true },
      bookedViewings: { value: "24", trend: "+12%", subtext: "on broker calendars", isPositive: true },
      pipelinePotential: { value: "₦1.24B", trend: "+22%", subtext: "verified budget", isPositive: true },
    },
    benchmarks: {
      speedToLead: "48 seconds",
      qualificationAccuracy: "76.5% Verified",
      viewingVelocity: "+38% vs Manual",
    },
    trajectoryData: [
      { date: "2026-09-01", inquiries: 36, qualified: 18, viewings: 6 },
      { date: "2026-09-02", inquiries: 29, qualified: 14, viewings: 4 },
      { date: "2026-09-03", inquiries: 34, qualified: 17, viewings: 5 },
      { date: "2026-09-04", inquiries: 38, qualified: 19, viewings: 6 },
      { date: "2026-09-05", inquiries: 25, qualified: 12, viewings: 3 },
      { date: "2026-09-06", inquiries: 22, qualified: 10, viewings: 3 },
      { date: "2026-09-07", inquiries: 40, qualified: 21, viewings: 7 },
      { date: "2026-09-08", inquiries: 45, qualified: 24, viewings: 8 },
      { date: "2026-09-09", inquiries: 42, qualified: 22, viewings: 6 },
    ],
  },
  "aug-2026": {
    id: "aug-2026",
    label: "August 2026",
    periodDescription:
      "Daily inbound volume, AI verified qualification, and viewing completions across August 2026",
    metrics: {
      grossInbound: { value: "384", trend: "+14.1%", subtext: "vs July 2026", isPositive: true },
      qualificationRate: { value: "72.8%", trend: "+3.4%", subtext: "autonomous pass", isPositive: true },
      bookedViewings: { value: "71", trend: "+9%", subtext: "on broker calendars", isPositive: true },
      pipelinePotential: { value: "₦3.65B", trend: "+15%", subtext: "verified budget", isPositive: true },
    },
    benchmarks: {
      speedToLead: "54 seconds",
      qualificationAccuracy: "72.8% Verified",
      viewingVelocity: "+31% vs Manual",
    },
    trajectoryData: [
      { date: "2026-08-01", inquiries: 24, qualified: 11, viewings: 3 },
      { date: "2026-08-04", inquiries: 28, qualified: 13, viewings: 4 },
      { date: "2026-08-07", inquiries: 31, qualified: 15, viewings: 5 },
      { date: "2026-08-10", inquiries: 27, qualified: 14, viewings: 4 },
      { date: "2026-08-13", inquiries: 33, qualified: 17, viewings: 6 },
      { date: "2026-08-16", inquiries: 35, qualified: 18, viewings: 6 },
      { date: "2026-08-19", inquiries: 30, qualified: 15, viewings: 5 },
      { date: "2026-08-22", inquiries: 38, qualified: 20, viewings: 7 },
      { date: "2026-08-25", inquiries: 32, qualified: 16, viewings: 6 },
      { date: "2026-08-28", inquiries: 41, qualified: 22, viewings: 8 },
      { date: "2026-08-31", inquiries: 36, qualified: 19, viewings: 7 },
    ],
  },
  "jul-2026": {
    id: "jul-2026",
    label: "July 2026",
    periodDescription:
      "Daily inbound volume, AI verified qualification, and viewing completions across July 2026",
    metrics: {
      grossInbound: { value: "312", trend: "+8.6%", subtext: "vs June 2026", isPositive: true },
      qualificationRate: { value: "69.2%", trend: "+2.1%", subtext: "autonomous pass", isPositive: true },
      bookedViewings: { value: "58", trend: "+6%", subtext: "on broker calendars", isPositive: true },
      pipelinePotential: { value: "₦2.88B", trend: "+11%", subtext: "verified budget", isPositive: true },
    },
    benchmarks: {
      speedToLead: "1m 02s",
      qualificationAccuracy: "69.2% Verified",
      viewingVelocity: "+24% vs Manual",
    },
    trajectoryData: [
      { date: "2026-07-02", inquiries: 21, qualified: 9, viewings: 3 },
      { date: "2026-07-06", inquiries: 24, qualified: 11, viewings: 4 },
      { date: "2026-07-10", inquiries: 22, qualified: 10, viewings: 3 },
      { date: "2026-07-14", inquiries: 28, qualified: 13, viewings: 4 },
      { date: "2026-07-18", inquiries: 26, qualified: 12, viewings: 5 },
      { date: "2026-07-22", inquiries: 30, qualified: 15, viewings: 5 },
      { date: "2026-07-26", inquiries: 29, qualified: 14, viewings: 5 },
      { date: "2026-07-29", inquiries: 34, qualified: 17, viewings: 6 },
      { date: "2026-07-31", inquiries: 31, qualified: 15, viewings: 5 },
    ],
  },
  "q3-2026": {
    id: "q3-2026",
    label: "Q3 2026",
    badge: "Quarter",
    periodDescription:
      "Aggregated trajectory and quarterly conversion metrics across Q3 2026 (Jul - Sep)",
    metrics: {
      grossInbound: { value: "824", trend: "+26.5%", subtext: "vs Q2 2026", isPositive: true },
      qualificationRate: { value: "74.1%", trend: "+4.8%", subtext: "quarterly average", isPositive: true },
      bookedViewings: { value: "153", trend: "+18%", subtext: "on broker calendars", isPositive: true },
      pipelinePotential: { value: "₦7.77B", trend: "+28%", subtext: "verified budget", isPositive: true },
    },
    benchmarks: {
      speedToLead: "51 seconds",
      qualificationAccuracy: "74.1% Verified",
      viewingVelocity: "+35% vs Manual",
    },
    trajectoryData: [
      { date: "2026-07-07", inquiries: 70, qualified: 33, viewings: 11 },
      { date: "2026-07-21", inquiries: 84, qualified: 40, viewings: 14 },
      { date: "2026-08-07", inquiries: 92, qualified: 44, viewings: 17 },
      { date: "2026-08-21", inquiries: 105, qualified: 52, viewings: 20 },
      { date: "2026-09-04", inquiries: 118, qualified: 62, viewings: 24 },
    ],
  },
};

const PRESET_OPTIONS: MonthAnalyticsConfig[] = [
  MONTH_DATASETS["sep-2026"],
  MONTH_DATASETS["aug-2026"],
  MONTH_DATASETS["jul-2026"],
  MONTH_DATASETS["q3-2026"],
];

export default function AnalyticsPage() {
  const { currentWorkspace } = useWorkspace();
  const [selectedPeriod, setSelectedPeriod] = React.useState<MonthKey>("sep-2026");
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date(2026, 8, 9));
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);

  const currentDataset = MONTH_DATASETS[selectedPeriod];

  return (
    <Container size="lg" className="space-y-6">
      <PageHeader
        title="Analytics"
        description={`Conversion metrics, pipeline velocity, and qualification performance for ${currentWorkspace?.name || "your workspace"}.`}
        actions={
          /* Date Picker Popover Button */
          <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 gap-2 px-3 text-xs font-medium text-stone-700 bg-white border-stone-200 hover:bg-stone-50 hover:text-stone-900 shadow-2xs rounded-lg cursor-pointer"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-[#0d4a36]" />
                <span className="font-semibold text-stone-900">{currentDataset.label}</span>
                {currentDataset.badge && (
                  <span className="rounded bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 text-[9px] font-semibold text-[#0d4a36] uppercase tracking-wider">
                    {currentDataset.badge}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-stone-400 ml-0.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border border-stone-200 shadow-xl rounded-xl overflow-hidden"
              align="end"
            >
              <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-stone-100 bg-white">
                {/* Preset List Column */}
                <div className="p-3 sm:w-48 space-y-1.5 bg-stone-50/70 text-xs">
                  <div className="px-2 py-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                    Timeframe Presets
                  </div>
                  {PRESET_OPTIONS.map((period) => {
                    const isSelected = selectedPeriod === period.id;
                    return (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => {
                          setSelectedPeriod(period.id);
                          if (period.id === "sep-2026") setSelectedDate(new Date(2026, 8, 9));
                          else if (period.id === "aug-2026") setSelectedDate(new Date(2026, 7, 31));
                          else if (period.id === "jul-2026") setSelectedDate(new Date(2026, 6, 31));
                          setIsPickerOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
                          isSelected
                            ? "bg-white text-stone-900 font-semibold shadow-2xs border border-stone-200/80"
                            : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                        )}
                      >
                        <span>{period.label}</span>
                        {period.badge && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-stone-200/60 text-stone-600 uppercase font-semibold">
                            {period.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Calendar Column */}
                <div className="p-2">
                  <Calendar
                    selectedDate={selectedDate}
                    onSelectDate={(date) => {
                      setSelectedDate(date);
                      const month = date.getMonth();
                      if (month === 8) setSelectedPeriod("sep-2026");
                      else if (month === 7) setSelectedPeriod("aug-2026");
                      else if (month === 6) setSelectedPeriod("jul-2026");
                      else setSelectedPeriod("q3-2026");
                      setIsPickerOpen(false);
                    }}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        }
      />

      {/* Metrics Row (Dynamically calculated based on selected date/month) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetricCard
          title="Gross Inbound Prospects"
          value={currentDataset.metrics.grossInbound.value}
          subtext={currentDataset.metrics.grossInbound.subtext}
          trend={{
            value: currentDataset.metrics.grossInbound.trend,
            isPositive: currentDataset.metrics.grossInbound.isPositive,
          }}
          icon={Users}
        />
        <StatMetricCard
          title="Instant Qualification Rate"
          value={currentDataset.metrics.qualificationRate.value}
          subtext={currentDataset.metrics.qualificationRate.subtext}
          trend={{
            value: currentDataset.metrics.qualificationRate.trend,
            isPositive: currentDataset.metrics.qualificationRate.isPositive,
          }}
          icon={Zap}
        />
        <StatMetricCard
          title="Booked Viewings"
          value={currentDataset.metrics.bookedViewings.value}
          subtext={currentDataset.metrics.bookedViewings.subtext}
          trend={{
            value: currentDataset.metrics.bookedViewings.trend,
            isPositive: currentDataset.metrics.bookedViewings.isPositive,
          }}
          icon={CalendarCheck}
        />
        <StatMetricCard
          title="Pipeline Deal Potential"
          value={currentDataset.metrics.pipelinePotential.value}
          subtext={currentDataset.metrics.pipelinePotential.subtext}
          trend={{
            value: currentDataset.metrics.pipelinePotential.trend,
            isPositive: currentDataset.metrics.pipelinePotential.isPositive,
          }}
          icon={TrendingUp}
        />
      </div>

      {/* Trajectory & Funnel Progression with dynamic monthly data */}
      <PipelineFunnel
        key={selectedPeriod}
        data={currentDataset.trajectoryData}
        periodDescription={currentDataset.periodDescription}
        benchmarks={currentDataset.benchmarks}
      />
    </Container>
  );
}
