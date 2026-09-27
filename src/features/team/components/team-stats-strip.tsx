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
      <StatMetricCard
        title="Total Workspace Members"
        value={stats?.totalMembers ?? 0}
        subtext="Agency workforce, brokers & admins"
        icon={Users}
        variant="sky"
        isLoading={isLoading}
      />
      <StatMetricCard
        title="Active Luxury Brokers"
        value={stats?.activeBrokers ?? 0}
        subtext="Licensed advisors handling viewings"
        icon={ShieldCheck}
        variant="emerald"
        badge={stats ? `${stats.activeBrokers} Active` : undefined}
        isLoading={isLoading}
      />
      <StatMetricCard
        title="Lead Routing Active"
        value={stats?.routingActive ?? 0}
        subtext="Auto-territory dispatcher status"
        icon={GitBranch}
        variant="indigo"
        badge="Engine Live"
        isLoading={isLoading}
      />
      <StatMetricCard
        title="Available Lead Capacity"
        value={stats ? `${stats.availableCapacity}` : "0"}
        subtext={stats ? `${stats.capacityUtilizationPercent}% capacity utilized (${stats.currentActiveLeads} leads)` : "0% capacity"}
        icon={Zap}
        variant="amber"
        badge={stats ? `${stats.totalCapacity} Total Max` : undefined}
        isLoading={isLoading}
      />
    </div>
  );
}
