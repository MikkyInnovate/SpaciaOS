"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Appointment } from "../types";
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  MapPin,
  Building2,
  User,
  Video,
  Copy,
  ExternalLink,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

interface BookingConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

function formatLabel(meetingType: Appointment["meetingType"]): string {
  if (meetingType === "virtual_tour") return "Live video walkthrough";
  if (meetingType === "vip_private_showing") return "Private VIP showing";
  if (meetingType === "office_consultation") return "Office briefing";
  return "In-person walkthrough";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function BookingConfirmationDialog({
  open,
  onOpenChange,
  appointment,
}: BookingConfirmationDialogProps) {
  const [copied, setCopied] = React.useState(false);

  const startDate = appointment ? new Date(appointment.startTime) : null;
  const endDate = appointment ? new Date(appointment.endTime) : null;

  const formattedDate = startDate
    ? startDate.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const formattedTime =
    startDate && endDate
      ? `${startDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })} – ${endDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "";

  const referenceCode = appointment
    ? appointment.referenceCode ||
      `SP-BK-${appointment.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`
    : "";

  const meetLink = appointment?.meetingUrl || null;

  const confirmationSummary = appointment
    ? appointment.shareableSummary ||
      `Property Inspection Confirmed — Spacia
Reference: #${referenceCode}
Listing: ${appointment.propertyTitle}
Location: ${appointment.location}
Client: ${appointment.leadName}${appointment.leadPhone ? ` (${appointment.leadPhone})` : ""}
Date: ${formattedDate}
Time: ${formattedTime}
Format: ${formatLabel(appointment.meetingType)}
Broker: ${appointment.assignedBrokerName}
${meetLink ? `Google Meet: ${meetLink}\n` : ""}Status: Confirmed. AI outreach stopped.`
    : "";

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(confirmationSummary);
      setCopied(true);
      toast.success("Confirmation summary copied.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy the confirmation.");
    }
  };

  const handleShareWhatsApp = () => {
    if (!appointment) return;
    const encoded = encodeURIComponent(confirmationSummary);
    const phone = appointment.leadPhone.replace(/[^0-9]/g, "");
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAddToCalendar = () => {
    if (!appointment || !startDate || !endDate) return;
    const title = encodeURIComponent(`Inspection: ${appointment.propertyTitle} (${appointment.leadName})`);
    const details = encodeURIComponent(
      `Property inspection with ${appointment.leadName}${appointment.leadPhone ? ` (${appointment.leadPhone})` : ""}.\nBroker: ${appointment.assignedBrokerName}\nLocation: ${appointment.location}${meetLink ? `\nVideo call: ${meetLink}` : ""}`
    );
    const loc = encodeURIComponent(appointment.location);
    const startStr = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${loc}`;
    window.open(gcalUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border border-stone-200 bg-white shadow-xl">
        <DialogHeader className="border-b border-stone-100 bg-white px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-[#0d4a36]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-sm font-semibold text-stone-900">
                  Inspection scheduled
                </DialogTitle>
                <StatusBadge status="confirmed" label="Confirmed" withDot size="xs" />
              </div>
              <DialogDescription className="mt-1 text-[11px] leading-relaxed text-stone-500">
                On the broker schedule. AI outreach for this client is stopped.
              </DialogDescription>
              {referenceCode && (
                <p className="mt-2 font-mono text-[11px] font-semibold tracking-wide text-[#0d4a36] tabular-nums whitespace-nowrap">
                  #{referenceCode}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {appointment && (
          <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
            <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
              <div className="flex items-center gap-3 px-3.5 py-3">
                {appointment.propertyImage ? (
                  <img
                    src={appointment.propertyImage}
                    alt={appointment.propertyTitle}
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
                    <span>{appointment.location}</span>
                  </p>
                </div>
                {appointment.propertyPrice && (
                  <span className="shrink-0 rounded-md border border-emerald-200/70 bg-emerald-50/70 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 tabular-nums">
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
                  <dd className="mt-1 text-xs font-semibold text-stone-900">{formattedDate}</dd>
                </div>
                <div className="px-3.5 py-3">
                  <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">
                    <Clock className="h-3 w-3" />
                    Time
                  </dt>
                  <dd className="mt-1 font-mono text-xs font-semibold text-stone-900 tabular-nums">{formattedTime}</dd>
                </div>
                <div className="border-r border-t border-stone-100 px-3.5 py-3">
                  <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">
                    <User className="h-3 w-3" />
                    Client
                  </dt>
                  <dd className="mt-1.5 flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-600">
                      {initials(appointment.leadName)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-stone-900">{appointment.leadName}</span>
                      {appointment.leadPhone && (
                        <span className="block font-mono text-[11px] text-stone-500 tabular-nums">{appointment.leadPhone}</span>
                      )}
                    </span>
                  </dd>
                </div>
                <div className="border-t border-stone-100 px-3.5 py-3">
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Host</dt>
                  <dd className="mt-1 truncate text-xs font-semibold text-stone-900">{appointment.assignedBrokerName}</dd>
                  <dd className="mt-0.5 text-[11px] text-stone-500">{formatLabel(appointment.meetingType)}</dd>
                </div>
              </dl>

              {meetLink && (
                <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">
                      <Video className="h-3 w-3" />
                      Meet
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-stone-500">{meetLink}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(meetLink, "_blank", "noopener,noreferrer")}
                      className="h-7 gap-1 border-stone-200 bg-white px-2 text-[11px] text-stone-700 hover:bg-stone-50"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(meetLink);
                        toast.success("Meet link copied.");
                      }}
                      className="h-7 px-2 text-[11px] text-stone-600"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Automated Delivery Indicator */}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200/80 bg-emerald-50/60 p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#0d4a36]">
                  <Mail className="h-3 w-3" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-emerald-950">
                    Automated Email Notifications Dispatched
                  </p>
                  <p className="text-[10px] text-emerald-700">
                    Prospect confirmation, calendar invite & company AI briefing delivered.
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                SENT
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 bg-stone-50/70 px-4 py-3 sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleShareWhatsApp}
              disabled={!appointment}
              className="h-7 border-stone-200 bg-white px-2.5 text-[11px] text-stone-700 hover:bg-stone-50"
            >
              WhatsApp
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopySummary}
              disabled={!appointment}
              className="h-7 gap-1 border-stone-200 bg-white px-2.5 text-[11px] text-stone-700 hover:bg-stone-50"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddToCalendar}
              disabled={!appointment}
              className="h-7 gap-1 border-stone-200 bg-white px-2.5 text-[11px] text-stone-700 hover:bg-stone-50"
            >
              <CalendarDays className="h-3 w-3" />
              Calendar
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 bg-[#0d4a36] px-3 text-xs font-medium text-white hover:bg-[#0a3829]"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
