"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { LeadStatus } from "../types";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LeadStatusSelectProps {
  currentStatus: LeadStatus;
  onStatusChange: (status: LeadStatus) => Promise<void> | void;
  disabled?: boolean;
}

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; dot: string }
> = {
  New: { label: "New Lead", dot: "bg-blue-500" },
  Contacting: { label: "Contacting", dot: "bg-amber-500" },
  "In Conversation": { label: "In Conversation", dot: "bg-purple-500" },
  Qualified: { label: "Qualified", dot: "bg-emerald-500" },
  "Viewing Booked": { label: "Viewing Booked", dot: "bg-cyan-500" },
  "Follow-up": { label: "Follow-up", dot: "bg-orange-500" },
  "Human Managed": { label: "Human Managed", dot: "bg-sky-600" },
  Nurture: { label: "Nurture", dot: "bg-teal-600" },
  Lost: { label: "Lost", dot: "bg-rose-600" },
};

const ALL_STATUSES: Array<{ label: string; value: LeadStatus }> = [
  { label: "New Lead", value: "New" },
  { label: "Contacting", value: "Contacting" },
  { label: "In Conversation", value: "In Conversation" },
  { label: "Qualified", value: "Qualified" },
  { label: "Viewing Booked", value: "Viewing Booked" },
  { label: "Follow-up", value: "Follow-up" },
  { label: "Human Managed", value: "Human Managed" },
  { label: "Nurture", value: "Nurture" },
  { label: "Lost", value: "Lost" },
];

export function LeadStatusSelect({
  currentStatus,
  onStatusChange,
  disabled = false,
}: LeadStatusSelectProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleValueChange = async (value: string) => {
    if (value === currentStatus) return;
    try {
      setIsUpdating(true);
      await onStatusChange(value as LeadStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const activeConfig = STATUS_CONFIG[currentStatus] || {
    label: currentStatus,
    dot: "bg-stone-400",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider select-none">
        Stage
      </span>
      <div className="relative">
        <Select
          value={currentStatus}
          onValueChange={handleValueChange}
          disabled={disabled || isUpdating}
        >
          <SelectTrigger className="h-7 w-auto min-w-[135px] px-2.5 py-0 text-xs bg-white border border-stone-200 hover:border-stone-300 font-medium cursor-pointer rounded-md gap-2 focus:ring-1 focus:ring-stone-300 transition-colors">
            {isUpdating ? (
              <div className="flex items-center gap-1.5 text-stone-500 text-xs">
                <Loader2 className="h-3 w-3 animate-spin text-stone-600" />
                <span>Updating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium text-stone-800">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    activeConfig.dot
                  )}
                />
                <span>{activeConfig.label}</span>
              </div>
            )}
          </SelectTrigger>
          <SelectContent align="start" className="text-xs min-w-[160px] bg-white border border-stone-200 shadow-md">
            {ALL_STATUSES.map((s) => {
              const config = STATUS_CONFIG[s.value];
              return (
                <SelectItem key={s.value} value={s.value} className="text-xs py-1.5 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        config?.dot || "bg-stone-400"
                      )}
                    />
                    <span className="font-medium text-stone-800">{s.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
