"use client";

import * as React from "react";
import { Users, ShieldCheck, GitBranch, Zap } from "lucide-react";
import { StatMetricCard } from "@/features/dashboard/components/stat-metric-card";
import type { TeamStats } from "../types";

export interface TeamStatsStripProps {
  stats: TeamStats | null;
  isLoading?: boolean;
}

export function TeamStatsStrip({ stats, isLoading = false }: TeamStatsStripProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Members */}
      <StatMetricCard
        title="Total Members"
        value={stats?.totalMembers ?? 0}
        subtext="Brokers, operations admins & staff"
        trend={{
          value: "+100%",
          isPositive: true,
        }}
        icon={Users}
        variant="sky"
        isLoading={isLoading}
      />

      {/* 2. Active Luxury Brokers */}
      <StatMetricCard
        title="Active Brokers"
        value={stats?.activeBrokers ?? 0}
        subtext="Licensed real estate advisors"
        trend={{
          value: `${stats ? stats.activeBrokers : 0} online`,
          isPositive: true,
        }}
        icon={ShieldCheck}
        variant="emerald"
        isLoading={isLoading}
      />

      {/* 3. Lead Routing Active */}
      <StatMetricCard
        title="Lead Routing"
        value={stats?.routingActive ?? 0}
        subtext="Territory dispatchers active"
        trend={{
          value: "Live",
          isPositive: true,
        }}
        icon={GitBranch}
        variant="indigo"
        isLoading={isLoading}
      />

      {/* 4. Available Capacity */}
      <StatMetricCard
        title="Lead Capacity"
        value={stats ? `${stats.availableCapacity}` : "0"}
        subtext={
          stats
            ? `${stats.capacityUtilizationPercent}% utilized (${stats.currentActiveLeads} leads)`
            : "Fleet lead slots"
        }
        trend={{
          value: stats ? `${stats.totalCapacity} max` : "0 max",
          isPositive: true,
        }}
        icon={Zap}
        variant="amber"
        isLoading={isLoading}
      />
    </div>
  );
}
