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
import { AppointmentStatus, MeetingType } from "../types";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AppointmentFiltersBarProps {
  searchQuery: string;
  onSearchChange: (search: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  formatFilter?: string;
  onFormatChange?: (format: string) => void;
  onReset?: () => void;
  totalCount: number;
  filteredCount: number;
}

const STATUS_CHIPS: Array<{ label: string; value: AppointmentStatus | "ALL" }> = [
  { label: "All Statuses", value: "ALL" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const FORMAT_OPTIONS: Array<{ label: string; value: MeetingType | "ALL" }> = [
  { label: "All Formats", value: "ALL" },
  { label: "In-Person Viewing", value: "in_person_viewing" },
  { label: "VIP Private Showing", value: "vip_private_showing" },
  { label: "Live Video Tour", value: "virtual_tour" },
  { label: "Office Briefing", value: "office_consultation" },
];

export function AppointmentFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  formatFilter = "ALL",
  onFormatChange,
  onReset,
  totalCount,
  filteredCount,
}: AppointmentFiltersBarProps) {
  const hasActiveFilters = Boolean(
    (searchQuery && searchQuery.trim().length > 0) ||
      (statusFilter && statusFilter !== "ALL") ||
      (formatFilter && formatFilter !== "ALL")
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-200/80 bg-white p-3.5 shadow-2xs">
      {/* Top row: Search input + count display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <SearchInput
            placeholder="Search prospects by name, phone, property or location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-mono text-stone-500 tabular-nums">
            Showing <strong className="text-stone-900">{filteredCount}</strong> of{" "}
            {totalCount} appointments
          </span>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 text-xs text-stone-600 hover:text-stone-900 gap-1 px-2 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Bottom row: Status chips & Format dropdown filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5">
        {/* Status Category Segmented Control */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mr-1">
            Status:
          </span>
          {STATUS_CHIPS.map((chip) => {
            const isSelected = (statusFilter || "ALL") === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => onStatusChange(chip.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none whitespace-nowrap cursor-pointer",
                  isSelected
                    ? "bg-[#0d4a36] text-white font-semibold shadow-2xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900"
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Format Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mr-1">
            Format:
          </span>
          <div className="w-44">
            <Select
              value={formatFilter}
              onValueChange={(val) => onFormatChange?.(val)}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-stone-200 shadow-2xs">
                <SelectValue placeholder="All Formats" />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
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
