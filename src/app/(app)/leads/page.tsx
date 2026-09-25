"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/context/workspace-context";
import {
  leadsService,
  LeadTable,
  LeadFiltersBar,
  LeadDetailShell,
  LeadIntakeDialog,
  type Lead,
  type LeadStatus,
  type LeadFilterParams,
  type FollowUpSchedule,
  type LossDetails,
} from "@/features/leads";
import { exportLeadsToCSV } from "@/lib/utils/export-csv";
import { Download, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function LeadsPage() {
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();

  // Filter state
  const [filters, setFilters] = React.useState<LeadFilterParams>({
    search: "",
    scoreCategory: "ALL",
    status: "ALL",
  });

  // Data & loading state
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  // Selected lead for detail inspection drawer
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Day 14: Lead Intake Modal
  const [isIntakeOpen, setIsIntakeOpen] = React.useState(false);

  // Fetch leads when filters change
  const loadLeads = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await leadsService.getLeads(filters);
      setLeads(response.leads);
      setTotalCount(response.total);

      // Keep selected lead in sync if drawer is open
      if (selectedLead) {
        const refreshedSelected = response.leads.find((l) => l.id === selectedLead.id);
        if (refreshedSelected) {
          setSelectedLead(refreshedSelected);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load leads from service";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedLead]);

  React.useEffect(() => {
    if (isWorkspaceLoading) {
      return;
    }

    let isCancelled = false;

    const fetchLeads = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await leadsService.getLeads(filters);
        if (!isCancelled) {
          setLeads(response.leads);
          setTotalCount(response.total);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load leads from service";
          setError(message);
          setIsLoading(false);
        }
      }
    };

    fetchLeads();

    return () => {
      isCancelled = true;
    };
  }, [filters, currentWorkspace?.id, isWorkspaceLoading]);

  // Handle row selection to open detail shell
  const handleSelectLead = React.useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  }, []);

  // Handle lead successfully registered via intake modal
  const handleLeadCreated = React.useCallback((newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev.filter((l) => l.id !== newLead.id)]);
    setTotalCount((prev) => prev + 1);
    setSelectedLead(newLead);
    setIsDrawerOpen(true);
  }, []);

  // Handle resetting filters
  const handleResetFilters = React.useCallback(() => {
    setFilters({
      search: "",
      scoreCategory: "ALL",
      status: "ALL",
    });
  }, []);

  // Handle lead status transition inside the detail dossier
  const handleStatusChange = React.useCallback(
    async (leadId: string, newStatus: LeadStatus) => {
      const updatedLead = await leadsService.updateLeadStatus(leadId, newStatus);
      setSelectedLead(updatedLead);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));
    },
    []
  );

  // Handle appending broker notes to lead activity timeline
  const handleAddNote = React.useCallback(
    async (leadId: string, noteText: string, imageUrl?: string) => {
      const newActivity = await leadsService.addLeadActivity(leadId, {
        type: "human_note",
        title: imageUrl ? "Broker Memo with Attachment" : "Broker Memo Recorded",
        description: noteText,
        timestamp: "Just now",
        channel: "Sales Command",
        meta: imageUrl
          ? {
              imageUrl,
              imageCaption: "Broker site inspection / proof attachment",
            }
          : undefined,
      });

      if (selectedLead && selectedLead.id === leadId) {
        const updated: Lead = {
          ...selectedLead,
          activities: [newActivity, ...(selectedLead.activities || [])],
        };
        setSelectedLead(updated);
        setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      }
    },
    [selectedLead]
  );

  // Day 13: Handle Broker Takeover
  const handleTakeover = React.useCallback(
    async (leadId: string, brokerName?: string, reason?: string) => {
      const updated = await leadsService.takeoverLead(leadId, brokerName, reason);
      setSelectedLead(updated);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    },
    []
  );

  // Day 13: Handle Stop AI
  const handleStopAI = React.useCallback(async (leadId: string, reason?: string) => {
    const updated = await leadsService.stopAI(leadId, reason);
    setSelectedLead(updated);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
  }, []);

  // Day 13: Handle Resume AI
  const handleResumeAI = React.useCallback(async (leadId: string) => {
    const updated = await leadsService.resumeAI(leadId);
    setSelectedLead(updated);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
  }, []);

  // Day 13: Handle Mark Nurture
  const handleMarkNurture = React.useCallback(
    async (leadId: string, schedule: FollowUpSchedule, notes?: string) => {
      const updated = await leadsService.markNurture(leadId, schedule, notes);
      setSelectedLead(updated);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    },
    []
  );

  // Day 13: Handle Mark Lost
  const handleMarkLost = React.useCallback(
    async (leadId: string, lossDetails: LossDetails) => {
      const updated = await leadsService.markLost(leadId, lossDetails);
      setSelectedLead(updated);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    },
    []
  );

  // Day 13: Handle Update Follow-up Schedule
  const handleUpdateSchedule = React.useCallback(
    async (leadId: string, schedule: FollowUpSchedule) => {
      const updated = await leadsService.updateFollowUpSchedule(leadId, schedule);
      setSelectedLead(updated);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    },
    []
  );

  // Day 13: Handle Objection Status Change with Reactive Score Lift
  const handleObjectionStatusChange = React.useCallback(
    async (leadId: string, objectionId: string, status: "open" | "resolved", note?: string) => {
      const res = await leadsService.updateObjectionStatus(leadId, objectionId, status, note);
      setSelectedLead(res.lead);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? res.lead : l)));

      if (res.scoreDelta !== 0) {
        toast.info(
          res.scoreDelta > 0
            ? `Underwriting Score Lift (+${res.scoreDelta} pts)`
            : `Score Adjustment (${res.scoreDelta} pts)`,
          {
            description: `${res.lead.name}'s qualification score is now ${res.lead.score}/100 (${res.lead.scoreCategory}).`,
          }
        );
      }
    },
    []
  );

  // Handle CSV data export
  const handleExport = () => {
    if (leads.length === 0) {
      toast.error("No leads available to export");
      return;
    }

    setIsExporting(true);
    // exportLeadsToCSV accepts Lead objects matching the column structure
    const result = exportLeadsToCSV(
      leads as unknown as Parameters<typeof exportLeadsToCSV>[0],
      currentWorkspace?.slug || "spacia"
    );

    if (result) {
      toast.success("Leads Exported to CSV", {
        description: `Generated ${result.filename} with ${result.count} prospect records.`,
      });
    }

    setTimeout(() => {
      setIsExporting(false);
    }, 400);
  };

  return (
    <Container size="lg" className="space-y-4 pb-12">
      {/* Page Header */}
        <PageHeader
          title="Lead Management"
          description={
            <span>
              Autonomous prospect intake, 5-point qualification underwriting, and deal progression for{" "}
              <strong>{currentWorkspace?.name || "Pacia Agency HQ"}</strong>.
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="h-8 gap-1.5 text-xs text-stone-700 bg-white shadow-2xs hover:bg-stone-50 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-500" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 text-stone-400" />
                    <span>Export Leads</span>
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={() => setIsIntakeOpen(true)}
                className="h-8 gap-1.5 text-xs bg-[#0d4a36] hover:bg-[#0a3a2a] text-white shadow-2xs cursor-pointer font-medium"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Intake Lead</span>
              </Button>
            </div>
          }
        />

        {/* Foundational Filters Bar */}
        <LeadFiltersBar
          filters={filters}
          onFilterChange={setFilters}
          onReset={handleResetFilters}
          totalCount={totalCount}
          filteredCount={leads.length}
        />

        {/* Operational Leads Table */}
        <div className="space-y-3">
          <LeadTable
            leads={leads}
            isLoading={isLoading}
            error={error}
            onRetry={loadLeads}
            onSelectLead={handleSelectLead}
            selectedLeadId={selectedLead?.id}
          />
        </div>

        {/* Lead Detail Shell in DetailDrawer */}
        <LeadDetailShell
          lead={selectedLead}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          onStatusChange={handleStatusChange}
          onAddNote={handleAddNote}
          onTakeover={handleTakeover}
          onStopAI={handleStopAI}
          onResumeAI={handleResumeAI}
          onMarkNurture={handleMarkNurture}
          onMarkLost={handleMarkLost}
          onUpdateSchedule={handleUpdateSchedule}
          onObjectionStatusChange={handleObjectionStatusChange}
        />

        {/* Day 14: Lead Intake Dialog with Live Duplicate Detection */}
        <LeadIntakeDialog
          open={isIntakeOpen}
          onOpenChange={setIsIntakeOpen}
          onLeadCreated={handleLeadCreated}
          onSelectExistingLead={(leadId) => {
            const match = leads.find((l) => l.id === leadId);
            if (match) {
              setSelectedLead(match);
              setIsDrawerOpen(true);
            }
          }}
        />
      </Container>
  );
}
