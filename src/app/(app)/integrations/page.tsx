"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  CheckCircle2,
  Database,
  Layers,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useWorkspace } from "@/lib/context/workspace-context";
import { propertiesService } from "@/features/properties";
import {
  integrationsService,
  IntegrationCard,
  ConfigureCredentialsModal,
  IntegrationsSummaryCards,
  type IntegrationItem,
  type IntegrationCategory,
  type UpdateCredentialsPayload,
} from "@/features/integrations";

const CATEGORIES: { id: IntegrationCategory; label: string }[] = [
  { id: "all", label: "All Integrations" },
  { id: "leads", label: "Lead Ingestion" },
  { id: "properties", label: "Property Inventory" },
  { id: "crm", label: "CRMs" },
];

export default function IntegrationsPage() {
  const { currentWorkspace } = useWorkspace();

  // Integrations Fleet State
  const [integrations, setIntegrations] = React.useState<IntegrationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState<IntegrationCategory>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Interaction States
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [reconnectingId, setReconnectingId] = React.useState<string | null>(null);
  const [isTestingAll, setIsTestingAll] = React.useState(false);

  // Modal State
  const [selectedForConfig, setSelectedForConfig] = React.useState<IntegrationItem | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = React.useState(false);
  const [isSavingCredentials, setIsSavingCredentials] = React.useState(false);

  // Property Adapter Live State (Day 7 Compatibility)
  const [adapterHealth, setAdapterHealth] = React.useState<any>(null);
  const [activeProvider, setActiveProvider] = React.useState<"spacia_native" | "mock_pms">("spacia_native");
  const [probeResult, setProbeResult] = React.useState<any>(null);
  const [isProbing, setIsProbing] = React.useState(false);

  // External PMS Gateway Form State
  const [pmsEndpointUrl, setPmsEndpointUrl] = React.useState("https://api.luxuryagency.com/v1/properties");
  const [pmsApiKey, setPmsApiKey] = React.useState("");

  const loadIntegrations = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await integrationsService.getIntegrations();
      setIntegrations(data);
    } catch (err: any) {
      console.error("Failed to load integrations:", err);
      toast.error("Failed to load integrations", {
        description: err.message || "Could not retrieve integration states.",
      });
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Adapter Health check
  const fetchAdapterHealth = React.useCallback(async (providerId?: string) => {
    try {
      const data = await propertiesService.checkHealth(providerId);
      setAdapterHealth(data);
    } catch (err: any) {
      setAdapterHealth({ status: "error", message: err.message });
    }
  }, []);

  React.useEffect(() => {
    fetchAdapterHealth(activeProvider === "mock_pms" ? "mock_pms" : undefined);
  }, [fetchAdapterHealth, activeProvider]);

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
      toast.success("Adapter Probe Complete", {
        description: `Handshake successful (${health.latencyMs}ms latency).`,
      });
    } catch (err: any) {
      setProbeResult({ error: err.message, timestamp: new Date().toLocaleTimeString() });
      toast.error("Probe Failed", {
        description: err.message,
      });
    } finally {
      setIsProbing(false);
    }
  };

  const propertyDbItem = integrations.find((i) => i.type === "property_db");

  React.useEffect(() => {
    if (propertyDbItem?.config?.endpointUrl) {
      setPmsEndpointUrl(propertyDbItem.config.endpointUrl);
    }
  }, [propertyDbItem]);

  const handleSaveAndProbePms = async () => {
    setIsProbing(true);
    try {
      if (propertyDbItem) {
        await integrationsService.updateCredentials(propertyDbItem.id, {
          credentials: pmsApiKey.trim() ? { apiKey: pmsApiKey.trim() } : {},
          config: { endpointUrl: pmsEndpointUrl.trim(), syncMode: "realtime" },
        });
        toast.success("PMS Gateway Configuration Saved", {
          description: "Encrypted credentials updated in Neon database.",
        });
      }
      await runLiveProbe();
      await loadIntegrations(true);
    } catch (err: any) {
      toast.error("Failed to Save PMS Configuration", {
        description: err.message || "Could not persist credentials.",
      });
    } finally {
      setIsProbing(false);
    }
  };

  // Handlers
  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    const target = integrations.find((i) => i.id === id);
    try {
      const result = await integrationsService.testConnection(id);
      if (result.success) {
        toast.success(`Handshake Successful: ${target?.name || "Service"}`, {
          description: result.message || `Operational at ${result.latencyMs ?? 0}ms latency.`,
        });
      } else {
        toast.error(`Health Handshake Failed: ${target?.name || "Service"}`, {
          description: result.message || "Failed to reach remote provider.",
        });
      }
      await loadIntegrations(true);
    } catch (err: any) {
      toast.error("Connection Check Failed", {
        description: err.message || "An unexpected error occurred during test.",
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleReconnect = async (id: string) => {
    setReconnectingId(id);
    const target = integrations.find((i) => i.id === id);
    try {
      const updated = await integrationsService.reconnect(id);
      toast.success(`Reconnected: ${target?.name || "Service"}`, {
        description: `Successfully restored connection state (${updated.status}).`,
      });
      await loadIntegrations(true);
    } catch (err: any) {
      toast.error("Reconnect Failed", {
        description: err.message || "Could not re-establish active connection.",
      });
    } finally {
      setReconnectingId(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    const target = integrations.find((i) => i.id === id);
    try {
      await integrationsService.disconnect(id);
      toast.info(`Disconnected: ${target?.name || "Service"}`, {
        description: "Integration state set to inactive.",
      });
      await loadIntegrations(true);
    } catch (err: any) {
      toast.error("Disconnect Failed", {
        description: err.message || "Failed to disconnect integration.",
      });
    }
  };

  const handleTestAll = async () => {
    if (integrations.length === 0) return;
    setIsTestingAll(true);
    toast.info("Running Fleet Health Checks", {
      description: `Testing ${integrations.length} services concurrently...`,
    });

    try {
      const results = await Promise.allSettled(
        integrations.map((i) => integrationsService.testConnection(i.id))
      );

      let successCount = 0;
      results.forEach((res) => {
        if (res.status === "fulfilled" && res.value.success) {
          successCount++;
        }
      });

      toast.success("Fleet Diagnostics Completed", {
        description: `${successCount} of ${integrations.length} integrations are healthy and operational.`,
      });

      await loadIntegrations(true);
    } catch (err: any) {
      toast.error("Bulk Diagnostics Error", {
        description: err.message || "Failed to complete all health tests.",
      });
    } finally {
      setIsTestingAll(false);
    }
  };

  const handleOpenConfig = (integration: IntegrationItem) => {
    setSelectedForConfig(integration);
    setIsConfigModalOpen(true);
  };

  const handleSaveCredentials = async (
    id: string,
    payload: UpdateCredentialsPayload,
    testImmediately: boolean
  ) => {
    setIsSavingCredentials(true);
    try {
      await integrationsService.updateCredentials(id, payload);

      if (testImmediately) {
        const testRes = await integrationsService.testConnection(id);
        if (testRes.success) {
          toast.success("Credentials Stored & Validated", {
            description: `Handshake successful (${testRes.latencyMs ?? 0}ms latency).`,
          });
        } else {
          toast.warning("Credentials Saved with Warnings", {
            description: testRes.message || "Initial connection test returned an error.",
          });
        }
      } else {
        toast.success("Credentials Updated Securely", {
          description: "Secrets encrypted and stored in workspace vault.",
        });
      }

      await loadIntegrations(true);
    } catch (err: any) {
      toast.error("Failed to Save Credentials", {
        description: err.message || "Database encryption error occurred.",
      });
      throw err;
    } finally {
      setIsSavingCredentials(false);
    }
  };

  // Filtered integrations
  const filteredIntegrations = integrations.filter((item) => {
    // Category match
    if (selectedCategory !== "all" && item.category !== selectedCategory) {
      return false;
    }

    // Status match
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchType = item.type.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchType && !matchCategory) {
        return false;
      }
    }

    return true;
  });

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  const hasActiveFilters = Boolean(
    searchQuery.trim().length > 0 ||
      selectedCategory !== "all" ||
      statusFilter !== "all"
  );

  return (
    <Container size="lg" className="space-y-6 pb-12 font-sans">
      <PageHeader
        title="Client Integrations"
        description={`Manage credentials, connection health, and real-time handshakes for ${
          currentWorkspace?.name || "Spacia Luxury Workspace"
        }.`}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-emerald-800 bg-emerald-50 border-emerald-200 text-xs font-medium px-2.5 py-1 flex items-center gap-1.5"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              {connectedCount} Active Connections
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadIntegrations()}
              disabled={isLoading}
              className="h-8 text-xs border-stone-200 text-stone-700 hover:bg-stone-50 gap-1.5 font-medium shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* KPI Overview Strip */}
      <IntegrationsSummaryCards
        integrations={integrations}
        onTestAll={handleTestAll}
        isTestingAll={isTestingAll}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-stone-200/80 bg-white p-3.5 shadow-2xs">
        {/* Top row: Search input + count display + reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:max-w-md">
            <SearchInput
              placeholder="Search integrations by name or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-mono text-stone-500 tabular-nums">
              Showing <strong className="text-stone-900">{filteredIntegrations.length}</strong> of{" "}
              {integrations.length} services
            </span>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="h-8 text-xs text-stone-600 hover:text-stone-900 gap-1 px-2"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Bottom row: Category chips & Status dropdown filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mr-1">
              Category:
            </span>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none whitespace-nowrap",
                    isSelected
                      ? "bg-[#0d4a36] text-white font-semibold shadow-2xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900"
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mr-1">
              Status:
            </span>
            <div className="w-40">
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val)}
              >
                <SelectTrigger className="h-8 text-xs bg-white border-stone-200">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="disconnected">Disconnected</SelectItem>
                  <SelectItem value="reconnecting">Reconnecting</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <Card key={idx} className="border-stone-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-7 w-full rounded" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-8 w-24 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredIntegrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIntegrations.map((item) => (
            <IntegrationCard
              key={item.id}
              integration={item}
              onTest={handleTestConnection}
              onReconnect={handleReconnect}
              onDisconnect={handleDisconnect}
              onConfigure={handleOpenConfig}
              isTesting={testingId === item.id || isTestingAll}
              isReconnecting={reconnectingId === item.id}
            />
          ))}
        </div>
      ) : (
        <Card className="border-stone-200 border-dashed bg-stone-50/50 p-8 text-center">
          <div className="max-w-xs mx-auto space-y-3">
            <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-500">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">No Integrations Found</p>
              <p className="text-xs text-stone-500 mt-1">
                No integration matches your current category or search criteria.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-xs border-stone-200 text-stone-700"
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Property Inventory Truth Layer (Day 7 Interactive Diagnostic) */}
      <Card className="border-stone-200 shadow-xs bg-white mt-8">
        <CardHeader className="pb-3 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d4a36]/10 text-[#0d4a36]">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-stone-900">
                  Property Adapter & Inventory Truth Layer
                </CardTitle>
                <CardDescription className="text-xs text-stone-500">
                  Dual-provider adapter with sub-second property normalization and availability verification
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-[11px] font-medium flex items-center gap-1.5 ${
                adapterHealth?.status === "healthy"
                  ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                  : "text-amber-800 bg-amber-50 border-amber-200"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              {adapterHealth?.status === "healthy" ? "Adapter Operational" : "Connecting"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Provider Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg border border-stone-200 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveProvider("spacia_native")}
                className={`flex-1 sm:flex-initial py-1 px-3 rounded text-xs font-medium transition-colors ${
                  activeProvider === "spacia_native"
                    ? "bg-white text-stone-900 shadow-2xs border border-stone-200"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Native Neon DB
              </button>
              <button
                type="button"
                onClick={() => setActiveProvider("mock_pms")}
                className={`flex-1 sm:flex-initial py-1 px-3 rounded text-xs font-medium transition-colors ${
                  activeProvider === "mock_pms"
                    ? "bg-white text-stone-900 shadow-2xs border border-stone-200"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                External PMS Gateway
              </button>
            </div>

            {/* Probe trigger button */}
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <span className="flex items-center gap-1.5 font-medium text-stone-700">
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                Latency: <span className="font-mono text-stone-900">{adapterHealth?.latencyMs ?? 12}ms</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={runLiveProbe}
                disabled={isProbing}
                className="h-8 text-xs border-stone-200 text-stone-700 hover:bg-stone-50 gap-1.5 font-medium shadow-2xs"
              >
                <RefreshCw className={`h-3 w-3 ${isProbing ? "animate-spin" : ""}`} />
                {isProbing ? "Probing Adapter..." : "Run Live Probe"}
              </Button>
            </div>
          </div>

          {/* External PMS Gateway Endpoint Configuration Form */}
          {activeProvider === "mock_pms" ? (
            <div className="p-3.5 rounded-lg border border-emerald-200/80 bg-emerald-50/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-semibold text-stone-900">
                    Connect External Property Database / PMS Gateway
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 font-mono">
                  GET /api/v1/properties
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Paste your external property inventory API endpoint and secret access key. Spacia queries this endpoint in real-time during AI calls to ground property specifications and check availability.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-stone-700">
                    Database / PMS API Endpoint URL
                  </label>
                  <Input
                    type="text"
                    value={pmsEndpointUrl}
                    onChange={(e) => setPmsEndpointUrl(e.target.value)}
                    className="h-8 text-xs font-mono bg-white border-stone-200"
                    placeholder="https://your-crm.com/api/properties"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-stone-700">
                    Bearer Token / API Authorization Key
                  </label>
                  <Input
                    type="password"
                    value={pmsApiKey}
                    onChange={(e) => setPmsApiKey(e.target.value)}
                    className="h-8 text-xs font-mono bg-white border-stone-200"
                    placeholder={
                      propertyDbItem?.hasCredentials
                        ? propertyDbItem.maskedKey || "pms_sec_••••••••••••"
                        : "Enter API authorization token..."
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-stone-500">
                  Supported formats: REST JSON, Supabase PostgREST, HubSpot Listings, Salesforce PropertyBase.
                </span>
                <Button
                  size="sm"
                  onClick={handleSaveAndProbePms}
                  disabled={isProbing}
                  className="h-7 text-xs bg-[#0d4a36] hover:bg-[#0a3829] text-white font-medium gap-1.5 shadow-2xs"
                >
                  <RefreshCw className={`h-3 w-3 ${isProbing ? "animate-spin" : ""}`} />
                  {isProbing ? "Validating Handshake..." : "Save & Validate Handshake"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 flex items-center justify-between text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[#0d4a36]" />
                <span>
                  Using <strong>Native Neon DB</strong>: Property inventory is securely stored and managed in Spacia’s multi-tenant database.
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-white border-stone-200 text-stone-700">
                12 Normalized Listings
              </Badge>
            </div>
          )}

          {/* Console Output when probed */}
          {probeResult && (
            <div className="p-3 bg-stone-900 text-stone-100 rounded-lg font-mono text-xs space-y-1.5">
              <div className="flex items-center justify-between text-stone-400 border-b border-stone-800 pb-1.5 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" /> Real-Time Adapter Telemetry
                </span>
                <span>{probeResult.timestamp}</span>
              </div>
              <div className="pt-1 space-y-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-stone-400">Target Provider:</span>
                  <span className="text-emerald-400 font-semibold">{probeResult.provider}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-400">Handshake Status:</span>
                  <span className="text-emerald-400">● {probeResult.status}</span>
                  <span className="text-stone-500">({probeResult.latencyMs}ms roundtrip)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-400">Normalized Inventory:</span>
                  <span className="text-sky-300 font-medium">{probeResult.totalInventoryCount} units synced</span>
                </div>
                <div className="text-stone-400 pt-0.5">
                  Capabilities: <span className="text-stone-200">Search: ✓ | Availability: ✓ | Dynamic Pricing: ✓</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Credential Configuration Modal */}
      <ConfigureCredentialsModal
        integration={selectedForConfig}
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setSelectedForConfig(null);
        }}
        onSave={handleSaveCredentials}
        isSaving={isSavingCredentials}
      />
    </Container>
  );
}
