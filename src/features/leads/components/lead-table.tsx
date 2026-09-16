"use client";

import * as React from "react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { EmptyState } from "@/components/shared/empty-state";
import type { Lead } from "../types";
import { ChevronRight, Phone, MapPin } from "lucide-react";

export interface LeadTableProps {
  leads: Lead[];
  isLoading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  onSelectLead?: (lead: Lead) => void;
  selectedLeadId?: string;
}

export function LeadTable({
  leads,
  isLoading = false,
  error = null,
  onRetry,
  onSelectLead,
  selectedLeadId,
}: LeadTableProps) {
  const columns = React.useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        id: "prospect",
        header: "Prospect",
        cell: ({ item }) => (
          <div className="flex flex-col min-w-[160px] py-0.5">
            <span className="font-medium text-stone-900 leading-tight truncate">
              {item.name}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 font-mono">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-stone-400" />
                {item.phone}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "property",
        header: "Property / Interest",
        cell: ({ item }) => (
          <div className="flex flex-col min-w-[200px] max-w-[280px] py-0.5">
            <span className="text-xs font-medium text-stone-800 truncate" title={item.propertyTitle}>
              {item.propertyTitle}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
              <span className="flex items-center gap-1 truncate text-stone-500">
                <MapPin className="h-3 w-3 shrink-0 text-stone-400" />
                {item.location}
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                {item.intent}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "budget",
        header: "Budget",
        cell: ({ item }) => (
          <div className="flex flex-col py-0.5">
            <span className="font-mono text-xs font-semibold text-stone-900 tabular-nums">
              {item.budget}
            </span>
            <span className="text-[10px] text-stone-400 mt-0.5">
              Timeline: {item.timeline}
            </span>
          </div>
        ),
      },
      {
        id: "score",
        header: "Score",
        cell: ({ item }) => (
          <ScoreIndicator
            score={item.score}
            category={item.scoreCategory}
            variant="badge"
            size="sm"
          />
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ item }) => (
          <StatusBadge
            status={item.status}
            withDot
            size="sm"
          />
        ),
      },
      {
        id: "nextAction",
        header: "Next Action",
        cell: ({ item }) => (
          <div className="flex items-center justify-between gap-2 max-w-[240px] py-0.5">
            <span className="text-xs text-stone-600 truncate" title={item.nextAction}>
              {item.nextAction}
            </span>
            <ChevronRight className="h-4 w-4 text-stone-400 shrink-0 group-hover:text-stone-700 transition-colors" />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DataTable<Lead>
      data={leads}
      columns={columns}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onRowClick={onSelectLead}
      selectedRowId={selectedLeadId}
      showSearch={false}
      showPagination={leads.length > 8}
      emptyState={
        <EmptyState
          preset="no-leads"
          title="No leads found"
          description="No real-estate prospects match your active search and filter criteria."
        />
      }
    />
  );
}
