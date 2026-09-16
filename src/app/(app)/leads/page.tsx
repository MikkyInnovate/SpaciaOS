"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { useWorkspace } from "@/lib/context/workspace-context";
import {
  leadsService,
  LeadTable,
  LeadFiltersBar,
  LeadDetailShell,
  type Lead,
  type LeadFilterParams,
} from "@/features/leads";

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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load leads from service";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

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

  return (
    <div className="flex flex-col min-h-full pb-12 bg-[#fbfbfa]">
      <Container className="space-y-6 pt-6">
        {/* Page Header */}
        <PageHeader
          title="Lead Management"
          description={
            "Operational lead directory and autonomous qualification pipeline" +
            (currentWorkspace ? " for " + currentWorkspace.name : "")
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
        />
      </Container>
    </div>
  );
}
