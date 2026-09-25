"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AttentionItem, AttentionCategory } from "../types";
import {
  AlertTriangle,
  Flame,
  Calendar,
  Clock,
  ArrowRight,
  Phone,
  Building2,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AttentionCockpitProps {
  items: AttentionItem[];
  onInspectLead?: (leadId: string) => void;
}

export function AttentionCockpit({ items, onInspectLead }: AttentionCockpitProps) {
  const [filter, setFilter] = React.useState<"all" | AttentionCategory>("all");

  const filteredItems = React.useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  const criticalCount = items.filter((i) => i.severity === "critical").length;
  const highCount = items.filter((i) => i.severity === "high").length;

  return (
    <Card className="bg-white border-border shadow-xs overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-stone-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="font-display text-base font-bold text-stone-900">
                What Requires Attention?
              </CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px] font-semibold px-2 py-0.5 border shadow-2xs",
                  criticalCount > 0
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {items.length} Actions Required
                {criticalCount > 0 && ` (${criticalCount} Critical)`}
              </Badge>
            </div>
            <CardDescription className="text-xs text-stone-500">
              Prioritized operational cockpit: urgent human takeovers, hot unbooked prospects & today&apos;s inspections.
            </CardDescription>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium text-xs transition-colors shrink-0 cursor-pointer",
                filter === "all"
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              )}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("urgent_handoff")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium text-xs transition-colors shrink-0 cursor-pointer",
                filter === "urgent_handoff"
                  ? "bg-rose-700 text-white shadow-2xs"
                  : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
              )}
            >
              Handoffs ({items.filter((i) => i.category === "urgent_handoff").length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("hot_unbooked")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium text-xs transition-colors shrink-0 cursor-pointer",
                filter === "hot_unbooked"
                  ? "bg-amber-700 text-white shadow-2xs"
                  : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
              )}
            >
              Hot Unbooked ({items.filter((i) => i.category === "hot_unbooked").length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("viewing_today")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium text-xs transition-colors shrink-0 cursor-pointer",
                filter === "viewing_today"
                  ? "bg-indigo-700 text-white shadow-2xs"
                  : "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
              )}
            >
              Today ({items.filter((i) => i.category === "viewing_today").length})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center bg-stone-50/50 rounded-lg border border-dashed border-stone-200">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-900">All Clear</p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              No outstanding items requiring attention under this category. Autonomous operations running smoothly.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const isCritical = item.severity === "critical";
              const isHandoff = item.category === "urgent_handoff";
              const isHot = item.category === "hot_unbooked";
              const isViewingToday = item.category === "viewing_today";

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col justify-between p-3.5 rounded-lg border transition-all hover:shadow-xs",
                    isCritical
                      ? "bg-rose-50/40 border-rose-200/90 border-l-4 border-l-rose-600"
                      : isHot
                      ? "bg-amber-50/30 border-amber-200/90 border-l-4 border-l-amber-600"
                      : isViewingToday
                      ? "bg-indigo-50/30 border-indigo-200/90 border-l-4 border-l-indigo-600"
                      : "bg-stone-50/50 border-stone-200 border-l-4 border-l-stone-400"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {isCritical && <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                        {isHot && <Flame className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                        {isViewingToday && <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                        {!isCritical && !isHot && !isViewingToday && <Clock className="h-3.5 w-3.5 text-stone-500 shrink-0" />}
                        
                        <span
                          className={cn(
                            "text-[10px] font-bold tracking-wider uppercase",
                            isCritical ? "text-rose-700" : isHot ? "text-amber-800" : isViewingToday ? "text-indigo-800" : "text-stone-600"
                          )}
                        >
                          {isHandoff
                            ? "Human Takeover"
                            : isHot
                            ? "Hot Prospect"
                            : isViewingToday
                            ? "Inspection Today"
                            : "Follow-up Due"}
                        </span>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] px-1.5 py-0 font-bold uppercase",
                          isCritical
                            ? "bg-rose-100/80 text-rose-800 border-rose-300"
                            : "bg-amber-100/70 text-amber-800 border-amber-200"
                        )}
                      >
                        {item.severity}
                      </Badge>
                    </div>

                    <h4 className="font-semibold text-xs text-stone-900 line-clamp-1">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {(item.leadName || item.propertyTitle) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-stone-500 font-medium">
                        {item.leadPhone && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-stone-600 bg-white/80 px-1.5 py-0.5 rounded border border-stone-200/60">
                            <Phone className="h-2.5 w-2.5 text-stone-400" />
                            {item.leadPhone}
                          </span>
                        )}
                        {item.propertyTitle && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-stone-600 truncate max-w-[160px]">
                            <Building2 className="h-2.5 w-2.5 text-stone-400 shrink-0" />
                            <span className="truncate">{item.propertyTitle}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-2 border-t border-stone-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>

                    {item.leadId && onInspectLead ? (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onInspectLead(item.leadId!)}
                        className={cn(
                          "h-6 text-[11px] px-2 gap-1 font-medium shadow-2xs cursor-pointer",
                          isCritical
                            ? "bg-rose-700 hover:bg-rose-800 text-white"
                            : isHot
                            ? "bg-stone-900 hover:bg-black text-white"
                            : "bg-indigo-700 hover:bg-indigo-800 text-white"
                        )}
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Link href={item.actionUrl}>
                        <Button
                          size="sm"
                          variant="default"
                          className={cn(
                            "h-6 text-[11px] px-2 gap-1 font-medium shadow-2xs cursor-pointer",
                            isCritical
                              ? "bg-rose-700 hover:bg-rose-800 text-white"
                              : isHot
                              ? "bg-stone-900 hover:bg-black text-white"
                              : "bg-indigo-700 hover:bg-indigo-800 text-white"
                          )}
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
