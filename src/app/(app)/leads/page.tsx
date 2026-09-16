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
  type Lead,
  type LeadStatus,
  type LeadFilterParams,
} from "@/features/leads";
import { exportLeadsToCSV } from "@/lib/utils/export-csv";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LeadsPage() {
  const { currentWorkspace } = useWorkspace();

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
    let isCancelled = false;

    const fetchLeads = async () => {
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
  }, [filters]);

  // Handle row selection to open detail shell
  const handleSelectLead = React.useCallback((lead: Lead) => {
    setSelectedLead(lead);
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
    <div className="flex flex-col min-h-full pb-12 bg-[#fbfbfa]">
      <Container className="space-y-6 pt-6">
        {/* Page Header */}
        <PageHeader
          title="Lead Management"
          description={
            "Operational lead directory and autonomous qualification pipeline" +
            (currentWorkspace ? ` for ${currentWorkspace.name}` : ".")
          }
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting || leads.length === 0}
              className="h-8 gap-1.5 text-xs text-stone-700 bg-white border-stone-200 shadow-2xs hover:bg-stone-50 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-500" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 text-stone-400" />
                  <span>Export ({leads.length})</span>
                </>
              )}
            </Button>
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
        />
      </Container>
    </div>
  );
}
