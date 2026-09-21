"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { FollowUpSchedule } from "../types";
import {
  CalendarClock,
  Clock,
  Phone,
  Mail,
  Calendar,
  Edit2,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface FollowUpScheduleCardProps {
  schedule: FollowUpSchedule;
  leadName?: string;
  onUpdateSchedule?: (newSchedule: FollowUpSchedule) => void;
  className?: string;
}

const CADENCE_LABELS: Record<FollowUpSchedule["cadence"], string> = {
  once: "One-Time Touchpoint",
  daily: "Daily Cadence",
  weekly: "Weekly Cadence",
  biweekly: "Bi-Weekly Nurture",
  monthly: "Monthly Portfolio Review",
};

const CHANNEL_ICONS: Record<
  FollowUpSchedule["channel"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  call: { label: "Phone Call", icon: Phone },
  email: { label: "Email", icon: Mail },
  whatsapp: { label: "Email", icon: Mail },
};

export function FollowUpScheduleCard({
  schedule,
  leadName,
  onUpdateSchedule,
  className,
}: FollowUpScheduleCardProps) {
  const [isRescheduleOpen, setIsRescheduleOpen] = React.useState(false);
  const [channel, setChannel] = React.useState<FollowUpSchedule["channel"]>(schedule.channel);
  const [cadence, setCadence] = React.useState<FollowUpSchedule["cadence"]>(schedule.cadence);
  const [daysOffset, setDaysOffset] = React.useState("3");
  const [customNotes, setCustomNotes] = React.useState(schedule.notes || "");

  const channelConfig = CHANNEL_ICONS[schedule.channel] || CHANNEL_ICONS.call;
  const ChannelIcon = channelConfig.icon;

  const handleSaveReschedule = () => {
    const numDays = parseInt(daysOffset, 10) || 3;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + numDays);

    const formattedDate = targetDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const updated: FollowUpSchedule = {
      scheduledAt: targetDate.toISOString(),
      scheduledFormatted: formattedDate,
      relativeCountdown: numDays === 1 ? "Tomorrow" : `In ${numDays} days`,
      channel,
      cadence,
      notes: customNotes.trim() || undefined,
    };

    onUpdateSchedule?.(updated);
    setIsRescheduleOpen(false);
    toast.success("Follow-up Rescheduled", {
      description: `Next touchpoint set for ${formattedDate} (${updated.relativeCountdown}) via ${channel.toUpperCase()}.`,
    });
  };

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-stone-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3",
          className
        )}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
              <CalendarClock className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 leading-none">
                Scheduled Follow-up Touchpoint
              </h4>
              <span className="text-[11px] text-stone-500 font-medium mt-0.5 block">
                {CADENCE_LABELS[schedule.cadence] || "Active Cadence"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="bg-stone-100/80 text-stone-700 border-stone-200 gap-1 text-[11px] font-semibold py-0.5 px-2"
            >
              <Clock className="h-3 w-3 shrink-0 text-stone-500" />
              <span>{schedule.relativeCountdown}</span>
            </Badge>

            <Badge
              variant="outline"
              className="bg-stone-50 text-stone-700 border-stone-200 gap-1 text-[11px] font-medium py-0.5 px-2"
            >
              <ChannelIcon className="h-3 w-3 text-stone-500" />
              <span>{channelConfig.label}</span>
            </Badge>
          </div>
        </div>

        {/* Date & Time display */}
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-stone-50 border border-stone-200/70">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Scheduled Date & Time
            </span>
            <p className="font-mono text-sm font-bold text-stone-900 tabular-nums flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-stone-600" />
              <span>{schedule.scheduledFormatted}</span>
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRescheduleOpen(true)}
            className="h-7 text-xs gap-1.5 bg-white text-stone-700 hover:text-stone-900 border-stone-200 cursor-pointer shadow-2xs"
          >
            <Edit2 className="h-3 w-3" />
            <span>Reschedule</span>
          </Button>
        </div>

        {/* Agenda / Notes */}
        {schedule.notes && (
          <div className="text-xs text-stone-600 bg-stone-50 rounded-lg p-2 border border-stone-200/60 flex items-start gap-1.5">
            <span className="font-semibold text-stone-800 shrink-0">Focus:</span>
            <span className="font-normal">{schedule.notes}</span>
          </div>
        )}
      </div>

      {/* Reschedule Dialog Modal */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-stone-900">
              <CalendarClock className="h-5 w-5 text-teal-700" />
              <span>Reschedule Follow-up for {leadName || "Lead"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Update the reminder date, communication channel, and recurrence cadence.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick timeframe presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Follow-up Window</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Tomorrow", val: "1" },
                  { label: "3 Days", val: "3" },
                  { label: "7 Days", val: "7" },
                  { label: "14 Days", val: "14" },
                ].map((chip) => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => setDaysOffset(chip.val)}
                    className={cn(
                      "h-8 rounded-md border text-xs font-medium transition-colors cursor-pointer",
                      daysOffset === chip.val
                        ? "border-[#0d4a36] bg-emerald-50 text-[#0d4a36] font-semibold"
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
                <label className="text-xs font-semibold text-stone-700">Channel</label>
                <Select value={channel} onValueChange={(v) => setChannel(v as FollowUpSchedule["channel"])}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <Phone className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                        <span>Phone Call</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="email">
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <Mail className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                        <span>Email</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Cadence</label>
                <Select value={cadence} onValueChange={(v) => setCadence(v as FollowUpSchedule["cadence"])}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One-Time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Touchpoint Focus / Objective</label>
              <Input
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Check on surveyor deed clearance"
                className="h-8 text-xs bg-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRescheduleOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveReschedule}
              className="h-8 text-xs bg-[#0d4a36] hover:bg-[#093829] text-white"
            >
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
