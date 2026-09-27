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
import { cn } from "@/lib/utils/cn";
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

  const healthScore = connectedCount > 0 ? Math.round((healthyCount / connectedCount) * 100) : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Configured Services */}
      <Card className="bg-white border-stone-200/80 shadow-2xs hover:border-stone-300 transition-colors">
        <CardContent className="p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
              Configured Services
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-600 shadow-2xs shrink-0">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums leading-none">
              {total}
            </span>
            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border leading-none shrink-0 bg-stone-100 text-stone-700 border-stone-200">
              Active Fleet
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500 font-normal truncate">
            Client data & external connectors
          </p>
        </CardContent>
      </Card>

      {/* 2. Active Connections */}
      <Card className="bg-white border-stone-200/80 shadow-2xs hover:border-stone-300 transition-colors">
        <CardContent className="p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
              Connected Services
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-[#0d4a36] shadow-2xs shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "font-display text-2xl font-bold tracking-tight tabular-nums leading-none",
                connectedCount > 0 ? "text-emerald-800" : "text-stone-900"
              )}
            >
              {connectedCount} / {total}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border leading-none shrink-0",
                connectedCount > 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-stone-100 text-stone-600 border-stone-200"
              )}
            >
              {connectedCount > 0 ? "Online" : "Pending Setup"}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500 font-normal truncate">
            {connectedCount > 0 ? "Live authenticated sessions" : "No active connections"}
          </p>
        </CardContent>
      </Card>

      {/* 3. Fleet Health Score */}
      <Card className="bg-white border-stone-200/80 shadow-2xs hover:border-stone-300 transition-colors">
        <CardContent className="p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
              Fleet Health Score
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-[#0d4a36] shadow-2xs shrink-0">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums leading-none">
              {healthScore !== null ? `${healthScore}%` : "—"}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border leading-none shrink-0",
                healthScore !== null && healthScore >= 80
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-stone-100 text-stone-600 border-stone-200"
              )}
            >
              {healthScore !== null
                ? healthScore >= 80
                  ? "Operational"
                  : "Degraded"
                : "Awaiting Setup"}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500 font-normal truncate">
            {healthScore !== null
              ? "Protocol handshake validated"
              : "Connect services to benchmark"}
          </p>
        </CardContent>
      </Card>

      {/* 4. Avg Fleet Latency & Diagnostics */}
      <Card className="bg-white border-stone-200/80 shadow-2xs hover:border-stone-300 transition-colors">
        <CardContent className="p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
              Avg Roundtrip Latency
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky-200/80 bg-sky-50 text-sky-700 shadow-2xs shrink-0">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums leading-none">
                {avgLatency !== null ? `${avgLatency}ms` : "—"}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border leading-none shrink-0",
                  avgLatency !== null
                    ? "bg-sky-50 text-sky-700 border-sky-200"
                    : "bg-stone-100 text-stone-600 border-stone-200"
                )}
              >
                {avgLatency !== null ? "Sub-second" : "Untested"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onTestAll}
              disabled={isTestingAll || connectedCount === 0}
              className="h-7 px-2.5 text-[11px] border-stone-200 text-stone-700 hover:bg-stone-50 font-medium gap-1 shadow-2xs"
            >
              <RefreshCw className={`h-3 w-3 text-stone-500 ${isTestingAll ? "animate-spin" : ""}`} />
              {isTestingAll ? "Testing..." : "Test All"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-stone-500 font-normal truncate">
            {avgLatency !== null ? "Fastest provider handshake" : "Run diagnostics after connecting"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
