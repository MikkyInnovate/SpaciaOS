"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardFeedItem } from "../types";
import {
  PhoneCall,
  CalendarCheck,
  Send,
  UserPlus,
  CheckCircle2,
  ShieldAlert,
  Clock,
  ExternalLink,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface OperationsActivityFeedProps {
  feed: DashboardFeedItem[];
  onInspectLead?: (leadId: string) => void;
}

export function OperationsActivityFeed({
  feed,
  onInspectLead,
}: OperationsActivityFeedProps) {
  const [filter, setFilter] = React.useState<"all" | "calls" | "viewings" | "notifications">("all");

  const filteredFeed = React.useMemo(() => {
    if (filter === "all") return feed;
    if (filter === "calls") return feed.filter((f) => f.type === "call_completed");
    if (filter === "viewings") return feed.filter((f) => f.type === "viewing_booked");
    if (filter === "notifications") return feed.filter((f) => f.type === "notification_sent");
    return feed;
  }, [feed, filter]);

  const formatRelativeTime = (timestamp: string) => {
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return timestamp;
    }
  };

  const getEventMeta = (type: DashboardFeedItem["type"]) => {
    switch (type) {
      case "call_completed":
        return {
          icon: PhoneCall,
          color: "text-indigo-600 bg-indigo-50 border-indigo-200",
          badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
          label: "VOICE CALL",
        };
      case "viewing_booked":
        return {
          icon: CalendarCheck,
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
          label: "INSPECTION BOOKED",
        };
      case "notification_sent":
        return {
          icon: Send,
          color: "text-sky-600 bg-sky-50 border-sky-200",
          badge: "bg-sky-50 text-sky-700 border-sky-200",
          label: "RESEND DISPATCH",
        };
      case "human_takeover":
        return {
          icon: ShieldAlert,
          color: "text-rose-600 bg-rose-50 border-rose-200",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          label: "HUMAN TAKEOVER",
        };
      case "lead_qualified":
        return {
          icon: CheckCircle2,
          color: "text-[#0d4a36] bg-emerald-50 border-emerald-200",
          badge: "bg-emerald-50 text-[#0d4a36] border-emerald-200",
          label: "BANT QUALIFIED",
        };
      case "lead_captured":
      default:
        return {
          icon: UserPlus,
          color: "text-amber-600 bg-amber-50 border-amber-200",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          label: "LEAD CAPTURED",
        };
    }
  };

  return (
    <Card className="bg-white border-border shadow-xs">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-stone-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                <Activity className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="font-display text-base font-bold text-stone-900">
                What Happened Today?
              </CardTitle>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live Feed
              </span>
            </div>
            <CardDescription className="text-xs text-stone-500">
              Chronological unified audit log of inbound calls, viewings, notifications & agent handoffs.
            </CardDescription>
          </div>

          {/* Feed Filter Buttons */}
          <div className="flex items-center gap-1 text-xs">
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
              All ({feed.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("calls")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium text-xs transition-colors shrink-0 cursor-pointer",
                filter === "calls"
                  ? "bg-indigo-700 text-white shadow-2xs"
                  : "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
              )}
            >
              Calls
            </button>
            <button
              type="button"
              onClick={() => setFilter("viewings")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium text-xs transition-colors shrink-0 cursor-pointer",
                filter === "viewings"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
              )}
            >
              Viewings
            </button>
            <button
              type="button"
              onClick={() => setFilter("notifications")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium text-xs transition-colors shrink-0 cursor-pointer",
                filter === "notifications"
                  ? "bg-sky-700 text-white shadow-2xs"
                  : "bg-white text-sky-700 border border-sky-200 hover:bg-sky-50"
              )}
            >
              Emails
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 divide-y divide-stone-100">
        {filteredFeed.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            No events found for this filter today.
          </div>
        ) : (
          filteredFeed.map((item) => {
            const meta = getEventMeta(item.type);
            const Icon = meta.icon;

            return (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border shadow-2xs shrink-0 mt-0.5",
                    meta.color
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-xs text-stone-900 truncate">
                        {item.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] px-1.5 py-0 font-bold uppercase", meta.badge)}
                      >
                        {item.badge || meta.label}
                      </Badge>
                    </div>

                    <span className="flex items-center gap-1 text-[11px] text-stone-400 font-mono shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  {(item.leadName || item.propertyTitle) && (
                    <div className="flex items-center gap-2 pt-0.5 text-[11px] text-stone-500 font-medium">
                      {item.leadName && (
                        <span>
                          Lead: <strong className="text-stone-700">{item.leadName}</strong>
                        </span>
                      )}
                      {item.propertyTitle && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.propertyTitle}</span>
                        </>
                      )}
                      {item.leadId && onInspectLead && (
                        <button
                          type="button"
                          onClick={() => onInspectLead(item.leadId!)}
                          className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-semibold text-stone-700 hover:text-black cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div className="pt-3 flex items-center justify-between gap-2">
          <Link href="/calls" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 text-stone-700">
              <PhoneCall className="h-3.5 w-3.5 text-stone-400" />
              <span>Call Records</span>
            </Button>
          </Link>
          <Link href="/appointments" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 text-stone-700">
              <CalendarCheck className="h-3.5 w-3.5 text-stone-400" />
              <span>Inspection Calendar</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
