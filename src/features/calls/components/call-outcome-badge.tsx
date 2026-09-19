import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { CallOutcome } from "../types";

export interface CallOutcomeBadgeProps {
  outcome: CallOutcome;
  className?: string;
  size?: "xs" | "sm" | "md";
  withDot?: boolean;
}

interface OutcomeStyleConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

const OUTCOME_CONFIG: Record<CallOutcome, OutcomeStyleConfig> = {
  viewing_booked: {
    label: "Viewing Booked",
    badgeClass: "border-emerald-200/90 bg-emerald-50 text-emerald-800",
    dotClass: "bg-emerald-600",
  },
  qualified: {
    label: "Qualified",
    badgeClass: "border-blue-200/80 bg-blue-50 text-blue-800",
    dotClass: "bg-blue-600",
  },
  callback_requested: {
    label: "Callback Requested",
    badgeClass: "border-amber-200/80 bg-amber-50 text-amber-800",
    dotClass: "bg-amber-500",
  },
  nurture: {
    label: "Nurture Pipeline",
    badgeClass: "border-stone-200/80 bg-stone-100 text-stone-600",
    dotClass: "bg-stone-500",
  },
  voicemail: {
    label: "Voicemail Left",
    badgeClass: "border-stone-200/80 bg-stone-100 text-stone-600",
    dotClass: "bg-stone-400",
  },
  escalated_takeover: {
    label: "Human Takeover",
    badgeClass: "border-rose-200/80 bg-rose-50 text-rose-700",
    dotClass: "bg-rose-500",
  },
};

export function CallOutcomeBadge({
  outcome,
  className,
  size = "sm",
  withDot = true,
}: CallOutcomeBadgeProps) {
  const config = OUTCOME_CONFIG[outcome] || OUTCOME_CONFIG.qualified;

  const sizeStyles = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-xs px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5 font-semibold",
  };

  const dotSizes = {
    xs: "h-1 w-1",
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium transition-colors select-none whitespace-nowrap tabular-nums",
        config.badgeClass,
        sizeStyles[size],
        className
      )}
    >
      {withDot && (
        <span
          className={cn("rounded-full shrink-0", config.dotClass, dotSizes[size])}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
