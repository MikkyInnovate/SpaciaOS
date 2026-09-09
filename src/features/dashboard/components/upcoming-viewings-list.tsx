import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardViewing } from "../types";
import { CalendarDays, Clock, UserCheck, ChevronRight } from "lucide-react";

export interface UpcomingViewingsListProps {
  viewings: DashboardViewing[];
}

export function UpcomingViewingsList({ viewings }: UpcomingViewingsListProps) {
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
          <span className="text-xs text-stone-500 font-medium">
            6 Booked
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 divide-y divide-border/60">
        {viewings.map((viewing) => (
          <div key={viewing.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-stone-900 text-xs">
                  {viewing.prospectName}
                </h4>
                <p className="text-[11px] text-stone-500 font-medium">
                  {viewing.propertyTitle}
                </p>
              </div>
              {viewing.status === "Confirmed" && (
                <Badge variant="qualified" className="text-[10px] px-2 py-0.5 font-semibold">
                  {viewing.status}
                </Badge>
              )}
              {viewing.status === "Scheduled" && (
                <Badge variant="viewing" className="text-[10px] px-2 py-0.5 font-semibold">
                  {viewing.status}
                </Badge>
              )}
              {viewing.status === "Pending" && (
                <Badge variant="contacting" className="text-[10px] px-2 py-0.5 font-semibold">
                  {viewing.status}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-stone-600 bg-stone-50/70 p-2 rounded-md border border-stone-200/70">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-stone-400" />
                <span className="font-medium text-stone-800">
                  {viewing.date} • {viewing.time}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-stone-500">
                <UserCheck className="h-3 w-3 text-stone-500" />
                <span className="truncate">{viewing.agentName}</span>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-3">
          <Button variant="outline" size="sm" className="w-full text-xs gap-1 text-stone-700">
            <span>View Connected Calendars</span>
            <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
