"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/context/workspace-context";
import { StatMetricCard } from "@/features/dashboard/components/stat-metric-card";
import { LeadIntakeTable } from "@/features/dashboard/components/lead-intake-table";
import { LeadDossierPanel } from "@/features/dashboard/components/lead-dossier-panel";
import { OperationsActivityFeed } from "@/features/dashboard/components/operations-activity-feed";
import { UpcomingViewingsList } from "@/features/dashboard/components/upcoming-viewings-list";
import { PipelineFunnel } from "@/features/dashboard/components/pipeline-funnel";
import { dashboardService } from "@/features/dashboard/services/dashboard-service";
import { leadsService } from "@/features/leads/services/leads-service";
import { appointmentsService } from "@/features/appointments/services/appointments-service";
import type {
  DashboardLead,
  DashboardMetrics,
  AttentionItem,
  DashboardFeedItem,
  DashboardViewing,
  PipelineFunnelStageItem,
} from "@/features/dashboard/types";
import { toast } from "sonner";
import { exportLeadsToCSV } from "@/lib/utils/export-csv";
import {
  Users,
  CheckCircle2,
  Flame,
  CalendarCheck,
  Building2,
  Download,
  Loader2,
  X,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const [selectedLead, setSelectedLead] = React.useState<DashboardLead | null>(null);
  const [takeoverBanner, setTakeoverBanner] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Live aggregated command center states
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [attentionItems, setAttentionItems] = React.useState<AttentionItem[]>([]);
  const [activityFeed, setActivityFeed] = React.useState<DashboardFeedItem[]>([]);
  const [funnelStages, setFunnelStages] = React.useState<PipelineFunnelStageItem[]>([]);
  const [leadsList, setLeadsList] = React.useState<DashboardLead[]>([]);
  const [viewingsList, setViewingsList] = React.useState<DashboardViewing[]>([]);

  // Load dashboard telemetry data
  const loadDashboardData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [
        fetchedMetrics,
        fetchedAttention,
        fetchedFeed,
        fetchedFunnel,
        fetchedLeadsRes,
        fetchedAptsRes,
      ] = await Promise.allSettled([
        dashboardService.getMetrics(),
        dashboardService.getAttentionItems(),
        dashboardService.getActivityFeed(),
        dashboardService.getPipelineFunnel(),
        leadsService.getLeads(),
        appointmentsService.getAppointments(),
      ]);

      if (fetchedMetrics.status === "fulfilled" && fetchedMetrics.value) {
        setMetrics(fetchedMetrics.value);
      }
      if (fetchedAttention.status === "fulfilled" && fetchedAttention.value) {
        setAttentionItems(fetchedAttention.value);
      }
      if (fetchedFeed.status === "fulfilled" && fetchedFeed.value) {
        setActivityFeed(fetchedFeed.value);
      }
      if (fetchedFunnel.status === "fulfilled" && fetchedFunnel.value) {
        setFunnelStages(fetchedFunnel.value);
      }

      // Populate lead table with live leads or empty list
      if (
        fetchedLeadsRes.status === "fulfilled" &&
        fetchedLeadsRes.value?.leads &&
        fetchedLeadsRes.value.leads.length > 0
      ) {
        const adaptedLeads: DashboardLead[] = fetchedLeadsRes.value.leads.map((l) => ({
          id: l.id,
          name: l.name,
          phone: l.phone,
          email: l.email || "",
          propertyTitle: l.property?.title || "Luxury Lagos Residence",
          location: l.property?.location || "Ikoyi, Lagos",
          budget: l.budget || "Verified",
          score: l.score || 0,
          scoreCategory: (l.scoreCategory as any) || "COLD",
          status: (l.status as any) || "New",
          intent: (l.intent as any) || "Purchase",
          timeline: l.timeline || "Immediate",
          nextAction: l.nextAction || "AI Evaluation",
          createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "Today",
          aiNotes: l.aiNotes || undefined,
        }));
        setLeadsList(adaptedLeads);
      } else if (fetchedLeadsRes.status === "fulfilled") {
        setLeadsList([]);
      }

      // Populate upcoming viewings with live appointments or empty list
      if (
        fetchedAptsRes.status === "fulfilled" &&
        Array.isArray(fetchedAptsRes.value) &&
        fetchedAptsRes.value.length > 0
      ) {
        const adaptedViewings: DashboardViewing[] = fetchedAptsRes.value.map((apt) => ({
          id: apt.id,
          prospectName: apt.leadName || "Registered Prospect",
          propertyTitle: apt.propertyTitle || "Luxury Property Inspection",
          agentName: apt.assignedBrokerName || "Senior Luxury Closer",
          date: new Date(apt.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          time: new Date(apt.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          status: apt.status === "confirmed" ? "Confirmed" : apt.status === "scheduled" ? "Scheduled" : "Pending",
          leadScore: apt.leadScore || 85,
        }));
        setViewingsList(adaptedViewings);
      } else if (fetchedAptsRes.status === "fulfilled") {
        setViewingsList([]);
      }
    } catch (err) {
      console.warn("Failed to refresh dashboard data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and automatic background polling every 10 seconds
  React.useEffect(() => {
    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadDashboardData, currentWorkspace?.id]);

  const handleExport = () => {
    setIsExporting(true);
    const result = exportLeadsToCSV(leadsList, currentWorkspace?.slug || "spacia-hq");

    if (result) {
      toast.success("CSV Export Complete", {
        description: `Exported ${result.count} prospects to ${result.filename}.`,
      });
    }

    setTimeout(() => {
      setIsExporting(false);
    }, 500);
  };

  const handleInspectLead = (lead: DashboardLead) => {
    setSelectedLead((prev) => (prev?.id === lead.id ? null : lead));
  };

  const handleInspectById = (leadId: string) => {
    const found = leadsList.find((l) => l.id === leadId);
    if (found) {
      setSelectedLead(found);
    } else if (leadsList[0]) {
      setSelectedLead(leadsList[0]);
    }
  };

  const handleTakeover = (lead: DashboardLead) => {
    setTakeoverBanner(lead.name);
  };

  return (
    <Container size="lg" className="space-y-4">
      {/* Workspace Command Header */}
      <PageHeader
        title="Sales Command Center"
        description="Autonomous prospect response, qualification, viewing pipeline & broker intervention cockpit."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-2xs whitespace-nowrap">
              <Building2 className="h-3.5 w-3.5 text-stone-400 shrink-0" aria-hidden="true" />
              <span>{currentWorkspace?.name || "Spacia Luxury Hub"}</span>
            </div>

            <div className="flex items-center gap-1.5 h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-2xs whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0 animate-pulse" />
              <span>AI Core: Active</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="h-8 gap-1.5 text-xs text-stone-700 bg-white shadow-2xs whitespace-nowrap hover:bg-stone-50 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-500 shrink-0" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span>Export</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Human Takeover Alert Banner */}
      {takeoverBanner && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-3 flex items-center justify-between text-xs text-rose-900 shadow-xs animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            <span className="font-semibold">Human Broker Takeover Active for {takeoverBanner}.</span>
            <span className="text-rose-700">Autonomous AI communications paused. Direct closer intervention required.</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs text-rose-800 hover:text-rose-950 p-1"
            onClick={() => setTakeoverBanner(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* 4 Prioritized Command Center KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. INBOUND LEADS */}
        <StatMetricCard
          title="Inbound Leads"
          value={metrics ? metrics.leads.total : 0}
          subtext={
            metrics
              ? `${metrics.leads.today} new inquiries today`
              : "Live telemetry"
          }
          trend={{
            value: metrics?.leads.trend || "+0%",
            isPositive: true,
          }}
          icon={Users}
          variant="sky"
          isLoading={isLoading && !metrics}
        />

        {/* 2. QUALIFIED INTENT */}
        <StatMetricCard
          title="Qualified Intent"
          value={metrics ? metrics.qualified.total : 0}
          subtext={
            metrics
              ? `${metrics.qualified.formattedRate} conversion rate`
              : "0% conversion rate"
          }
          trend={{
            value: `+${metrics ? metrics.qualified.today : 0} today`,
            isPositive: true,
          }}
          icon={CheckCircle2}
          variant="emerald"
          isLoading={isLoading && !metrics}
        />

        {/* 3. HOT PROSPECTS */}
        <StatMetricCard
          title="Hot Prospects"
          value={metrics ? metrics.hot.total : 0}
          subtext={
            metrics?.hot.urgentAttentionCount
              ? `${metrics.hot.urgentAttentionCount} unbooked urgent`
              : metrics?.handoffs.pendingActionCount
              ? `${metrics.handoffs.pendingActionCount} pending takeovers`
              : "High transaction intent"
          }
          badge="Score ≥ 85"
          icon={Flame}
          variant="rose"
          isLoading={isLoading && !metrics}
        />

        {/* 4. BOOKED VIEWINGS */}
        <StatMetricCard
          title="Booked Viewings"
          value={metrics ? metrics.viewings.total : 0}
          subtext={
            metrics
              ? `${metrics.viewings.upcomingThisWeek} upcoming this week`
              : "0 upcoming this week"
          }
          trend={{
            value: `+${metrics ? metrics.viewings.today : 0} today`,
            isPositive: true,
          }}
          icon={CalendarCheck}
          variant="amber"
          isLoading={isLoading && !metrics}
        />
      </div>


      {/* Lead Qualification Feed Area with Interactive Split Dossier on Inspect */}
      {selectedLead ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span className="font-medium text-stone-700">
              Inspecting Lead: <strong className="text-stone-900">{selectedLead.name}</strong> • AI Call Transcript
            </span>
            <button
              type="button"
              onClick={() => setSelectedLead(null)}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 shadow-2xs font-medium text-xs transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5 text-stone-500" />
              <span>Close Split</span>
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-7 overflow-x-auto">
              <LeadIntakeTable
                leads={leadsList}
                selectedLeadId={selectedLead.id}
                onTakeLead={handleInspectLead}
                isSplitView={true}
                onToggleSplit={() => setSelectedLead(null)}
                isLoading={isLoading && leadsList.length === 0}
              />
            </div>
            <div className="lg:col-span-5">
              <LeadDossierPanel
                lead={selectedLead}
                onClose={() => setSelectedLead(null)}
                onTakeover={handleTakeover}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <LeadIntakeTable
            leads={leadsList}
            onTakeLead={handleInspectLead}
            isSplitView={false}
            isLoading={isLoading && leadsList.length === 0}
          />
        </div>
      )}

      {/* What Happened Today? - Full Width Operations Feed */}
      <div className="w-full pt-2">
        <OperationsActivityFeed
          feed={activityFeed}
          onInspectLead={handleInspectById}
          isLoading={isLoading && activityFeed.length === 0}
        />
      </div>

      {/* Confirmed Viewings - Full Width Section */}
      <div className="w-full pt-2">
        <UpcomingViewingsList
          viewings={viewingsList}
          isLoading={isLoading && viewingsList.length === 0}
        />
      </div>

      {/* Pipeline Progression Trajectory Chart */}
      <div className="w-full pt-1">
        <PipelineFunnel
          stages={funnelStages.length > 0 ? funnelStages : undefined}
          metrics={
            metrics
              ? {
                  leadsTotal: metrics.leads.total,
                  qualifiedTotal: metrics.qualified.total,
                  viewingsTotal: metrics.viewings.total,
                }
              : undefined
          }
          isLoading={isLoading && !metrics}
        />
      </div>
    </Container>
  );
}
