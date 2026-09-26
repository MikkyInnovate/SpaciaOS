"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { PipelineFunnel } from "@/features/dashboard/components/pipeline-funnel";
import { useWorkspace } from "@/lib/context/workspace-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  RefreshCw,
  Layers,
  CheckCircle2,
  Gauge,
} from "lucide-react";
import {
  analyticsService,
  AnalyticsSummaryCards,
  FunnelStageChart,
  RevenuePathStepper,
  AnalyticsFunnelResponse,
  RevenuePathResponse,
  AnalyticsOverviewMetrics,
  AnalyticsPeriod,
} from "@/features/analytics";

type MonthKey = "sep-2026" | "aug-2026" | "jul-2026" | "q3-2026";

interface MonthAnalyticsConfig {
  id: MonthKey;
  periodParam: AnalyticsPeriod;
  label: string;
  badge?: string;
  periodDescription: string;
  trajectoryData: Array<{ date: string; inquiries: number; qualified: number; viewings: number }>;
}

const MONTH_DATASETS: Record<MonthKey, MonthAnalyticsConfig> = {
  "sep-2026": {
    id: "sep-2026",
    periodParam: "mtd",
    label: "September 2026",
    badge: "MTD",
    periodDescription:
      "Daily inbound volume, qualification, and viewing completions for September 2026 (Month-to-Date)",
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
    periodParam: "30d",
    label: "August 2026",
    periodDescription:
      "Daily inbound volume, qualification, and viewing completions across August 2026",
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
    periodParam: "90d",
    label: "July 2026",
    periodDescription:
      "Daily inbound volume, qualification, and viewing completions across July 2026",
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
    periodParam: "all",
    label: "Q3 2026",
    badge: "Quarter",
    periodDescription:
      "Aggregated trajectory and conversion metrics across Q3 2026 (Jul - Sep)",
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

type AnalyticsView = "funnel" | "pipeline" | "performance";

const VIEW_OPTIONS: { key: AnalyticsView; label: string; icon: React.ElementType }[] = [
  { key: "funnel", label: "Sales Funnel", icon: Layers },
  { key: "pipeline", label: "Sales Pipeline", icon: CheckCircle2 },
  { key: "performance", label: "Performance", icon: Gauge },
];

export default function AnalyticsPage() {
  const { currentWorkspace } = useWorkspace();
  const [selectedPeriod, setSelectedPeriod] = React.useState<MonthKey>("sep-2026");
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date(2026, 8, 9));
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [activeView, setActiveView] = React.useState<AnalyticsView>("funnel");

  // Analytics states
  const [funnelData, setFunnelData] = React.useState<AnalyticsFunnelResponse | null>(null);
  const [metricsData, setMetricsData] = React.useState<AnalyticsOverviewMetrics | null>(null);
  const [revenuePathData, setRevenuePathData] = React.useState<RevenuePathResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const currentDataset = MONTH_DATASETS[selectedPeriod];

  const fetchAnalytics = React.useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [funnel, metrics, revPath] = await Promise.all([
        analyticsService.getFunnel({ period: currentDataset.periodParam }),
        analyticsService.getOverviewMetrics({ period: currentDataset.periodParam }),
        analyticsService.getRevenuePath(),
      ]);

      setFunnelData(funnel);
      setMetricsData(metrics);
      setRevenuePathData(revPath);
    } catch (err) {
      console.error("[AnalyticsPage] Error loading analytics data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentDataset.periodParam]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <Container size="lg" className="space-y-6">
      <PageHeader
        title="Analytics"
        description={`Conversion funnels, pipeline health, and performance metrics for ${currentWorkspace?.name || "your workspace"}.`}
        actions={
          <div className="flex items-center gap-2">
            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnalytics(true)}
              disabled={isRefreshing}
              className="h-9 w-9 p-0 border-stone-200 text-stone-600 hover:text-stone-900 bg-white shadow-2xs rounded-lg cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw
                className={cn(
                  "w-3.5 h-3.5",
                  isRefreshing && "animate-spin text-[#0d4a36]"
                )}
              />
            </Button>

            {/* Date Picker Popover Button */}
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
                      Timeframe
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
          </div>
        }
      />

      {/* KPI Metrics Summary Row */}
      {metricsData ? (
        <AnalyticsSummaryCards metrics={metricsData} isLoading={isLoading} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* View Filter Pills — Dashboard style */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {VIEW_OPTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveView(key)}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5",
              activeView === key
                ? "bg-stone-900 text-white shadow-2xs"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Conditional View Content */}
      <div className="space-y-6">
        {activeView === "funnel" && (
          <>
            {funnelData && (
              <FunnelStageChart data={funnelData} isLoading={isLoading} />
            )}
            <PipelineFunnel
              key={selectedPeriod}
              data={currentDataset.trajectoryData}
              periodDescription={currentDataset.periodDescription}
              benchmarks={{
                speedToLead: metricsData?.speedToLead.value || "48 seconds",
                qualificationAccuracy:
                  metricsData?.qualificationRate.value || "76.5% Verified",
                viewingVelocity: "+38% vs Manual",
              }}
            />
          </>
        )}

        {activeView === "pipeline" && revenuePathData && (
          <RevenuePathStepper
            data={revenuePathData}
            isLoading={isLoading}
          />
        )}

        {activeView === "performance" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Speed to Lead
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-[#0d4a36]">
                  Active
                </span>
              </div>
              <div className="text-3xl font-display font-bold text-stone-900">
                {metricsData?.speedToLead.value || "48s"}
              </div>
              <p className="text-xs text-stone-500">
                Average time from new enquiry to first AI-powered contact.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Qualification Accuracy
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                  Verified
                </span>
              </div>
              <div className="text-3xl font-display font-bold text-stone-900">
                {metricsData?.qualificationRate.value || "76.5%"}
              </div>
              <p className="text-xs text-stone-500">
                Percentage of prospects passing qualification before booking a viewing.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Viewing Velocity
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                  Accelerated
                </span>
              </div>
              <div className="text-3xl font-display font-bold text-stone-900">
                +38%
              </div>
              <p className="text-xs text-stone-500">
                Faster booking cycle compared to manual operations.
              </p>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
