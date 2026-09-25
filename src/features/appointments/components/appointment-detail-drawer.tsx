"use client";

import * as React from "react";
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
  Mail,
  Bell,
  BellRing,
  Loader2,
  CalendarX,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { appointmentsService } from "../services/appointments-service";
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

const QUICK_CANCELLATION_REASONS = [
  "Client requested cancellation",
  "Broker scheduling conflict",
  "Property unavailable / off-market",
  "Client unresponsive",
  "Weather / access delay",
];

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
      toast.error("Add a cancellation reason before proceeding.");
      return;
    }
    setIsSaving(true);
    try {
      await onConfirm(trimmed);
      toast.success("Inspection cancelled.");
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "The cancellation was not saved.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const start = appointment ? new Date(appointment.startTime) : null;
  const dateFormatted = start
    ? start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "";
  const timeFormatted = start
    ? start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border border-stone-200/90 bg-white shadow-2xl rounded-2xl">
        <DialogHeader className="border-b border-stone-100 bg-white px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200/70 bg-rose-50/80 text-rose-600">
              <CalendarX className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="text-sm font-semibold text-stone-900 tracking-tight">
                  Cancel Viewing
                </DialogTitle>
                <StatusBadge status="cancelled" label="Cancellation" withDot size="xs" />
              </div>
              <DialogDescription className="mt-0.5 text-xs text-stone-500 leading-relaxed">
                This inspection will be removed from the schedule and AI outreach stopped.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Target Viewing Context Card */}
          {appointment && (
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-stone-900">
                    {appointment.propertyTitle}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-stone-500">
                    <MapPin className="h-3 w-3 shrink-0 text-stone-400" />
                    <span>{appointment.location}</span>
                  </p>
                </div>
                {appointment.propertyPrice && (
                  <span className="shrink-0 rounded-md border border-stone-200 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-stone-700">
                    {appointment.propertyPrice}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 border-t border-stone-200/60 text-[11px] text-stone-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <User className="h-3 w-3 text-stone-400" />
                  <span>{appointment.leadName}</span>
                </div>
                {dateFormatted && (
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <CalendarDays className="h-3 w-3 text-stone-400" />
                    <span>{dateFormatted} at {timeFormatted}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Select Reason Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-stone-700" htmlFor="cancel-reason">
                Reason for Cancellation
              </label>
              <span className="text-[10px] font-medium text-rose-500">Required</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CANCELLATION_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                    reason === preset
                      ? "border-rose-300 bg-rose-50 text-rose-800"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Provide context for the cancellation (e.g. client requested reschedule, broker clash, price negotiation paused)..."
              className="mt-2 min-h-[76px] rounded-lg border-stone-200/90 bg-white text-xs leading-relaxed placeholder:text-stone-400 focus:border-[#0d4a36] focus:ring-1 focus:ring-[#0d4a36] resize-none"
            />
          </div>

          {/* Warning Banner */}
          <div className="flex items-center gap-2 rounded-lg border border-amber-200/70 bg-amber-50/60 p-2.5 text-[11px] text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>Calendar events will be retracted and client outreach paused.</span>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-stone-100 bg-stone-50/70 px-5 py-3 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="h-8 border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900 cursor-pointer shadow-2xs"
          >
            Keep Viewing
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isSaving || reason.trim().length === 0}
            className="h-8 gap-1.5 bg-rose-600 px-3.5 text-xs font-medium text-white hover:bg-rose-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                <span>Cancel Viewing</span>
              </>
            )}
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

  const [isSendingReminder, setIsSendingReminder] = React.useState(false);
  const [reminderHistory, setReminderHistory] = React.useState<string[]>([]);

  const handleSendReminder = async (window: "24h" | "1h") => {
    if (!appointment) return;
    setIsSendingReminder(true);
    try {
      const res = await appointmentsService.sendViewingReminder(appointment.id, window);
      setReminderHistory((prev) => [...prev, `${window} reminder dispatched (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`]);
      toast.success(res.message || `Viewing reminder (${window}) sent.`);
    } catch {
      toast.error("Failed to send viewing reminder.");
    } finally {
      setIsSendingReminder(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border border-stone-200 bg-white p-0 shadow-xl sm:max-w-lg">
        <DialogHeader className="border-b border-stone-100 bg-white px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-[#0d4a36]">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="truncate text-sm font-semibold text-stone-900">
                  {appointment?.propertyTitle || "Viewing"}
                </DialogTitle>
                {appointment && (
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
                )}
              </div>
              <DialogDescription className="mt-1 truncate text-xs text-stone-500">
                {appointment ? `${appointment.leadName} · #${reference}` : "Viewing details"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
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

            {/* Automated Notifications & Reminders */}
            <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#0d4a36]" />
                  <span className="text-xs font-semibold text-stone-800">
                    Notifications & Reminders
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Synced
                </span>
              </div>

              <p className="text-[11px] text-stone-500 leading-relaxed">
                Automated booking confirmation and company AI underwriting alert were delivered. Dispatch timely inspection reminders to the client:
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isSendingReminder}
                  onClick={() => handleSendReminder("24h")}
                  className="h-7 gap-1.5 border-stone-200 bg-white px-2.5 text-[11px] text-stone-700 hover:bg-stone-50 cursor-pointer shadow-2xs"
                >
                  {isSendingReminder ? (
                    <Loader2 className="h-3 w-3 animate-spin text-[#0d4a36]" />
                  ) : (
                    <Bell className="h-3 w-3 text-amber-600" />
                  )}
                  <span>Send 24h Reminder</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isSendingReminder}
                  onClick={() => handleSendReminder("1h")}
                  className="h-7 gap-1.5 border-stone-200 bg-white px-2.5 text-[11px] text-stone-700 hover:bg-stone-50 cursor-pointer shadow-2xs"
                >
                  {isSendingReminder ? (
                    <Loader2 className="h-3 w-3 animate-spin text-[#0d4a36]" />
                  ) : (
                    <BellRing className="h-3 w-3 text-rose-600" />
                  )}
                  <span>Send 1h Urgent Reminder</span>
                </Button>
              </div>

              {reminderHistory.length > 0 && (
                <div className="mt-2 pt-2 border-t border-stone-200/60 space-y-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Recent Dispatches</p>
                  {reminderHistory.map((hist, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] text-emerald-800">
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                      <span>{hist}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
        </div>
        <DialogFooter className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-100 bg-stone-50/70 px-4 py-3 sm:justify-end">
          {appointment && !terminal ? (
            <>
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
            </>
          ) : (
            <p className="text-[11px] text-stone-400">This viewing can no longer be changed.</p>
          )}
        </DialogFooter>
      </DialogContent>
      </Dialog>

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
