"use client";

import * as React from "react";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Appointment, AppointmentStatus } from "../types";
import {
  CalendarDays,
  MapPin,
  Building2,
  User,
  Clock,
  Video,
  Copy,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

function formatLabel(meetingType: Appointment["meetingType"]): string {
  if (meetingType === "virtual_tour") return "Live video walkthrough";
  if (meetingType === "vip_private_showing") return "Private VIP showing";
  if (meetingType === "office_consultation") return "Office briefing";
  return "In-person walkthrough";
}

function providerLabel(provider?: Appointment["calendarProvider"]): string {
  if (provider === "google_calendar") return "Google Calendar";
  if (provider === "outlook") return "Outlook";
  if (provider === "cal_com") return "Cal.com";
  return "Spacia calendar";
}

function referenceFor(appointment: Appointment): string {
  return (
    appointment.referenceCode ||
    `SP-BK-${appointment.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`
  );
}

export function isTerminalStatus(status: AppointmentStatus): boolean {
  return status === "completed" || status === "cancelled" || status === "no_show";
}

interface CancelViewingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onConfirm: (reason: string) => Promise<void>;
}

export function CancelViewingDialog({
  open,
  onOpenChange,
  appointment,
  onConfirm,
}: CancelViewingDialogProps) {
  const [reason, setReason] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("Add a reason before cancelling.");
      return;
    }
    setIsSaving(true);
    try {
      await onConfirm(trimmed);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "The cancellation was not saved.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-stone-200 bg-white">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-stone-900">Cancel this viewing?</DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            {appointment
              ? `${appointment.propertyTitle} with ${appointment.leadName} will be taken off the schedule.`
              : "This viewing will be taken off the schedule."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-700" htmlFor="cancel-reason">
            Reason
          </label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Client asked to cancel, broker unavailable, property withdrawn..."
            className="min-h-[72px] border-stone-200 bg-white text-xs"
          />
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="h-8 border-stone-200 bg-white text-xs text-stone-700"
          >
            Keep viewing
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isSaving || reason.trim().length === 0}
            className="h-8 bg-rose-600 text-xs text-white hover:bg-rose-700"
          >
            {isSaving ? "Cancelling..." : "Cancel viewing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AppointmentDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  isUpdating?: boolean;
  onStatusChange: (id: string, status: AppointmentStatus, reason?: string) => Promise<void>;
  onReschedule: (appointment: Appointment) => void;
  onViewConfirmation: (appointment: Appointment) => void;
}

export function AppointmentDetailDrawer({
  open,
  onOpenChange,
  appointment,
  isUpdating = false,
  onStatusChange,
  onReschedule,
  onViewConfirmation,
}: AppointmentDetailDrawerProps) {
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const start = appointment ? new Date(appointment.startTime) : null;
  const end = appointment ? new Date(appointment.endTime) : null;
  const dateLabel = start
    ? start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "";
  const timeLabel =
    start && end
      ? `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "";
  const reference = appointment ? referenceFor(appointment) : "";
  const terminal = appointment ? isTerminalStatus(appointment.status) : true;

  const runStatus = async (status: AppointmentStatus, reason?: string) => {
    if (!appointment) return;
    try {
      await onStatusChange(appointment.id, status, reason);
    } catch (err) {
      const message = err instanceof Error ? err.message : "The status was not saved.";
      toast.error(message);
    }
  };

  return (
    <>
      <DetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        maxWidth="md"
        title={appointment?.propertyTitle || "Viewing"}
        description={appointment ? `${appointment.leadName} · #${reference}` : undefined}
        icon={<CalendarDays className="h-4 w-4" />}
        badge={
          appointment ? (
            <StatusBadge
              status={appointment.status}
              label={appointment.status === "no_show" ? "No-show" : undefined}
              withDot
              size="xs"
            />
          ) : null
        }
        footer={
          appointment && !terminal ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {appointment.status === "scheduled" && (
                <Button
                  type="button"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => runStatus("confirmed")}
                  className="h-8 bg-[#0d4a36] text-xs text-white hover:bg-[#0a3829]"
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Confirm
                </Button>
              )}
              {(appointment.status === "confirmed" || appointment.status === "in_progress") && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUpdating}
                    onClick={() => onReschedule(appointment)}
                    className="h-8 border-stone-200 bg-white text-xs text-stone-700"
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Reschedule
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUpdating}
                    onClick={() => runStatus("no_show")}
                    className="h-8 border-stone-200 bg-white text-xs text-stone-700"
                  >
                    No-show
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUpdating}
                    onClick={() => runStatus("completed")}
                    className="h-8 border-stone-200 bg-white text-xs text-stone-700"
                  >
                    Mark completed
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUpdating}
                    onClick={() => setCancelOpen(true)}
                    className="h-8 border-rose-200 bg-white text-xs text-rose-700 hover:bg-rose-50"
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-stone-400">This viewing can no longer be changed.</p>
          )
        }
      >
        {appointment && (
          <div className="space-y-4 p-4">
            <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
              <div className="flex items-center gap-3 px-3.5 py-3">
                {appointment.propertyImage ? (
                  <img
                    src={appointment.propertyImage}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-md border border-stone-200 object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-stone-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-stone-900">{appointment.propertyTitle}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-stone-500">
                    <MapPin className="h-3 w-3 shrink-0 text-stone-400" />
                    {appointment.location}
                  </p>
                </div>
                {appointment.propertyPrice && (
                  <span className="shrink-0 rounded-md border border-emerald-200/70 bg-emerald-50/70 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800">
                    {appointment.propertyPrice}
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-2 border-t border-stone-100">
                <div className="border-r border-stone-100 px-3.5 py-3">
                  <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">
                    <CalendarDays className="h-3 w-3" />
                    Date
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-stone-900">{dateLabel}</dd>
                </div>
                <div className="px-3.5 py-3">
                  <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">
                    <Clock className="h-3 w-3" />
                    Time
                  </dt>
                  <dd className="mt-1 font-mono text-xs font-semibold text-stone-900 tabular-nums">{timeLabel}</dd>
                </div>
                <div className="border-r border-t border-stone-100 px-3.5 py-3">
                  <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">
                    <User className="h-3 w-3" />
                    Client
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-stone-900">{appointment.leadName}</dd>
                  {appointment.leadPhone && (
                    <dd className="font-mono text-[11px] text-stone-500 tabular-nums">{appointment.leadPhone}</dd>
                  )}
                </div>
                <div className="border-t border-stone-100 px-3.5 py-3">
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Host</dt>
                  <dd className="mt-1 text-xs font-semibold text-stone-900">{appointment.assignedBrokerName}</dd>
                  <dd className="mt-0.5 text-[11px] text-stone-500">{formatLabel(appointment.meetingType)}</dd>
                </div>
              </dl>
              {appointment.meetingUrl && (
                <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">
                      <Video className="h-3 w-3" />
                      Meet
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-stone-500">{appointment.meetingUrl}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50/60 px-3.5 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Calendar</p>
              <p className="mt-1 text-xs font-medium text-stone-800">{providerLabel(appointment.calendarProvider)}</p>
              <p className="mt-0.5 font-mono text-[11px] text-stone-500">#{reference}</p>
            </div>

            {appointment.notes && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Notes</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-700">{appointment.notes}</p>
              </div>
            )}

            {appointment.cancelledReason && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Cancellation reason</p>
                <p className="mt-1 text-xs text-stone-700">{appointment.cancelledReason}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onViewConfirmation(appointment)}
                className="h-7 border-stone-200 bg-white px-2.5 text-[11px] text-stone-700"
              >
                Confirmation
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const summary = appointment.shareableSummary || `${appointment.propertyTitle}\n${dateLabel} ${timeLabel}\n${appointment.leadName}\n#${reference}`;
                  navigator.clipboard.writeText(summary).then(
                    () => toast.success("Summary copied."),
                    () => toast.error("Could not copy the summary.")
                  );
                }}
                className="h-7 gap-1 border-stone-200 bg-white px-2.5 text-[11px] text-stone-700"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
          </div>
        )}
      </DetailDrawer>

      <CancelViewingDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        appointment={appointment}
        onConfirm={async (reason) => {
          if (!appointment) return;
          await onStatusChange(appointment.id, "cancelled", reason);
        }}
      />
    </>
  );
}
