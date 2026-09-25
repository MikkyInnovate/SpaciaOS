"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/context/workspace-context";
import { StatMetricCard } from "@/features/dashboard/components/stat-metric-card";
import { LeadIntakeTable } from "@/features/dashboard/components/lead-intake-table";
import { LeadDossierPanel } from "@/features/dashboard/components/lead-dossier-panel";
import { AIAgentLiveFeed } from "@/features/dashboard/components/ai-agent-live-feed";
import { UpcomingViewingsList } from "@/features/dashboard/components/upcoming-viewings-list";
import { PipelineFunnel } from "@/features/dashboard/components/pipeline-funnel";
import {
  MOCK_DASHBOARD_LEADS,
  MOCK_UPCOMING_VIEWINGS,
  MOCK_AI_OPERATIONS,
  MOCK_FUNNEL_METRICS,
} from "@/features/dashboard/data/mock-data";
import type { DashboardLead } from "@/features/dashboard/types";
import { toast } from "sonner";
import { exportLeadsToCSV } from "@/lib/utils/export-csv";
import {
  Users,
  Zap,
  CheckCircle2,
  Flame,
  CalendarCheck,
  Building2,
  Download,
  X,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { currentWorkspace } = useWorkspace();
  const [selectedLead, setSelectedLead] = React.useState<DashboardLead | null>(
    MOCK_DASHBOARD_LEADS[0] // Pre-select first lead to showcase the resizable panel immediately!
  );
  const [takeoverBanner, setTakeoverBanner] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = () => {
    setIsExporting(true);
    const result = exportLeadsToCSV(MOCK_DASHBOARD_LEADS, "pacia-hq");

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
    setSelectedLead(lead);
  };

  const handleTakeover = (lead: DashboardLead) => {
    setTakeoverBanner(lead.name);
  };

  return (
    <Container size="lg" className="space-y-4">
      {/* Workspace Command Header */}
      <PageHeader
        title="Overview"
        description="Autonomous prospect response, qualification, and viewing pipeline."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-2xs whitespace-nowrap">
              <Building2 className="h-3.5 w-3.5 text-stone-400 shrink-0" aria-hidden="true" />
              <span>{currentWorkspace?.name || "Workspace"}</span>
            </div>

            <div className="flex items-center gap-1.5 h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-2xs whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span>AI Core: Operational</span>
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
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 flex items-center justify-between text-xs text-stone-800 shadow-xs animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span className="font-semibold">Human Takeover Initiated for {takeoverBanner}.</span>
            <span className="text-stone-500">Autonomous AI communication stopped. Context packaged for sales agent.</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs text-stone-600 hover:text-stone-900 p-1"
            onClick={() => setTakeoverBanner(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Operational KPI Metric Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatMetricCard
          title="Inbound Inquiries"
          value="142"
          subtext="Last 24 hours"
          trend={{ value: "+18.4%", isPositive: true }}
          icon={Users}
          variant="sky"
        />
        <StatMetricCard
          title="Avg First Contact"
          value="48s"
          subtext="Autonomous speed"
          trend={{ value: "98.2%", isPositive: true }}
          icon={Zap}
          variant="amber"
        />
        <StatMetricCard
          title="Qualified Intent"
          value="38"
          subtext="Verified readiness"
          trend={{ value: "+12.1%", isPositive: true }}
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatMetricCard
          title="Hot Prospects"
          value="9"
          subtext="Ready for viewing"
          badge="High Priority"
          icon={Flame}
          variant="rose"
        />
        <StatMetricCard
          title="Booked Viewings"
          value="6"
          subtext="Agent confirmed"
          trend={{ value: "+3 today", isPositive: true }}
          icon={CalendarCheck}
          variant="indigo"
        />
      </div>

      {/* Lead Qualification Feed & Inspector Area */}
      {selectedLead ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span className="font-medium text-stone-700">
              Inspecting Lead: <strong className="text-stone-900">{selectedLead.name}</strong> • AI Call Transcript & Qualification Dossier
            </span>
            <button
              type="button"
              onClick={() => setSelectedLead(null)}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 shadow-2xs font-medium text-xs transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5 text-stone-500" />
              <span>Close Dossier</span>
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-7 overflow-x-auto">
              <LeadIntakeTable
                leads={MOCK_DASHBOARD_LEADS}
                onTakeLead={handleInspectLead}
                isSplitView={true}
                onToggleSplit={() => setSelectedLead(null)}
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
            leads={MOCK_DASHBOARD_LEADS}
            onTakeLead={handleInspectLead}
            isSplitView={false}
            onToggleSplit={() => setSelectedLead(MOCK_DASHBOARD_LEADS[0])}
          />
        </div>
      )}

      {/* Operations Row 1: 2-on-a-view (AI Sales Activity + Confirmed Viewings) */}
      <div className="grid gap-6 md:grid-cols-2 items-start pt-1">
        <AIAgentLiveFeed events={MOCK_AI_OPERATIONS} />
        <UpcomingViewingsList viewings={MOCK_UPCOMING_VIEWINGS} />
      </div>

      {/* Operations Row 2: Sales Pipeline Progression Graph Chart (Standalone Full Width) */}
      <div className="w-full pt-1">
        <PipelineFunnel stages={MOCK_FUNNEL_METRICS} />
      </div>
    </Container>
  );
}
