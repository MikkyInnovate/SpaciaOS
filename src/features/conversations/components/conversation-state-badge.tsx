"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { ConversationStatus } from "../types";

export interface ConversationStateBadgeProps {
  status: ConversationStatus;
  variant?: "badge" | "pill" | "dot-only";
  showDot?: boolean;
  className?: string;
}

interface StatusConfig {
  label: string;
  badgeClass: string;
  dotColor: string;
  pulse: boolean;
}

const STATUS_CONFIGS: Record<ConversationStatus, StatusConfig> = {
  active_ai: {
    label: "AI Active",
    badgeClass: "bg-emerald-50 text-[#0d4a36] border-emerald-200",
    dotColor: "bg-[#0d4a36]",
    pulse: true,
  },
  awaiting_prospect: {
    label: "Awaiting Reply",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    dotColor: "bg-sky-500",
    pulse: false,
  },
  qualified: {
    label: "Qualified",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotColor: "bg-emerald-600",
    pulse: false,
  },
  viewing_booked: {
    label: "Viewing Booked",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    dotColor: "bg-purple-600",
    pulse: false,
  },
  human_takeover: {
    label: "Broker Takeover",
    badgeClass: "bg-amber-50 text-amber-900 border-amber-200",
    dotColor: "bg-amber-600",
    pulse: false,
  },
  escalated: {
    label: "Escalated",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotColor: "bg-rose-600",
    pulse: true,
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-stone-100 text-stone-600 border-stone-200",
    dotColor: "bg-stone-400",
    pulse: false,
  },
};

export function ConversationStateBadge({
  status,
  variant = "badge",
  showDot = true,
  className,
}: ConversationStateBadgeProps) {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.closed;

  if (variant === "dot-only") {
    return (
      <span
        title={config.label}
        className={cn(
          "inline-block h-2 w-2 rounded-full shrink-0",
          config.dotColor,
          config.pulse && "animate-pulse",
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-medium transition-colors select-none",
        variant === "pill"
          ? "rounded-full px-2.5 py-0.5 text-xs"
          : "rounded-md px-2 py-0.5 text-[11px]",
        config.badgeClass,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            config.dotColor,
            config.pulse && "animate-pulse"
          )}
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
