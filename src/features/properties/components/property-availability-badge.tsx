"use client";

import * as React from "react";
import type { PropertyAvailability } from "../types";
import { cn } from "@/lib/utils/cn";

export interface PropertyAvailabilityBadgeProps {
  availability: PropertyAvailability;
  size?: "xs" | "sm";
  className?: string;
}

const AVAILABILITY_CONFIG: Record<
  PropertyAvailability,
  { label: string; badgeClass: string; dotClass: string }
> = {
  Available: {
    label: "Available",
    badgeClass: "border-emerald-200 bg-emerald-50/80 text-emerald-800",
    dotClass: "bg-emerald-500",
  },
  "Under Offer": {
    label: "Under Offer",
    badgeClass: "border-amber-200 bg-amber-50/80 text-amber-800",
    dotClass: "bg-amber-500",
  },
  Sold: {
    label: "Sold / Off-Market",
    badgeClass: "border-stone-200 bg-stone-100 text-stone-600",
    dotClass: "bg-stone-400",
  },
  Reserved: {
    label: "Reserved",
    badgeClass: "border-purple-200 bg-purple-50/80 text-purple-800",
    dotClass: "bg-purple-500",
  },
  Unavailable: {
    label: "Unavailable",
    badgeClass: "border-rose-200 bg-rose-50/80 text-rose-800",
    dotClass: "bg-rose-500",
  },
  Unknown: {
    label: "Status Unknown",
    badgeClass: "border-stone-300 border-dashed bg-stone-50 text-stone-500",
    dotClass: "bg-stone-400",
  },
};

export function PropertyAvailabilityBadge({
  availability,
  size = "xs",
  className,
}: PropertyAvailabilityBadgeProps) {
  const config = AVAILABILITY_CONFIG[availability] || AVAILABILITY_CONFIG.Unknown;

  const sizeStyles = {
    xs: "text-[10px] px-2 py-0.5 gap-1.5 font-semibold",
    sm: "text-xs px-2.5 py-0.5 gap-1.5 font-semibold",
  };

  const dotSizes = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border tracking-tight select-none whitespace-nowrap",
        config.badgeClass,
        sizeStyles[size],
        className
      )}
    >
      <span
        className={cn("rounded-full shrink-0", config.dotClass, dotSizes[size])}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  );
}
