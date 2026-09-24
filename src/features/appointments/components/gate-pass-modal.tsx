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
import { Badge } from "@/components/ui/badge";
import { Appointment } from "../types";
import {
  ShieldCheck,
  Key,
  QrCode,
  Copy,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Building,
  Check,
  Smartphone,
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

  const gateCode = appointment.gatePassCode || `SP-${Math.floor(1000 + Math.random() * 9000)}-VIP`;

  const copyPassText = () => {
    const text = `*PACIA ESTATE ACCESS PASS*\n\nGate Code: ${gateCode}\nProperty: ${appointment.propertyTitle}\nLocation: ${appointment.location}\nDate: ${new Date(appointment.startTime).toLocaleDateString()}\nTime: ${new Date(appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\nGuest: ${appointment.leadName}\nBroker Host: ${appointment.assignedBrokerName}\n\n*Show this pass at security gate for instant drive-through clearance.*`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Gate pass copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-stone-200 bg-[#fbfbf9] p-0 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-[#0d4a36] px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                Pacia Estate Clearance
              </span>
            </div>
            <Badge className="bg-emerald-950/80 text-emerald-300 border-emerald-800/60 text-[10px]">
              VIP Access Pass
            </Badge>
          </div>
          <DialogTitle className="mt-2 text-xl font-bold text-white">
            Estate Security Gate Pass
          </DialogTitle>
          <DialogDescription className="text-xs text-emerald-100/80">
            Authorized access code for in-person property inspection
          </DialogDescription>
        </div>

        {/* Pass Body (Digital Pass Ticket) */}
        <div className="p-6">
          <div className="rounded-xl border-2 border-dashed border-emerald-800/30 bg-white p-5 shadow-sm">
            {/* Access Code Highlight */}
            <div className="text-center">
              <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                Security Access Code
              </div>
              <div className="mt-1 font-mono text-3xl font-extrabold tracking-widest text-[#0d4a36]">
                {gateCode}
              </div>
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <ShieldCheck className="h-3 w-3" /> Valid for Single Entry & Exit
              </div>
            </div>

            {/* QR Simulation */}
            <div className="my-4 flex flex-col items-center justify-center p-3 rounded-lg bg-stone-50 border border-stone-100">
              <div className="h-28 w-28 bg-white border border-stone-200 rounded-md p-2 flex items-center justify-center shadow-inner">
                <QrCode className="h-24 w-24 text-stone-900" />
              </div>
              <div className="mt-1.5 text-[10px] text-stone-400">
                Scan at Estate Gate Barrier Scanner
              </div>
            </div>

            {/* Viewing Details */}
            <div className="space-y-2 text-xs border-t border-stone-100 pt-3">
              <div className="flex items-start justify-between">
                <span className="text-stone-500">Property:</span>
                <span className="font-semibold text-stone-900 text-right max-w-[200px] truncate">
                  {appointment.propertyTitle}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-stone-500">Location:</span>
                <span className="font-medium text-stone-700 text-right max-w-[200px] truncate">
                  {appointment.location}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Date & Time:</span>
                <span className="font-medium text-stone-800">
                  {new Date(appointment.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {new Date(appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">VIP Guest:</span>
                <span className="font-semibold text-stone-900">{appointment.leadName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Broker Host:</span>
                <span className="font-medium text-stone-700">{appointment.assignedBrokerName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="bg-stone-50 px-6 py-3 border-t border-stone-200/80 flex sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className="text-xs"
            onClick={copyPassText}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                Copied Pass
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy for WhatsApp
              </>
            )}
          </Button>

          <Button
            type="button"
            className="bg-[#0d4a36] text-white hover:bg-[#0d4a36]/90 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
