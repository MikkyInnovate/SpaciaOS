"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "../types";
import {
  ShieldCheck,
  Key,
  Copy,
  Check,
  Building2,
  MapPin,
  CalendarDays,
  Sparkles,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";

interface GatePassModalProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GatePassModal({
  appointment,
  open,
  onOpenChange,
}: GatePassModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!appointment) return null;

  const gateCode =
    appointment.gatePassCode ||
    `SP-${Math.floor(1000 + Math.random() * 9000)}-VIP`;

  const startDate = new Date(appointment.startTime);
  const formattedDate = startDate
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();

  const formattedTime = startDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const copyPassText = () => {
    const text = `*PACIA ESTATE ACCESS PASS*\n\nGate Code: ${gateCode}\nProperty: ${appointment.propertyTitle}\nLocation: ${appointment.location}\nDate: ${formattedDate} | ${formattedTime}\nGuest: ${appointment.leadName}\nBroker Host: ${appointment.assignedBrokerName}\n\n*Show this pass at security gate for instant drive-through clearance.*`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Gate pass copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none overflow-visible">
        {/* Ticket Container */}
        <div className="relative mx-auto w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl border border-stone-200/80">
          {/* Top Celebration / Clearance Icon */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#0d4a36] border border-emerald-100/80 shadow-2xs">
              <ShieldCheck className="h-6 w-6 text-[#0d4a36]" />
            </div>

            <DialogTitle className="mt-3 text-lg font-bold text-stone-900 tracking-tight">
              Estate Security Pass
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-stone-500 max-w-xs">
              Your VIP inspection pass has been authorized for entry.
            </DialogDescription>
          </div>

          {/* Tear-off Notch Dividers */}
          <div className="relative my-6">
            <div className="border-t border-dashed border-stone-200" />
            <div className="absolute -left-10 -top-3 h-6 w-6 rounded-full bg-stone-900/10 backdrop-blur-md" />
            <div className="absolute -right-10 -top-3 h-6 w-6 rounded-full bg-stone-900/10 backdrop-blur-md" />
          </div>

          {/* Ticket Metadata Grid */}
          <div className="space-y-4 text-xs">
            {/* Row 1: Access Code & Validity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                  Access Code
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold text-stone-900">
                  {gateCode}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                  Validity
                </div>
                <div className="mt-0.5 font-semibold text-emerald-800">
                  Single Entry & Exit
                </div>
              </div>
            </div>

            {/* Row 2: Date & Time */}
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                Date & Time
              </div>
              <div className="mt-0.5 font-medium text-stone-900">
                {formattedDate} &nbsp;|&nbsp; {formattedTime}
              </div>
            </div>

            {/* Property Highlight Pill (Matches Mastercard Pill Pattern) */}
            <div className="rounded-xl border border-stone-150 bg-stone-50/80 p-3 flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-stone-200 text-[#0d4a36]">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-stone-900 text-xs">
                  {appointment.propertyTitle}
                </div>
                <div className="truncate text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0 text-stone-400" />
                  <span className="truncate">{appointment.location}</span>
                </div>
              </div>
            </div>

            {/* Guest & Host Context */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] text-stone-600">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                  VIP Guest
                </span>
                <span className="font-semibold text-stone-800 truncate block">
                  {appointment.leadName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                  Host Broker
                </span>
                <span className="font-medium text-stone-700 truncate block">
                  {appointment.assignedBrokerName.split("(")[0].trim()}
                </span>
              </div>
            </div>
          </div>

          {/* Barcode & Number */}
          <div className="mt-6 pt-4 border-t border-dashed border-stone-200 text-center">
            {/* Vector Barcode Simulation */}
            <div className="mx-auto flex h-11 w-48 items-center justify-center gap-0.5">
              {[
                3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 2, 3, 4,
                1, 2, 3, 1, 4, 2, 3, 1,
              ].map((w, idx) => (
                <div
                  key={idx}
                  className="h-full bg-stone-900"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
            <div className="mt-1 font-mono text-[9px] text-stone-400 tracking-widest">
              400600890050002070013
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={copyPassText}
              className="flex-1 h-9 text-xs border-stone-200 hover:bg-stone-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                  Copied Pass
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy for WhatsApp
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-9 bg-[#0d4a36] text-white hover:bg-[#0a3829] text-xs font-semibold"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
