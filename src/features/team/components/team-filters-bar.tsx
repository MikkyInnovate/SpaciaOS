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
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface TeamFiltersBarProps {
  searchQuery: string;
  onSearchChange: (search: string) => void;
  roleFilter: string;
  onRoleChange: (role: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

const ROLE_CHIPS = [
  { label: "All Members", value: "all" },
  { label: "Luxury Brokers", value: "brokers" },
  { label: "Admins", value: "admin" },
  { label: "Owners", value: "owner" },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Pending", value: "pending" },
];

export function TeamFiltersBar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
  onReset,
  totalCount,
  filteredCount,
}: TeamFiltersBarProps) {
  const hasActiveFilters = Boolean(
    (searchQuery && searchQuery.trim().length > 0) ||
      roleFilter !== "all" ||
      statusFilter !== "all"
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-200/80 bg-white p-3.5 shadow-2xs">
      {/* Top row: Search input + count display matching lead-filters-bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <SearchInput
            placeholder="Search team members by name, email, or territory..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-mono text-stone-500 tabular-nums">
            Showing <strong className="text-stone-900">{filteredCount}</strong> of{" "}
            {totalCount} members
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

      {/* Bottom row: Role chips & Status dropdown filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5">
        {/* Role Segmented Control matching LeadFiltersBar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="font-mono text-[10px] font-normal text-zinc-500 uppercase tracking-[0.14em] mr-1">
            Role:
          </span>
          {ROLE_CHIPS.map((chip) => {
            const isSelected = (roleFilter || "all") === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => onRoleChange(chip.value)}
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

        {/* Status Dropdown Filter */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-normal text-zinc-500 uppercase tracking-[0.14em] mr-1">
            Status:
          </span>
          <div className="w-40">
            <Select value={statusFilter || "all"} onValueChange={onStatusChange}>
              <SelectTrigger className="h-8 text-xs bg-white border-stone-200 shadow-2xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
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
