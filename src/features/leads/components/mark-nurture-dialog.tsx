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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FollowUpSchedule } from "../types";
import { CalendarHeart, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface MarkNurtureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName?: string;
  onConfirm: (schedule: FollowUpSchedule, notes?: string) => void;
}

export function MarkNurtureDialog({
  open,
  onOpenChange,
  leadName,
  onConfirm,
}: MarkNurtureDialogProps) {
  const [daysOffset, setDaysOffset] = React.useState("14");
  const [channel, setChannel] = React.useState<FollowUpSchedule["channel"]>("email");
  const [cadence, setCadence] = React.useState<FollowUpSchedule["cadence"]>("biweekly");
  const [notes, setNotes] = React.useState("");

  const handleConfirm = () => {
    const numDays = parseInt(daysOffset, 10) || 14;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + numDays);

    const formattedDate = targetDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const schedule: FollowUpSchedule = {
      scheduledAt: targetDate.toISOString(),
      scheduledFormatted: formattedDate,
      relativeCountdown: `In ${numDays} days`,
      channel,
      cadence,
      notes: notes.trim() || undefined,
    };

    onConfirm(schedule, notes.trim() || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-teal-950">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
              <CalendarHeart className="h-4 w-4" />
            </div>
            <span>Move to Nurture Pipeline</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            Transition <strong>{leadName || "this prospect"}</strong> to long-term nurture. AI active dialer will be paused and automated reminders will be queued.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preset timeframe chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Initial Nurture Check-In</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "7 Days", val: "7", defaultCadence: "weekly" as const },
                { label: "14 Days", val: "14", defaultCadence: "biweekly" as const },
                { label: "30 Days", val: "30", defaultCadence: "monthly" as const },
                { label: "60 Days", val: "60", defaultCadence: "monthly" as const },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => {
                    setDaysOffset(chip.val);
                    setCadence(chip.defaultCadence);
                  }}
                  className={cn(
                    "h-8 rounded-md border text-xs font-medium transition-colors cursor-pointer",
                    daysOffset === chip.val
                      ? "border-teal-700 bg-teal-50 text-teal-900 font-semibold shadow-2xs"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channel and Cadence selects */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Touchpoint Channel</label>
              <Select value={channel} onValueChange={(v) => setChannel(v as FollowUpSchedule["channel"])}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <Mail className="h-3.5 w-3.5 text-stone-600 shrink-0" />
                      <span>Email</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="call">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <Phone className="h-3.5 w-3.5 text-stone-600 shrink-0" />
                      <span>Phone Call</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Follow-up Cadence</label>
              <Select value={cadence} onValueChange={(v) => setCadence(v as FollowUpSchedule["cadence"])}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="once">One-Time Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Nurture Focus / Catalyst</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Awaiting Q4 capital dividend release before selecting final Ikoyi plot."
              className="text-xs min-h-[70px] bg-white resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="h-8 text-xs bg-teal-800 hover:bg-teal-900 text-white cursor-pointer shadow-2xs font-semibold"
          >
            Set Nurture Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
