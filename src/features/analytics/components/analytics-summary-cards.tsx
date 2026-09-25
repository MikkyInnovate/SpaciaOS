import * as React from "react";
import { Users, Zap, CalendarCheck, TrendingUp, Clock, ShieldCheck } from "lucide-react";
import { StatMetricCard } from "@/features/dashboard/components/stat-metric-card";
import { AnalyticsOverviewMetrics } from "../types";

interface AnalyticsSummaryCardsProps {
  metrics: AnalyticsOverviewMetrics;
  isLoading?: boolean;
}

export function AnalyticsSummaryCards({
  metrics,
  isLoading = false,
}: AnalyticsSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-stone-100 animate-pulse border border-stone-200/60"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetricCard
          title="Gross Inbound Prospects"
          value={metrics.grossInbound.value}
          subtext={metrics.grossInbound.subtext}
          trend={
            metrics.grossInbound.trend
              ? {
                  value: metrics.grossInbound.trend,
                  isPositive: metrics.grossInbound.isPositive ?? true,
                }
              : undefined
          }
          icon={Users}
          variant="stone"
        />

        <StatMetricCard
          title="Instant Qualification Rate"
          value={metrics.qualificationRate.value}
          subtext={metrics.qualificationRate.subtext}
          trend={
            metrics.qualificationRate.trend
              ? {
                  value: metrics.qualificationRate.trend,
                  isPositive: metrics.qualificationRate.isPositive ?? true,
                }
              : undefined
          }
          icon={Zap}
          variant="emerald"
        />

        <StatMetricCard
          title="Booked Viewings"
          value={metrics.bookedViewings.value}
          subtext={metrics.bookedViewings.subtext}
          trend={
            metrics.bookedViewings.trend
              ? {
                  value: metrics.bookedViewings.trend,
                  isPositive: metrics.bookedViewings.isPositive ?? true,
                }
              : undefined
          }
          icon={CalendarCheck}
          variant="sky"
        />

        <StatMetricCard
          title="Pipeline Deal Potential"
          value={metrics.pipelinePotential.value}
          subtext={metrics.pipelinePotential.subtext}
          trend={
            metrics.pipelinePotential.trend
              ? {
                  value: metrics.pipelinePotential.trend,
                  isPositive: metrics.pipelinePotential.isPositive ?? true,
                }
              : undefined
          }
          icon={TrendingUp}
          variant="amber"
        />
      </div>

      {/* Autonomous Operational Velocity Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200/70 text-[#0d4a36]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-900">
                Speed-to-Lead (Inbound to Voice Outreach)
              </div>
              <div className="text-[11px] text-stone-500">
                {metrics.speedToLead.subtext}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-bold font-mono text-stone-900">
              {metrics.speedToLead.value}
            </div>
            <div className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md inline-block">
              Sub-1 minute SLA
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-50 border border-sky-200/70 text-sky-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-900">
                Autonomous Resolution Rate
              </div>
              <div className="text-[11px] text-stone-500">
                {metrics.autonomousResolutionRate.subtext}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-bold font-mono text-stone-900">
              {metrics.autonomousResolutionRate.value}
            </div>
            <div className="text-[10px] font-semibold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded-md inline-block">
              Zero human fatigue
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
