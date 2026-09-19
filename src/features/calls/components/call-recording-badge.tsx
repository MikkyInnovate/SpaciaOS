import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { CallRecordingState } from "../types";

export interface CallRecordingBadgeProps {
  state: CallRecordingState;
  className?: string;
  size?: "xs" | "sm" | "md";
  withDot?: boolean;
}

interface RecordingStyleConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  pulse?: boolean;
}

const RECORDING_CONFIG: Record<CallRecordingState, RecordingStyleConfig> = {
  ready: {
    label: "Audio Ready",
    badgeClass: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
    dotClass: "bg-emerald-600",
  },
  processing: {
    label: "Processing Audio",
    badgeClass: "border-amber-200/80 bg-amber-50 text-amber-800",
    dotClass: "bg-amber-500",
    pulse: true,
  },
  live: {
    label: "Live Stream",
    badgeClass: "border-rose-200/80 bg-rose-50 text-rose-700",
    dotClass: "bg-rose-500",
    pulse: true,
  },
  failed: {
    label: "Audio Failed",
    badgeClass: "border-red-200/80 bg-red-50 text-red-700",
    dotClass: "bg-red-500",
  },
  no_audio: {
    label: "No Audio",
    badgeClass: "border-stone-200/80 bg-stone-100 text-stone-600",
    dotClass: "bg-stone-400",
  },
};

export function CallRecordingBadge({
  state,
  className,
  size = "sm",
  withDot = true,
}: CallRecordingBadgeProps) {
  const config = RECORDING_CONFIG[state] || RECORDING_CONFIG.ready;

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
          className={cn(
            "rounded-full shrink-0",
            config.dotClass,
            dotSizes[size],
            config.pulse && "animate-pulse"
          )}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
