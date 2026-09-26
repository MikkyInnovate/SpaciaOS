import * as React from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { DashboardLead } from "../types";
import { cn } from "@/lib/utils/cn";
import { MapPin, Phone, ChevronRight, SplitSquareVertical, X } from "lucide-react";

export interface LeadIntakeTableProps {
  leads: DashboardLead[];
  onTakeLead?: (lead: DashboardLead) => void;
  selectedLeadId?: string | null;
  isSplitView?: boolean;
  onToggleSplit?: () => void;
  hideViewAll?: boolean;
  isLoading?: boolean;
}

export function LeadIntakeTable({
  leads,
  onTakeLead,
  selectedLeadId,
  isSplitView,
  onToggleSplit,
  hideViewAll = false,
  isLoading = false,
}: LeadIntakeTableProps) {
  return (
    <div className="rounded-lg border border-border bg-white shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-4 bg-stone-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-stone-900">
              Lead Qualification Feed
            </h2>
            <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Live Feed
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Website inquiries qualified via AI conversation & verified property data
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onToggleSplit && (
            <Button
              variant={isSplitView ? "secondary" : "outline"}
              size="sm"
              className={`h-7.5 px-2.5 text-xs gap-1.5 transition-colors cursor-pointer ${
                isSplitView
                  ? "bg-stone-100 text-stone-900 font-semibold border border-stone-300 hover:bg-stone-200/80"
                  : "text-stone-700 hover:text-stone-900 bg-white"
              }`}
              onClick={onToggleSplit}
              title={isSplitView ? "Close split inspector" : "Open split inspector"}
              aria-label={isSplitView ? "Close split inspector" : "Open split inspector"}
            >
              {isSplitView ? (
                <>
                  <X className="h-3.5 w-3.5 text-stone-600 shrink-0" />
                  <span>Close Split</span>
                </>
              ) : (
                <>
                  <SplitSquareVertical className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                  <span>Split View</span>
                </>
              )}
            </Button>
          )}

          {!hideViewAll && (
            <Button asChild variant="outline" size="sm" className="text-xs h-7.5 text-stone-700 bg-white">
              <Link href="/leads">
                View All Leads
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[170px] whitespace-nowrap">Prospect</TableHead>
            <TableHead className="min-w-[190px] whitespace-nowrap">Property Interest</TableHead>
            <TableHead className="min-w-[130px] whitespace-nowrap">Commercial Fit</TableHead>
            <TableHead className="min-w-[100px] whitespace-nowrap">Score</TableHead>
            <TableHead className="min-w-[120px] whitespace-nowrap">Status</TableHead>
            <TableHead className="min-w-[100px] text-right whitespace-nowrap">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-row-${i}`}>
                <TableCell>
                  <div className="space-y-1.5 py-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5 py-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5 py-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-7 w-16 ml-auto rounded-md" />
                </TableCell>
              </TableRow>
            ))
          ) : leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="p-0 border-0">
                <EmptyState
                  preset="no-leads"
                  size="compact"
                  className="border-0 rounded-none bg-transparent"
                />
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => {
              const isHot = lead.scoreCategory === "HOT";
              const isSelected = selectedLeadId === lead.id;

              return (
                <TableRow
                  key={lead.id}
                  className={cn(
                    "group transition-colors",
                    isSelected ? "bg-stone-50 border-l-2 border-l-stone-900" : ""
                  )}
                >
                  {/* Prospect Details */}
                  <TableCell>
                    <div className="flex flex-col min-w-0">
                      <button
                        type="button"
                        onClick={() => onTakeLead?.(lead)}
                        className="font-semibold text-stone-900 text-sm hover:underline hover:text-[#0d4a36] transition-colors text-left cursor-pointer"
                      >
                        {lead.name}
                      </button>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                        <Phone className="h-3 w-3 text-stone-400" />
                        <span className="tabular-nums">{lead.phone}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Property Interest */}
                  <TableCell>
                    <div className="flex flex-col min-w-0 max-w-[210px]">
                      <span className="text-xs font-medium text-stone-900 truncate">
                        {lead.propertyTitle}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                        <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                        <span className="truncate">{lead.location}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Budget & Timeline */}
                  <TableCell>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-stone-900 text-xs tabular-nums">
                        {lead.budget}
                      </span>
                      <span className="text-[11px] text-stone-500 mt-0.5">
                        {lead.timeline}
                      </span>
                    </div>
                  </TableCell>

                  {/* Explainable Lead Score */}
                  <TableCell>
                    <ScoreIndicator score={lead.score} category={lead.scoreCategory} variant="badge" />
                  </TableCell>

                  {/* Status */}
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge status={lead.status} withDot />
                  </TableCell>

                  {/* Human Takeover Action */}
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      variant={isSelected ? "secondary" : isHot ? "default" : "outline"}
                      className={cn(
                        "h-7 px-2.5 text-xs gap-1 whitespace-nowrap cursor-pointer",
                        isSelected && "bg-stone-900 text-white hover:bg-stone-800"
                      )}
                      onClick={() => onTakeLead?.(lead)}
                    >
                      <span>{isSelected ? "Inspecting" : "Inspect"}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
