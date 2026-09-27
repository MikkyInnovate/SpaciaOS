"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  Layers,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { IntegrationItem } from "../types";

interface IntegrationsSummaryCardsProps {
  integrations: IntegrationItem[];
  onTestAll: () => Promise<void>;
  isTestingAll: boolean;
}

export function IntegrationsSummaryCards({
  integrations,
  onTestAll,
  isTestingAll,
}: IntegrationsSummaryCardsProps) {
  const total = integrations.length;
  const connectedCount = integrations.filter((i) => i.status === "connected").length;
  const healthyCount = integrations.filter((i) => i.healthStatus === "healthy").length;

  const validLatencies = integrations
    .filter((i) => typeof i.latencyMs === "number" && (i.latencyMs ?? 0) > 0)
    .map((i) => i.latencyMs as number);

  const avgLatency =
    validLatencies.length > 0
      ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
      : null;

  const healthScore = total > 0 ? Math.round((healthyCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Integrations */}
      <Card className="border-stone-200 shadow-xs bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-stone-500">Configured Services</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-stone-900">{total}</span>
              <span className="text-xs text-stone-400">integrations</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
            <Layers className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Connected Services */}
      <Card className="border-stone-200 shadow-xs bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-stone-500">Connected Services</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-800">
                {connectedCount}
              </span>
              <span className="text-xs text-stone-500">/ {total} active</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Fleet Health Score */}
      <Card className="border-stone-200 shadow-xs bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-stone-500">Fleet Health</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-stone-900">
                {healthScore}%
              </span>
              <span className="text-xs text-emerald-700 font-medium">operational</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#0d4a36]">
            <Zap className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Average Latency & Test All trigger */}
      <Card className="border-stone-200 shadow-xs bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-stone-500">Avg Fleet Latency</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-stone-900">
                {avgLatency ? `${avgLatency}ms` : "--"}
              </span>
              <span className="text-xs text-stone-400">response</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onTestAll}
            disabled={isTestingAll || total === 0}
            className="h-8 text-xs border-stone-200 text-stone-700 hover:bg-stone-50 font-medium gap-1.5 shadow-2xs"
            title="Run Health Checks on All Services"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-stone-500 ${isTestingAll ? "animate-spin" : ""}`} />
            {isTestingAll ? "Testing..." : "Test All"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
