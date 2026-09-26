import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardViewing } from "../types";
import { CalendarDays, Clock, UserCheck, ChevronRight } from "lucide-react";

export interface UpcomingViewingsListProps {
  viewings: DashboardViewing[];
  isLoading?: boolean;
  limit?: number;
}

const DEFAULT_LIMIT = 6;

export function UpcomingViewingsList({
  viewings,
  isLoading = false,
  limit = DEFAULT_LIMIT,
}: UpcomingViewingsListProps) {
  const visibleViewings = React.useMemo(() => {
    return viewings.slice(0, limit);
  }, [viewings, limit]);

  return (
    <Card className="bg-white border-border shadow-2xs">
      <CardHeader className="p-4 pb-3 border-b border-border bg-stone-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-stone-700 border border-stone-200/60">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            </div>
            <CardTitle className="font-display text-base font-bold text-stone-900">
              Confirmed Viewings
            </CardTitle>
          </div>

          <div className="flex items-center gap-2.5">
            {isLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <span className="text-xs text-stone-500 font-medium">
                {viewings.length} Booked
              </span>
            )}

            <Button asChild variant="outline" size="sm" className="h-7.5 px-2.5 text-xs text-stone-700 bg-white shadow-2xs hover:bg-stone-50">
              <Link href="/appointments">
                <span>View Full Schedule</span>
                <ChevronRight className="h-3 w-3 text-stone-400 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`viewing-skeleton-${i}`}
                className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/40 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            ))}
          </div>
        ) : viewings.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            No confirmed viewings scheduled for this period.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleViewings.map((viewing) => (
              <div
                key={viewing.id}
                className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/40 hover:bg-stone-50/80 transition-colors space-y-2.5 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-stone-900 text-xs truncate">
                      {viewing.prospectName}
                    </h4>
                    <p className="text-[11px] text-stone-500 font-medium truncate">
                      {viewing.propertyTitle}
                    </p>
                  </div>
                  {viewing.status === "Confirmed" && (
                    <Badge variant="qualified" className="text-[10px] px-2 py-0.5 font-semibold shrink-0">
                      {viewing.status}
                    </Badge>
                  )}
                  {viewing.status === "Scheduled" && (
                    <Badge variant="viewing" className="text-[10px] px-2 py-0.5 font-semibold shrink-0">
                      {viewing.status}
                    </Badge>
                  )}
                  {viewing.status === "Pending" && (
                    <Badge variant="contacting" className="text-[10px] px-2 py-0.5 font-semibold shrink-0">
                      {viewing.status}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-stone-600 bg-white p-2 rounded-md border border-stone-200/60 shadow-2xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Clock className="h-3 w-3 text-stone-400 shrink-0" />
                    <span className="font-medium text-stone-800 text-[11px] truncate">
                      {viewing.date} • {viewing.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500 shrink-0">
                    <UserCheck className="h-3 w-3 text-stone-500" />
                    <span className="truncate max-w-[90px]">{viewing.agentName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3">
          <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5 text-stone-700 hover:bg-stone-50 bg-white shadow-2xs cursor-pointer">
            <Link href="/appointments" className="flex items-center justify-center gap-1">
              <span>
                {viewings.length > limit
                  ? `View All ${viewings.length} Upcoming Appointments & Full Calendar`
                  : "View Connected Calendars & Full Schedule"}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
