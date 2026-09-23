"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Globe, Database, Check, Copy, RefreshCw, Activity, Terminal } from "lucide-react";
import { useWorkspace } from "@/lib/context/workspace-context";
import { propertiesService } from "@/features/properties";

export default function IntegrationsPage() {
  const { currentWorkspace } = useWorkspace();
  const [copied, setCopied] = React.useState(false);

  // Property Adapter Live State
  const [adapterHealth, setAdapterHealth] = React.useState<any>(null);
  const [isLoadingHealth, setIsLoadingHealth] = React.useState(false);
  const [activeProvider, setActiveProvider] = React.useState<"spacia_native" | "mock_pms">("spacia_native");
  const [probeResult, setProbeResult] = React.useState<any>(null);
  const [isProbing, setIsProbing] = React.useState(false);

  const fetchHealth = React.useCallback(async (providerId?: string) => {
    setIsLoadingHealth(true);
    try {
      const data = await propertiesService.checkHealth(providerId);
      setAdapterHealth(data);
    } catch (err: any) {
      setAdapterHealth({ status: "error", message: err.message });
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHealth(activeProvider === "mock_pms" ? "mock_pms" : undefined);
  }, [fetchHealth, activeProvider]);

  const runLiveProbe = async () => {
    setIsProbing(true);
    try {
      const providerId = activeProvider === "mock_pms" ? "mock_pms" : undefined;
      const [health, search] = await Promise.all([
        propertiesService.checkHealth(providerId),
        propertiesService.getProperties(),
      ]);
      setProbeResult({
        timestamp: new Date().toLocaleTimeString(),
        provider: health.providerName || activeProvider,
        status: health.status,
        latencyMs: health.latencyMs,
        capabilities: health.capabilities,
        totalInventoryCount: search.total,
        propertiesSample: search.properties?.slice(0, 2),
      });
    } catch (err: any) {
      setProbeResult({ error: err.message, timestamp: new Date().toLocaleTimeString() });
    } finally {
      setIsProbing(false);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText("https://api.spacia.ai/v1/inbound/wh_sec_91k2f09ak21");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container size="lg" className="space-y-6">
      <PageHeader
        title="Integrations"
        description={`Connected calendars, webhooks, and property data sources for ${currentWorkspace?.name || "your workspace"}.`}
        actions={
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs font-medium">
            3 Active Connections
          </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Calendar Integration */}
        <Card className="border-stone-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-[#0d4a36]">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-stone-900">Google Calendar</CardTitle>
                  <CardDescription className="text-xs text-stone-500">Autonomous viewing booking</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-[10px]">
                Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-stone-500">
              Synced with broker team schedules. 45-min slots with 30-min buffer times between on-site viewings.
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-400 text-[11px]">
              <span>Last sync: 2 mins ago</span>
              <span className="text-emerald-700 font-medium">Real-time</span>
            </div>
          </CardContent>
        </Card>

        {/* Website Lead Capture */}
        <Card className="border-stone-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 text-stone-700">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-stone-900">Website Lead Inbound</CardTitle>
                  <CardDescription className="text-xs text-stone-500">Inquiry form webhook</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-[10px]">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-stone-500">
              Receives instant lead payloads from property portal and agency website contact forms.
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-stone-500 truncate max-w-[140px]">
                wh_sec_91k2f...
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyWebhook}
                className="h-7 px-2 text-[11px] text-stone-600 gap-1"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Property Adapter Layer (Day 7 Live) */}
        <Card className="border-stone-200 shadow-sm relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-[#0d4a36]">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-stone-900">Property Adapter Layer</CardTitle>
                  <CardDescription className="text-xs text-stone-500">
                    {adapterHealth?.providerName || "Inventory Truth Layer"}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] flex items-center gap-1 ${
                  adapterHealth?.status === "healthy"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-amber-700 bg-amber-50 border-amber-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {adapterHealth?.status === "healthy" ? "Healthy" : "Connecting"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-stone-500">
              Normalized real-time adapter for property search, availability checks, and pricing calculations.
            </p>

            {/* Provider Switcher Pill */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-50 rounded-lg border border-stone-100">
              <button
                type="button"
                onClick={() => setActiveProvider("spacia_native")}
                className={`flex-1 py-1 px-2 rounded text-[11px] font-medium transition-colors ${
                  activeProvider === "spacia_native"
                    ? "bg-white text-stone-900 shadow-xs border border-stone-200"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Native DB
              </button>
              <button
                type="button"
                onClick={() => setActiveProvider("mock_pms")}
                className={`flex-1 py-1 px-2 rounded text-[11px] font-medium transition-colors ${
                  activeProvider === "mock_pms"
                    ? "bg-white text-stone-900 shadow-xs border border-stone-200"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Mock PMS
              </button>
            </div>

            {/* Live Metrics Row */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-500 text-[11px]">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-emerald-600" />
                Latency: <strong className="text-stone-800">{adapterHealth?.latencyMs ?? 12}ms</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={runLiveProbe}
                disabled={isProbing}
                className="h-6 px-2 text-[10px] text-emerald-700 hover:bg-emerald-50 gap-1 font-medium"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${isProbing ? "animate-spin" : ""}`} />
                {isProbing ? "Probing..." : "Test Adapter"}
              </Button>
            </div>

            {/* Live Test Probe Output Console */}
            {probeResult && (
              <div className="mt-2 p-2.5 bg-stone-900 text-stone-100 rounded-md font-mono text-[10px] space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between text-stone-400 border-b border-stone-800 pb-1">
                  <span className="flex items-center gap-1">
                    <Terminal className="h-3 w-3 text-emerald-400" /> Live Adapter Response
                  </span>
                  <span>{probeResult.timestamp}</span>
                </div>
                <div className="pt-1 space-y-0.5">
                  <div>Provider: <span className="text-emerald-400">{probeResult.provider}</span></div>
                  <div>Status: <span className="text-emerald-400">● {probeResult.status}</span> ({probeResult.latencyMs}ms)</div>
                  <div>Inventory Count: <span className="text-sky-300">{probeResult.totalInventoryCount} items</span></div>
                  <div>Capabilities: Search: ✓ | Availability: ✓ | Pricing: ✓</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
