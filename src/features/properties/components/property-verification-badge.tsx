"use client";

import * as React from "react";
import type { PropertyVerificationDetails } from "../types";
import { ShieldCheck, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PropertyVerificationBadgeProps {
  verification: PropertyVerificationDetails;
  size?: "xs" | "sm";
  showDeedType?: boolean;
  className?: string;
}

export function PropertyVerificationBadge({
  verification,
  size = "xs",
  showDeedType = true,
  className,
}: PropertyVerificationBadgeProps) {
  const { status, titleDeedType } = verification;

  const sizeStyles = {
    xs: "text-[10px] px-2 py-0.5 gap-1.5 font-medium",
    sm: "text-xs px-2.5 py-0.5 gap-1.5 font-medium",
  };

  const iconSizes = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
  };

  if (status === "Verified") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50/90 text-emerald-800 font-semibold tracking-tight whitespace-nowrap",
          sizeStyles[size],
          className
        )}
        title={verification.notes || "Title deed and physical survey verified by Pacia legal underwriting."}
      >
        <ShieldCheck className={cn("text-emerald-700 shrink-0", iconSizes[size])} />
        <span>Verified</span>
        {showDeedType && titleDeedType && (
          <>
            <span className="text-emerald-300">•</span>
            <span className="font-normal text-emerald-700 truncate max-w-[140px]">
              {titleDeedType}
            </span>
          </>
        )}
      </span>
    );
  }

  if (status === "Pending Verification") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-amber-200 bg-amber-50/90 text-amber-800 font-medium tracking-tight whitespace-nowrap",
          sizeStyles[size],
          className
        )}
        title="Title documents undergoing active registry recertification audit."
      >
        <Clock className={cn("text-amber-600 shrink-0", iconSizes[size])} />
        <span>Verification Pending</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-stone-200 bg-stone-100 text-stone-600 font-medium tracking-tight whitespace-nowrap",
        sizeStyles[size],
        className
      )}
      title="Property documentation has not yet undergone formal site and registry verification."
    >
      <ShieldAlert className={cn("text-stone-400 shrink-0", iconSizes[size])} />
      <span>Unverified Listing</span>
    </span>
  );
}
