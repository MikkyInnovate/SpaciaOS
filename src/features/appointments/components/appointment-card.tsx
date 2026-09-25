"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Appointment } from "../types";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  Key,
  CheckCircle2,
  XCircle,
  QrCode,
  Sparkles,
  Phone,
  Building2,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange?: (id: string, newStatus: any) => void;
  onViewGatePass?: (appointment: Appointment) => void;
}

export function AppointmentCard({
  appointment,
  onStatusChange,
  onViewGatePass,
}: AppointmentCardProps) {
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = React.useState(false);
  const startDate = new Date(appointment.startTime);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = `${startDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} – ${new Date(appointment.endTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const isToday =
    new Date().toDateString() === startDate.toDateString();

  return (
    <>
      <Card className="border border-stone-200/80 bg-white shadow-2xs transition-all hover:border-stone-300 hover:shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            {/* Header with Date/Time & Status */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-[#0d4a36]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{formattedDate}</span>
                    {isToday && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Today
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formattedTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge
                  status={appointment.status}
                  withDot
                  size="sm"
                />
              </div>
            </div>

            {/* Property Context */}
            <div className="rounded-lg border border-stone-100 bg-stone-50/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-stone-500">
                    <Building2 className="h-3.5 w-3.5 text-[#0d4a36]" />
                    <span>Property for Inspection</span>
                  </div>
                  <div className="mt-0.5 truncate font-semibold text-stone-900">
                    {appointment.propertyTitle}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                    <span className="truncate">{appointment.location}</span>
                  </div>
                </div>

                {appointment.propertyPrice && (
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-stone-400">Price</div>
                    <div className="font-mono text-sm font-bold text-emerald-800">
                      {appointment.propertyPrice}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attendee Info: Lead & Broker */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* Prospect / Buyer */}
              <div className="flex items-center justify-between rounded-md border border-stone-200/60 bg-white p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-stone-900">
                      {appointment.leadName}
                    </div>
                    <div className="truncate text-[11px] text-stone-500">
                      {appointment.leadPhone}
                    </div>
                  </div>
                </div>
                {appointment.leadScoreCategory && (
                  <Badge
                    className={cn(
                      "text-[10px] px-1.5 py-0 shrink-0",
                      appointment.leadScoreCategory === "HOT"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {appointment.leadScoreCategory} ({appointment.leadScore})
                  </Badge>
                )}
              </div>

              {/* Assigned Broker */}
              <div className="flex items-center gap-2 rounded-md border border-stone-200/60 bg-white p-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-medium text-stone-400">Assigned Broker</div>
                  <div className="truncate text-xs font-semibold text-stone-900">
                    {appointment.assignedBrokerName}
                  </div>
                </div>
              </div>
            </div>

            {/* Gate Pass & Notes Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
              {appointment.gatePassCode ? (
                <button
                  type="button"
                  onClick={() => onViewGatePass?.(appointment)}
                  className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
                >
                  <Key className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Gate Pass: <strong>{appointment.gatePassCode}</strong></span>
                  <QrCode className="h-3.5 w-3.5 text-emerald-600 ml-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onViewGatePass?.(appointment)}
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-emerald-700"
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>Generate Security Gate Pass</span>
                </button>
              )}

              {/* Quick Action Controls */}
              <div className="flex items-center gap-1.5">
                {appointment.status === "scheduled" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => {
                      onStatusChange?.(appointment.id, "confirmed");
                      toast.success(`Viewing with ${appointment.leadName} confirmed`);
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Confirm
                  </Button>
                )}
                {appointment.status === "confirmed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-stone-600 hover:bg-stone-100"
                    onClick={() => {
                      onStatusChange?.(appointment.id, "completed");
                      toast.success("Viewing marked as completed");
                    }}
                  >
                    Mark Completed
                  </Button>
                )}
                {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => setIsCancelConfirmOpen(true)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog before cancelling */}
      <ConfirmDialog
        open={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        title="Cancel Viewing Appointment?"
        description={`Are you sure you want to cancel the inspection for "${appointment.propertyTitle}" with ${appointment.leadName}? This will notify the client and release the calendar slot.`}
        confirmText="Yes, Cancel Appointment"
        cancelText="Keep Appointment"
        variant="destructive"
        onConfirm={() => {
          onStatusChange?.(appointment.id, "cancelled");
          toast.info("Viewing appointment cancelled");
        }}
      />
    </>
  );
}
