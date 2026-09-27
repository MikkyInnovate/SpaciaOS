"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Loader2,
  Pause,
  PhoneCall,
  Play,
  Plug,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { EmptyState } from "@/components/shared/empty-state";
import { useWorkspace } from "@/lib/context/workspace-context";
import {
  opsService,
  type OpsOverview,
  type OpsWorkspaceItem,
  type OpsLeadItem,
  type OpsWorkflowItem,
  type OpsCallItem,
  type OpsAppointmentItem,
  type OpsErrorItem,
  type OpsIntegrationItem,
  type OpsAuditItem,
} from "@/features/ops";

type OpsTab =
  | "workflows"
  | "errors"
  | "integrations"
  | "workspaces"
  | "leads"
  | "calls"
  | "appointments"
  | "audit";

export default function OpsCommandPage() {
  const { currentWorkspace } = useWorkspace();

  // State
  const [activeTab, setActiveTab] = React.useState<OpsTab>("workflows");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Telemetry data
  const [overview, setOverview] = React.useState<OpsOverview | null>(null);
  const [workspaces, setWorkspaces] = React.useState<OpsWorkspaceItem[]>([]);
  const [leads, setLeads] = React.useState<OpsLeadItem[]>([]);
  const [workflows, setWorkflows] = React.useState<OpsWorkflowItem[]>([]);
  const [calls, setCalls] = React.useState<OpsCallItem[]>([]);
  const [appointments, setAppointments] = React.useState<OpsAppointmentItem[]>([]);
  const [errors, setErrors] = React.useState<OpsErrorItem[]>([]);
  const [integrations, setIntegrations] = React.useState<OpsIntegrationItem[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<OpsAuditItem[]>([]);

  // Filters & Search
  const [workflowStatusFilter, setWorkflowStatusFilter] = React.useState("all");
  const [errorSeverityFilter, setErrorSeverityFilter] = React.useState("all");
  const [auditSeverityFilter, setAuditSeverityFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Action states
  const [retryingWorkflowId, setRetryingWorkflowId] = React.useState<string | null>(null);
  const [reconnectingIntegrationId, setReconnectingIntegrationId] = React.useState<string | null>(null);
  const [isTogglingAi, setIsTogglingAi] = React.useState(false);

  // Inspector Dialog State
  const [inspectedPayload, setInspectedPayload] = React.useState<{
    title: string;
    data: any;
  } | null>(null);

  // Load All Data
  const loadAllData = React.useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      else setIsLoading(true);

      const [
        overviewData,
        workspacesData,
        leadsData,
        workflowsData,
        callsData,
        appointmentsData,
        errorsData,
        integrationsData,
        auditLogsData,
      ] = await Promise.all([
        opsService.getOverview(),
        opsService.getWorkspaces(),
        opsService.getLeads(50),
        opsService.getWorkflows(50),
        opsService.getCalls(50),
        opsService.getAppointments(50),
        opsService.getErrors(50),
        opsService.getIntegrations(),
        opsService.getAuditLogs(50),
      ]);

      setOverview(overviewData);
      setWorkspaces(workspacesData);
      setLeads(leadsData);
      setWorkflows(workflowsData);
      setCalls(callsData);
      setAppointments(appointmentsData);
      setErrors(errorsData);
      setIntegrations(integrationsData);
      setAuditLogs(auditLogsData);

      if (showToast) {
        toast.success("Operational telemetry refreshed", {
          description: "Live state synchronized across all subsystems.",
        });
      }
    } catch (err: any) {
      console.error("[OpsCommand] Failed to load operational data:", err);
      toast.error("Failed to load telemetry", {
        description: err?.message || "Check backend connection.",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Operational Action 1: Retry Workflow
  const handleRetryWorkflow = async (workflowId: string, eventName: string) => {
    try {
      setRetryingWorkflowId(workflowId);
      const res = await opsService.retryWorkflow(workflowId);
      if (res.success) {
        toast.success(`Workflow re-queued`, {
          description: `Event '${eventName}' is now processing.`,
        });
        // Optimistically update status
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflowId ? { ...w, status: "processing" } : w))
        );
        // Refresh overview and errors in background
        opsService.getOverview().then(setOverview);
        opsService.getErrors(50).then(setErrors);
      }
    } catch (err: any) {
      toast.error("Retry failed", {
        description: err?.message || "Could not re-queue workflow event.",
      });
    } finally {
      setRetryingWorkflowId(null);
    }
  };

  // Operational Action 2: Reconnect Integration
  const handleReconnectIntegration = async (integrationId: string, name: string) => {
    try {
      setReconnectingIntegrationId(integrationId);
      const res = await opsService.reconnectIntegration(integrationId);
      if (res.success) {
        toast.success(`Integration reconnected`, {
          description: `'${name}' connection verified and healthy.`,
        });
        // Reload integrations list
        const updated = await opsService.getIntegrations();
        setIntegrations(updated);
        opsService.getOverview().then(setOverview);
      }
    } catch (err: any) {
      toast.error("Reconnect failed", {
        description: err?.message || "Could not reconnect integration connector.",
      });
    } finally {
      setReconnectingIntegrationId(null);
    }
  };

  // Operational Action 3: Toggle Outbound AI Dialer
  const handleToggleAiDialer = async () => {
    if (!overview) return;
    try {
      setIsTogglingAi(true);
      if (overview.aiDialerPaused) {
        const res = await opsService.resumeAiDialer();
        if (res.success) {
          setOverview((prev) => prev ? { ...prev, aiDialerPaused: false } : prev);
          toast.success("AI outbound voice dialer resumed", {
            description: "Agents will now dispatch outbound qualification calls.",
          });
        }
      } else {
        const res = await opsService.pauseAiDialer();
        if (res.success) {
          setOverview((prev) => prev ? { ...prev, aiDialerPaused: true } : prev);
          toast.warning("AI outbound voice dialer paused", {
            description: "Outbound calling temporarily suspended by operator.",
          });
        }
      }
      opsService.getAuditLogs(50).then(setAuditLogs);
    } catch (err: any) {
      toast.error("Failed to toggle AI dialer", {
        description: err?.message || "Operational action rejected.",
      });
    } finally {
      setIsTogglingAi(false);
    }
  };

  // Filtered lists
  const filteredWorkflows = React.useMemo(() => {
    return workflows.filter((w) => {
      const matchesStatus =
        workflowStatusFilter === "all" || w.status === workflowStatusFilter;
      const matchesSearch =
        !searchQuery ||
        w.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.aggregateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.workspaceId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [workflows, workflowStatusFilter, searchQuery]);

  const filteredErrors = React.useMemo(() => {
    return errors.filter((e) => {
      const matchesSeverity =
        errorSeverityFilter === "all" || e.severity === errorSeverityFilter;
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSeverity && matchesSearch;
    });
  }, [errors, errorSeverityFilter, searchQuery]);

  const filteredAuditLogs = React.useMemo(() => {
    return auditLogs.filter((a) => {
      const matchesSeverity =
        auditSeverityFilter === "all" || a.severity === auditSeverityFilter;
      const matchesSearch =
        !searchQuery ||
        a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.actorId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSeverity && matchesSearch;
    });
  }, [auditLogs, auditSeverityFilter, searchQuery]);

  return (
    <Container className="py-6 space-y-6">
      {/* 1. Header with Operational Status & Action Controls */}
      <PageHeader
        title="Operations Command"
        description="Internal telemetry, background queue observability, error diagnostics, and fleet controls."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* System Status Pill */}
            <div
              className={cn(
                "flex items-center gap-2 h-9 px-3 rounded-lg border text-xs font-semibold shadow-2xs transition-colors",
                overview?.systemStatus === "operational"
                  ? "bg-stone-50 border-stone-200/90 text-stone-800"
                  : overview?.systemStatus === "degraded"
                  ? "bg-amber-50/70 border-amber-200/90 text-amber-900"
                  : "bg-rose-50/70 border-rose-200/90 text-rose-900"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  overview?.systemStatus === "operational"
                    ? "bg-emerald-600 animate-pulse"
                    : overview?.systemStatus === "degraded"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-rose-600 animate-ping"
                )}
              />
              <span className="font-mono uppercase tracking-wider text-[11px]">
                {overview?.systemStatus === "operational"
                  ? "Fleet: Healthy"
                  : overview?.systemStatus === "degraded"
                  ? "Fleet: Degraded"
                  : "Fleet: Critical"}
              </span>
            </div>

            {/* AI Dialer Emergency Control */}
            <Button
              variant={overview?.aiDialerPaused ? "outline" : "default"}
              size="sm"
              disabled={isTogglingAi}
              onClick={handleToggleAiDialer}
              className={cn(
                "h-9 px-3.5 text-xs font-medium gap-1.5 transition-all",
                overview?.aiDialerPaused
                  ? "border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100/80"
                  : "bg-stone-900 text-white hover:bg-stone-800"
              )}
            >
              {isTogglingAi ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : overview?.aiDialerPaused ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Resume AI Dialer</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span>Pause AI Dialer</span>
                </>
              )}
            </Button>

            {/* Refresh Telemetry */}
            <Button
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={() => loadAllData(true)}
              className="h-9 px-3 border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5 mr-1.5 text-stone-500", isRefreshing && "animate-spin")}
              />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* 2. Top Metric Cards Strip (Ops Pulse) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Workspaces */}
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-medium">Active Tenants</span>
              <Building2 className="h-4 w-4 text-stone-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-stone-900">
                {overview?.totalWorkspaces ?? 0}
              </span>
              <span className="text-[11px] font-medium text-stone-500">Workspaces</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Workflows */}
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-medium">Background Queues</span>
              <Layers className="h-4 w-4 text-stone-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-stone-900">
                {overview?.activeWorkflows ?? 0}
              </span>
              <span className="text-[11px] font-medium text-stone-500">Processing</span>
              {(overview?.failedWorkflows ?? 0) > 0 && (
                <Badge
                  variant="outline"
                  className="ml-auto bg-rose-50 border-rose-200 text-rose-700 font-mono text-[10px] px-1.5 py-0"
                >
                  {overview?.failedWorkflows} Failed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Errors */}
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-medium">System Errors</span>
              <AlertTriangle className="h-4 w-4 text-stone-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-2xl font-bold font-mono",
                  (overview?.totalErrors ?? 0) > 0 ? "text-rose-600" : "text-stone-900"
                )}
              >
                {overview?.totalErrors ?? 0}
              </span>
              <span className="text-[11px] font-medium text-stone-500">Active Issues</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Integrations */}
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-medium">Integration Fleet</span>
              <Plug className="h-4 w-4 text-stone-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-stone-900">
                {overview?.integrationsHealth?.healthy ?? 0} /{" "}
                {overview?.integrationsHealth?.total ?? 0}
              </span>
              <span className="text-[11px] font-medium text-emerald-700">Healthy</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Pipeline Activity */}
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-medium">Platform Activity</span>
              <Activity className="h-4 w-4 text-stone-400" />
            </div>
            <div className="flex items-baseline gap-1.5 text-xs text-stone-600 font-mono">
              <span className="font-bold text-stone-900">{overview?.totalLeads ?? 0}</span>L ·{" "}
              <span className="font-bold text-stone-900">{overview?.totalCalls ?? 0}</span>C ·{" "}
              <span className="font-bold text-stone-900">{overview?.totalAppointments ?? 0}</span>A
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Navigation Tabs Bar */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-px gap-4 flex-wrap">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-none py-1">
          {[
            {
              id: "workflows" as OpsTab,
              label: "Workflows & Queues",
              count: workflows.length,
              badgeVariant: workflows.some((w) => w.status === "failed") ? "rose" : "stone",
            },
            {
              id: "errors" as OpsTab,
              label: "Errors & Failures",
              count: errors.length,
              badgeVariant: errors.length > 0 ? "rose" : "stone",
            },
            {
              id: "integrations" as OpsTab,
              label: "Integration Fleet",
              count: integrations.length,
              badgeVariant: integrations.some((i) => i.healthStatus !== "healthy") ? "amber" : "stone",
            },
            { id: "workspaces" as OpsTab, label: "Workspaces", count: workspaces.length },
            { id: "leads" as OpsTab, label: "Leads Intake", count: leads.length },
            { id: "calls" as OpsTab, label: "Telephony Calls", count: calls.length },
            { id: "appointments" as OpsTab, label: "Appointments", count: appointments.length },
            { id: "audit" as OpsTab, label: "Audit Activity", count: auditLogs.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all",
                  isActive
                    ? "bg-stone-900 text-white shadow-2xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full font-mono text-[10px]",
                      isActive
                        ? "bg-stone-800 text-stone-200"
                        : tab.badgeVariant === "rose"
                        ? "bg-rose-100 text-rose-800"
                        : tab.badgeVariant === "amber"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-stone-100 text-stone-600"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Global Search Bar */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="h-8 pl-8 text-xs border-stone-200 bg-white"
          />
        </div>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: Workflows & Queues */}
      {activeTab === "workflows" && (
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-stone-900">
                Background Queue Workflows
              </CardTitle>
              <CardDescription className="text-xs text-stone-500">
                System events emitted and executed across BullMQ asynchronous pipelines.
              </CardDescription>
            </div>
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              {["all", "failed", "processing", "emitted", "completed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setWorkflowStatusFilter(st)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-colors",
                    workflowStatusFilter === st
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredWorkflows.length === 0 ? (
              <EmptyState
                preset="no-workflows"
                title={workflowStatusFilter !== "all" ? "No Matching Workflows" : "No Active Workflows"}
                description={
                  workflowStatusFilter !== "all"
                    ? `No workflows discovered with status '${workflowStatusFilter}'. Adjust your filter to view all events.`
                    : "Background execution queues are idle. Inbound lead events and telephony webhooks will stream here."
                }
                size="compact"
                className="border-0 rounded-none bg-transparent py-10"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-stone-50/70">
                    <TableRow className="border-stone-200">
                      <TableHead className="text-xs font-semibold text-stone-700">Timestamp</TableHead>
                      <TableHead className="text-xs font-semibold text-stone-700">Event Name</TableHead>
                      <TableHead className="text-xs font-semibold text-stone-700">Aggregate</TableHead>
                      <TableHead className="text-xs font-semibold text-stone-700">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-stone-700">Details</TableHead>
                      <TableHead className="text-xs font-semibold text-stone-700 text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkflows.map((w) => (
                      <TableRow key={w.id} className="border-stone-100 hover:bg-stone-50/50">
                        <TableCell className="text-xs font-mono text-stone-500">
                          {new Date(w.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-stone-900">
                          {w.eventName}
                        </TableCell>
                        <TableCell className="text-xs text-stone-600">
                          <span className="font-mono text-stone-500">{w.aggregateType}:</span>
                          <span className="font-mono ml-1">{w.aggregateId.slice(0, 16)}...</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono capitalize px-2 py-0.5",
                              w.status === "completed"
                                ? "bg-stone-100 text-stone-700 border-stone-200"
                                : w.status === "processing"
                                ? "bg-sky-50 text-sky-800 border-sky-200"
                                : w.status === "failed"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-stone-50 text-stone-600 border-stone-200"
                            )}
                          >
                            {w.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {w.lastError ? (
                            <span className="text-rose-700 font-mono text-[11px] truncate max-w-xs block">
                              {w.lastError}
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                setInspectedPayload({
                                  title: `Workflow: ${w.eventName}`,
                                  data: w.payload,
                                })
                              }
                              className="text-stone-600 hover:text-stone-900 underline text-xs"
                            >
                              Inspect Payload
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {w.status === "failed" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={retryingWorkflowId === w.id}
                              onClick={() => handleRetryWorkflow(w.id, w.eventName)}
                              className="h-7 px-2.5 text-xs text-rose-700 border-rose-200 hover:bg-rose-50 gap-1"
                            >
                              {retryingWorkflowId === w.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                              <span>Retry</span>
                            </Button>
                          ) : (
                            <span className="text-[11px] text-stone-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Errors & Failures */}
      {activeTab === "errors" && (
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-stone-900">
                Consolidated Error Diagnostics
              </CardTitle>
              <CardDescription className="text-xs text-stone-500">
                Aggregated failure events across workflows, integrations, telephony calls, and audit logs.
              </CardDescription>
            </div>
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              {["all", "critical", "warning", "info"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setErrorSeverityFilter(sev)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-colors",
                    errorSeverityFilter === sev
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {filteredErrors.length === 0 ? (
              <EmptyState
                preset="no-errors"
                title="All Systems Healthy"
                description={
                  errorSeverityFilter !== "all"
                    ? `Zero errors with severity '${errorSeverityFilter}' discovered across subsystems.`
                    : "Zero platform failures, connector disconnects, or dead-letter exceptions discovered across subsystems."
                }
                size="compact"
                className="border-0 rounded-none bg-transparent py-10"
              />
            ) : (
              filteredErrors.map((err) => (
                <div
                  key={err.id}
                  className="p-3.5 rounded-lg border border-stone-200/90 bg-stone-50/50 hover:bg-stone-50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-mono uppercase px-1.5 py-0",
                          err.severity === "critical"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : err.severity === "warning"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-stone-100 text-stone-700 border-stone-200"
                        )}
                      >
                        {err.severity}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono text-stone-600 bg-white border-stone-200"
                      >
                        {err.source}
                      </Badge>
                      <span className="font-semibold text-xs text-stone-900">{err.title}</span>
                      <span className="text-[11px] font-mono text-stone-400">
                        {new Date(err.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 font-mono bg-white p-2 rounded border border-stone-200/80 break-words">
                      {err.message}
                    </p>
                  </div>

                  {err.retryable && err.entityId && (
                    <div className="shrink-0 pt-1">
                      {err.source === "workflow" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={retryingWorkflowId === err.entityId}
                          onClick={() => handleRetryWorkflow(err.entityId!, err.title)}
                          className="h-8 text-xs text-stone-900 border-stone-200 hover:bg-stone-100 gap-1.5"
                        >
                          {retryingWorkflowId === err.entityId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          <span>Retry Workflow</span>
                        </Button>
                      ) : err.source === "integration" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reconnectingIntegrationId === err.entityId}
                          onClick={() => handleReconnectIntegration(err.entityId!, err.title)}
                          className="h-8 text-xs text-stone-900 border-stone-200 hover:bg-stone-100 gap-1.5"
                        >
                          {reconnectingIntegrationId === err.entityId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          <span>Reconnect</span>
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Integration Fleet */}
      {activeTab === "integrations" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((item) => (
              <Card key={item.id} className="border-stone-200/90 bg-white shadow-2xs">
                <CardHeader className="p-4 pb-3 border-b border-stone-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-stone-900">
                      {item.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-stone-500 capitalize">
                      {item.category} · {item.type}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-mono capitalize px-2 py-0.5",
                      item.healthStatus === "healthy"
                        ? "bg-stone-100 text-stone-800 border-stone-200"
                        : item.healthStatus === "degraded"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    )}
                  >
                    {item.healthStatus}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-stone-500">Latency</span>
                      <p className="font-mono font-semibold text-stone-900">
                        {item.latencyMs ? `${item.latencyMs}ms` : "—"}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-stone-500">Failures</span>
                      <p className="font-mono font-semibold text-stone-900">{item.failureCount}</p>
                    </div>
                  </div>

                  {item.lastError && (
                    <div className="p-2 rounded bg-rose-50/70 border border-rose-200/80 text-[11px] font-mono text-rose-800">
                      {item.lastError}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                    <span className="text-[10px] text-stone-400">
                      {item.lastTestedAt
                        ? `Tested ${new Date(item.lastTestedAt).toLocaleTimeString()}`
                        : "Untested"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reconnectingIntegrationId === item.id}
                      onClick={() => handleReconnectIntegration(item.id, item.name)}
                      className="h-7 px-2 text-xs border-stone-200 text-stone-700 hover:bg-stone-50 gap-1"
                    >
                      {reconnectingIntegrationId === item.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      <span>Reconnect</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Workspaces Fleet */}
      {activeTab === "workspaces" && (
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100">
            <CardTitle className="text-sm font-semibold text-stone-900">
              Brokerage Workspace Fleet
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Provisioned tenant organizations, lead capacity, and active members.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-stone-50/70">
                  <TableRow className="border-stone-200">
                    <TableHead className="text-xs font-semibold text-stone-700">Workspace</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Tenant ID</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Tier</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Members</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Leads</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">AI Dialer</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspaces.map((ws) => (
                    <TableRow key={ws.id} className="border-stone-100 hover:bg-stone-50/50">
                      <TableCell className="text-xs font-semibold text-stone-900">
                        {ws.name}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-stone-500">{ws.id}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono capitalize bg-stone-50 text-stone-700 border-stone-200"
                        >
                          {ws.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-stone-700">
                        {ws.memberCount}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-stone-700">
                        {ws.leadCount}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-mono",
                            ws.aiStatus === "active" ? "text-emerald-700" : "text-amber-700"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              ws.aiStatus === "active" ? "bg-emerald-600" : "bg-amber-500"
                            )}
                          />
                          {ws.aiStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-stone-400">
                        {new Date(ws.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: Leads Intake */}
      {activeTab === "leads" && (
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100">
            <CardTitle className="text-sm font-semibold text-stone-900">
              Cross-Tenant Inbound Lead Monitor
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Recent real estate buyer prospects captured across web, telephony, and whatsapp.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-stone-50/70">
                  <TableRow className="border-stone-200">
                    <TableHead className="text-xs font-semibold text-stone-700">Prospect</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Phone</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Score</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Budget</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l.id} className="border-stone-100 hover:bg-stone-50/50">
                      <TableCell className="text-xs font-semibold text-stone-900">
                        {l.fullName}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-stone-600">{l.phone}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono bg-stone-50 text-stone-700 border-stone-200"
                        >
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-stone-900">
                        {l.score ? `${l.score}/100` : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-stone-700">
                        {l.budget ? `₦${l.budget.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-stone-400">
                        {new Date(l.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 6: Calls & Telephony */}
      {activeTab === "calls" && (
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100">
            <CardTitle className="text-sm font-semibold text-stone-900">
              Vapi Telephony Call Telemetry
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Outbound and inbound AI qualification calls, duration, and outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-stone-50/70">
                  <TableRow className="border-stone-200">
                    <TableHead className="text-xs font-semibold text-stone-700">Prospect</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Phone</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Duration</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Outcome</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Score</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((c) => (
                    <TableRow key={c.id} className="border-stone-100 hover:bg-stone-50/50">
                      <TableCell className="text-xs font-semibold text-stone-900">
                        {c.leadName}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-stone-600">{c.leadPhone}</TableCell>
                      <TableCell className="text-xs font-mono text-stone-700">
                        {Math.floor(c.durationSeconds / 60)}m {c.durationSeconds % 60}s
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono capitalize bg-stone-50 text-stone-700 border-stone-200"
                        >
                          {c.outcome || "in_progress"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-stone-900">
                        {c.callScore ? `${c.callScore}/100` : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-stone-400">
                        {new Date(c.createdAt).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 7: Appointments */}
      {activeTab === "appointments" && (
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100">
            <CardTitle className="text-sm font-semibold text-stone-900">
              Inspection Bookings & Meetings
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Confirmed and scheduled in-person inspections synchronized with agent calendars.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-stone-50/70">
                  <TableRow className="border-stone-200">
                    <TableHead className="text-xs font-semibold text-stone-700">Title</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Prospect</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Scheduled</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Location</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700 text-right">
                      Link
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((a) => (
                    <TableRow key={a.id} className="border-stone-100 hover:bg-stone-50/50">
                      <TableCell className="text-xs font-semibold text-stone-900">
                        {a.title}
                      </TableCell>
                      <TableCell className="text-xs text-stone-700">{a.leadName || "—"}</TableCell>
                      <TableCell className="text-xs font-mono text-stone-600">
                        {new Date(a.scheduledStartAt).toLocaleDateString()} ·{" "}
                        {new Date(a.scheduledStartAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono capitalize bg-stone-50 text-stone-700 border-stone-200"
                        >
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-stone-600 truncate max-w-xs">
                        {a.location}
                      </TableCell>
                      <TableCell className="text-right">
                        {a.meetingUrl ? (
                          <a
                            href={a.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-stone-900 hover:underline"
                          >
                            <span>Join</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 8: Audit Activity */}
      {activeTab === "audit" && (
        <Card className="border-stone-200/90 bg-white shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-stone-900">
                Security & Compliance Audit Trail
              </CardTitle>
              <CardDescription className="text-xs text-stone-500">
                Immutable audit logs persisted to PostgreSQL for governance and compliance.
              </CardDescription>
            </div>
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              {["all", "critical", "warning", "info"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setAuditSeverityFilter(sev)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-colors",
                    auditSeverityFilter === sev
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-stone-50/70">
                  <TableRow className="border-stone-200">
                    <TableHead className="text-xs font-semibold text-stone-700">Timestamp</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Action</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Actor</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Resource</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700">Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0 border-0">
                        <EmptyState
                          preset="no-audit-logs"
                          title="No Audit Events Recorded"
                          description={
                            auditSeverityFilter !== "all"
                              ? `No audit events with severity '${auditSeverityFilter}' found.`
                              : "Administrative actions, role updates, and emergency AI overrides will be logged immutably here."
                          }
                          size="compact"
                          className="border-0 rounded-none bg-transparent py-10"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAuditLogs.map((log) => (
                    <TableRow key={log.id} className="border-stone-100 hover:bg-stone-50/50">
                      <TableCell className="text-xs font-mono text-stone-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-xs font-semibold font-mono text-stone-900">
                        {log.action}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-stone-600">
                        <span className="text-stone-400">{log.actorType}:</span>
                        <span>{log.actorId}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-stone-700 truncate max-w-xs">
                        {log.resource}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono capitalize px-2 py-0.5",
                            log.severity === "critical"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : log.severity === "warning"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-stone-100 text-stone-700 border-stone-200"
                          )}
                        >
                          {log.severity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspector Dialog for Payloads */}
      <Dialog
        open={inspectedPayload !== null}
        onOpenChange={(open) => !open && setInspectedPayload(null)}
      >
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col p-6 bg-white border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-stone-900">
              {inspectedPayload?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Raw payload snapshot captured at execution time.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-stone-950 text-stone-100 p-4 rounded-lg font-mono text-xs">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(inspectedPayload?.data, null, 2)}
            </pre>
          </div>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectedPayload(null)}
              className="text-xs border-stone-200"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
