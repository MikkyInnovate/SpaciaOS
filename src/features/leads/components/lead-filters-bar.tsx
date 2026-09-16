"use client";

import * as React from "react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LeadFilterParams, LeadScoreCategory, LeadStatus } from "../types";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LeadFiltersBarProps {
  filters: LeadFilterParams;
  onFilterChange: (filters: LeadFilterParams) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

const SCORE_OPTIONS: Array<{ label: string; value: LeadScoreCategory | "ALL" }> = [
  { label: "All Tiers", value: "ALL" },
  { label: "HOT (80+)", value: "HOT" },
  { label: "WARM (60-79)", value: "WARM" },
  { label: "COLD (<60)", value: "COLD" },
];

const STATUS_OPTIONS: Array<{ label: string; value: LeadStatus | "ALL" }> = [
  { label: "All Statuses", value: "ALL" },
  { label: "Qualified", value: "Qualified" },
  { label: "Viewing Booked", value: "Viewing Booked" },
  { label: "In Conversation", value: "In Conversation" },
  { label: "Contacting", value: "Contacting" },
  { label: "Follow-up", value: "Follow-up" },
  { label: "New", value: "New" },
];

export function LeadFiltersBar({
  filters,
  onFilterChange,
  onReset,
  totalCount,
  filteredCount,
}: LeadFiltersBarProps) {
  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim().length > 0) ||
      (filters.scoreCategory && filters.scoreCategory !== "ALL") ||
      (filters.status && filters.status !== "ALL")
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-3.5">
      {/* Top row: Search input + count display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <SearchInput
            placeholder="Search prospects by name, phone, property or location..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            onClear={() => onFilterChange({ ...filters, search: "" })}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-mono text-stone-500 tabular-nums">
            Showing <strong className="text-stone-900">{filteredCount}</strong> of{" "}
            {totalCount} leads
          </span>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 text-xs text-stone-600 hover:text-stone-900 gap-1 px-2"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Bottom row: Score chips & Status dropdown filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5">
        {/* Score Category Segmented Control */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mr-1">
            Score:
          </span>
          {SCORE_OPTIONS.map((option) => {
            const isSelected =
              (filters.scoreCategory || "ALL") === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onFilterChange({ ...filters, scoreCategory: option.value })
                }
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none whitespace-nowrap",
                  isSelected
                    ? "bg-[#0d4a36] text-white font-semibold"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900"
                )}
              >
                {option.label}
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
              value={filters.status || "ALL"}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  status: value as LeadStatus | "ALL",
                })
              }
            >
              <SelectTrigger className="h-8 text-xs bg-white border-stone-200">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
