"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { Call, CallOutcome } from "../types";
import { CallOutcomeBadge } from "./call-outcome-badge";
import { CallRecordingBadge } from "./call-recording-badge";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  PanelRightOpen,
  ChevronRight,
} from "lucide-react";

export interface CallListProps {
  calls: Call[];
  selectedCallId?: string | null;
  onSelectCall: (call: Call) => void;
  className?: string;
}

export function CallList({
  calls,
  selectedCallId,
  onSelectCall,
  className,
}: CallListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [outcomeFilter, setOutcomeFilter] = React.useState<CallOutcome | "ALL">("ALL");

  const filteredCalls = React.useMemo(() => {
    return calls.filter((call) => {
      const matchesOutcome =
        outcomeFilter === "ALL" || call.outcome === outcomeFilter;

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        call.leadName.toLowerCase().includes(q) ||
        call.propertyTitle.toLowerCase().includes(q) ||
        call.propertyLocation.toLowerCase().includes(q) ||
        Boolean(call.summary?.synthesis?.toLowerCase().includes(q));

      return matchesOutcome && matchesSearch;
    });
  }, [calls, outcomeFilter, searchTerm]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 rounded-xl border border-stone-200 bg-white p-3 shadow-2xs">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search prospect, property, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
            size="sm"
          />
        </div>

        {/* Outcome Filter Chips */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { value: "ALL", label: "All" },
              { value: "viewing_booked", label: "Viewings" },
              { value: "qualified", label: "Qualified" },
              { value: "callback_requested", label: "Callback" },
              { value: "escalated_takeover", label: "Takeover" },
              { value: "voicemail", label: "Voicemail" },
            ] as const
          ).map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setOutcomeFilter(filter.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none whitespace-nowrap cursor-pointer",
                outcomeFilter === filter.value
                  ? "bg-[#0d4a36] text-white font-semibold shadow-2xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900"
              )}
            >
              {filter.label}
            </button>
          ))}

          {(searchTerm || outcomeFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setOutcomeFilter("ALL");
              }}
              className="h-7 text-xs text-stone-500 hover:text-stone-900 px-2"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Calls Table Card */}
      <Card className="overflow-hidden border-stone-200 bg-white shadow-2xs">
        <CardHeader className="p-3.5 border-b border-stone-100 bg-stone-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
              <span>Autonomous Voice Logs</span>
              <span className="text-[10px] font-mono text-stone-400 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                {filteredCalls.length} calls
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 mt-0.5">
              Select any call to stream audio, review verified BANT turns, or trigger broker takeover.
            </CardDescription>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50/70 hover:bg-stone-50/70 border-b border-stone-200 text-xs">
                <TableHead className="font-semibold text-stone-700 py-2.5">
                  Prospect & Property
                </TableHead>
                <TableHead className="font-semibold text-stone-700 py-2.5">
                  Score
                </TableHead>
                <TableHead className="font-semibold text-stone-700 py-2.5">
                  Outcome
                </TableHead>
                <TableHead className="font-semibold text-stone-700 py-2.5">
                  Duration & Ratio
                </TableHead>
                <TableHead className="font-semibold text-stone-700 py-2.5">
                  Recording State
                </TableHead>
                <TableHead className="font-semibold text-stone-700 py-2.5">
                  Structured Summary
                </TableHead>
                <TableHead className="font-semibold text-stone-700 py-2.5 text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredCalls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-stone-500">
                    No voice calls found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCalls.map((call) => {
                  const isSelected = selectedCallId === call.id;

                  return (
                    <TableRow
                      key={call.id}
                      onClick={() => onSelectCall(call)}
                      className={cn(
                        "cursor-pointer transition-colors text-xs border-b border-stone-100",
                        isSelected
                          ? "bg-stone-100/80 font-medium border-l-3 border-l-[#0d4a36]"
                          : "hover:bg-stone-50/80"
                      )}
                    >
                      {/* Prospect & Property */}
                      <TableCell className="py-2.5 max-w-[180px]">
                        <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                          <span>{call.leadName}</span>
                          {call.isEscalated && (
                            <span
                              title="Human takeover initiated"
                              className="h-1.5 w-1.5 rounded-full bg-rose-500"
                            />
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 truncate">
                          {call.propertyTitle}
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {call.relativeTime}
                        </span>
                      </TableCell>

                      {/* Lead Score */}
                      <TableCell className="py-2.5 whitespace-nowrap">
                        <ScoreIndicator score={call.score} category={call.scoreCategory} variant="badge" />
                      </TableCell>

                      {/* Outcome Badge */}
                      <TableCell className="py-2.5 whitespace-nowrap">
                        <CallOutcomeBadge outcome={call.outcome} size="sm" />
                      </TableCell>

                      {/* Duration & Talk Ratio */}
                      <TableCell className="py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-stone-700 font-mono">
                          <Clock className="h-3 w-3 text-stone-400" />
                          <span>{call.metrics?.durationFormatted || "0m 0s"}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          P: {call.metrics?.talkRatio?.prospectPercent ?? 50}% | AI: {call.metrics?.talkRatio?.aiPercent ?? 50}%
                        </div>
                      </TableCell>

                      {/* Recording State */}
                      <TableCell className="py-2.5 whitespace-nowrap">
                        <CallRecordingBadge state={call.recordingState} size="sm" />
                      </TableCell>

                      {/* Structured Summary Teaser */}
                      <TableCell className="py-2.5 max-w-[200px] lg:max-w-[260px]">
                        <p
                          className="truncate text-xs text-stone-600 font-normal"
                          title={call.summary?.synthesis || "Synthesis pending"}
                        >
                          {call.summary?.synthesis || (
                            <span className="italic text-stone-400">Synthesis pending...</span>
                          )}
                        </p>
                      </TableCell>

                      {/* Action: Open button with icon */}
                      <TableCell className="py-2.5 text-right whitespace-nowrap">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCall(call);
                          }}
                          className={cn(
                            "h-7 text-xs gap-1.5 px-2.5 transition-all shadow-2xs cursor-pointer",
                            isSelected
                              ? "bg-[#0d4a36] text-white hover:bg-[#093829]"
                              : "text-stone-700 hover:text-stone-900 bg-white"
                          )}
                        >
                          <PanelRightOpen className={cn("h-3.5 w-3.5", isSelected ? "text-white/80" : "text-stone-500")} />
                          <span>{isSelected ? "Inspecting" : "Open"}</span>
                          <ChevronRight className={cn("h-3 w-3", isSelected ? "text-white/70" : "opacity-50")} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
