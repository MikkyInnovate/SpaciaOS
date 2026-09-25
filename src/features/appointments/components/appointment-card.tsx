"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Appointment, AppointmentStatus } from "../types";
import { CancelViewingDialog } from "./appointment-detail-drawer";
import {
  CalendarDays,
  MapPin,
  User,
  ShieldCheck,
  CheckCircle2,
  Share2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

interface AppointmentCardProps {
  appointment: Appointment;
  isUpdating?: boolean;
  onOpen?: (appointment: Appointment) => void;
  onStatusChange?: (id: string, newStatus: AppointmentStatus, reason?: string) => Promise<void> | void;
  onViewConfirmation?: (appointment: Appointment) => void;
}

export function AppointmentCard({
  appointment,
  isUpdating = false,
  onOpen,
  onStatusChange,
  onViewConfirmation,
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

  const handleCopyWhatsAppInvite = () => {
    const text = `🏡 *Property Inspection Confirmation — Spacia*\n\n` +
      `*Client:* ${appointment.leadName}\n` +
      `*Property:* ${appointment.propertyTitle}\n` +
      `*Date:* ${formattedDate}\n` +
      `*Time:* ${formattedTime}\n` +
      `*Meeting Location:* ${appointment.location}\n` +
      `*Assigned Broker:* ${appointment.assignedBrokerName}\n\n` +
      `Please let us know if you require directions before arrival.`;
    
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success("WhatsApp inspection invite copied to clipboard!");
    }
  };

  return (
    <>
      <Card
        className="cursor-pointer border border-stone-200/80 bg-white shadow-2xs transition-all hover:border-stone-300 hover:shadow-sm"
        onClick={() => onOpen?.(appointment)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Top Row: Date & Time, Status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-[#0d4a36]">
                <CalendarDays className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs text-stone-900">{formattedDate}</span>
                <span className="text-[11px] text-stone-500">• {formattedTime}</span>
                {isToday && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
                    Today
                  </Badge>
                )}
              </div>
            </div>

            <StatusBadge
              status={
                appointment.status === "cancelled" && appointment.cancelledReason === "Rescheduled"
                  ? "Rescheduled"
                  : appointment.status
              }
              label={
                appointment.status === "no_show"
                  ? "No-show"
                  : appointment.status === "rescheduled" ||
                    (appointment.status === "cancelled" && appointment.cancelledReason === "Rescheduled")
                  ? "Rescheduled"
                  : undefined
              }
              withDot
              size="xs"
            />
          </div>

          {/* Middle Row: Property & Price */}
          <div className="flex items-start justify-between gap-3 border-t border-stone-100 pt-2.5">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-stone-900 truncate">
                {appointment.propertyTitle}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-500 truncate">
                <MapPin className="h-3 w-3 shrink-0 text-stone-400" />
                <span className="truncate">{appointment.location}</span>
              </div>
            </div>

            {appointment.propertyPrice && (
              <span className="shrink-0 font-mono text-xs font-bold text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                {appointment.propertyPrice}
              </span>
            )}
          </div>

          {/* People Row: Client & Assigned Broker */}
          <div className="flex items-center justify-between gap-2 text-xs border-t border-stone-100 pt-2.5">
            {/* Client */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
                <User className="h-3 w-3" />
              </div>
              <div className="min-w-0 truncate">
                <span className="font-medium text-stone-900 text-xs">{appointment.leadName}</span>
                <span className="text-[11px] text-stone-400 ml-1.5">{appointment.leadPhone}</span>
              </div>
              {appointment.leadScoreCategory && (
                <span
                  className={cn(
                    "text-[9px] font-semibold px-1 rounded shrink-0 border",
                    appointment.leadScoreCategory === "HOT"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  )}
                >
                  {appointment.leadScoreCategory}
                </span>
              )}
            </div>

            {/* Broker */}
            <div className="flex items-center gap-1 text-[11px] text-stone-500 shrink-0 border-l border-stone-200/60 pl-2">
              <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[130px] font-medium text-stone-700">
                {appointment.assignedBrokerName.split(" ")[0]} (Host)
              </span>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-stone-100 pt-2.5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyWhatsAppInvite}
                className="flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 transition cursor-pointer"
              >
                <Share2 className="h-3 w-3 text-stone-400" />
                <span>WhatsApp Invite</span>
              </button>

              <button
                type="button"
                onClick={() => onViewConfirmation?.(appointment)}
                className="flex items-center gap-1 text-[11px] font-medium text-[#0d4a36] hover:text-[#093829] transition cursor-pointer"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Confirmation</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {appointment.status === "scheduled" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUpdating}
                  className="h-6.5 text-[11px] text-emerald-700 border-emerald-200 hover:bg-emerald-50 px-2 cursor-pointer"
                  onClick={() => {
                    Promise.resolve(onStatusChange?.(appointment.id, "confirmed")).catch((err: unknown) => {
                      toast.error(err instanceof Error ? err.message : "The status was not saved.");
                    });
                  }}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Confirm
                </Button>
              )}
              {appointment.status === "confirmed" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUpdating}
                  className="h-6.5 text-[11px] text-stone-600 hover:bg-stone-100 px-2 cursor-pointer"
                  onClick={() => {
                    Promise.resolve(onStatusChange?.(appointment.id, "completed")).catch((err: unknown) => {
                      toast.error(err instanceof Error ? err.message : "The status was not saved.");
                    });
                  }}
                >
                  Mark Completed
                </Button>
              )}
              {appointment.status !== "cancelled" && appointment.status !== "completed" && appointment.status !== "no_show" && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isUpdating}
                  className="h-6.5 text-[11px] text-stone-400 hover:text-rose-600 hover:bg-rose-50 px-1.5 cursor-pointer"
                  onClick={() => setIsCancelConfirmOpen(true)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog before cancelling */}
      <CancelViewingDialog
        open={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        appointment={appointment}
        onConfirm={async (reason) => {
          await onStatusChange?.(appointment.id, "cancelled", reason);
        }}
      />
    </>
  );
}
