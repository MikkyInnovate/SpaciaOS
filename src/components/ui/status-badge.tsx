import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type DomainStatus =
  // Lead Score Categories
  | "HOT"
  | "WARM"
  | "COLD"
  // Lead Lifecycle & Call Outcomes
  | "New"
  | "Qualified"
  | "In Conversation"
  | "Viewing Booked"
  | "Viewing Requested"
  | "Contacting"
  | "Follow-up"
  | "Nurture"
  | "Closed"
  | "Lost"
  | "Disqualified"
  | "No Answer"
  // Appointment Statuses
  | "Confirmed"
  | "Pending"
  | "Completed"
  | "Cancelled"
  | "Rescheduled"
  // AI Agent & System Statuses
  | "Operational"
  | "Active"
  | "Live"
  | "Escalated"
  | "Paused"
  | "Offline"
  | string;

export type StatusBadgeVariant =
  | "hot"
  | "warm"
  | "cold"
  | "qualified"
  | "viewing"
  | "inConversation"
  | "contacting"
  | "nurture"
  | "humanManaged"
  | "success"
  | "warning"
  | "destructive"
  | "neutral"
  | "outline";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: DomainStatus;
  variant?: StatusBadgeVariant;
  label?: string;
  withDot?: boolean;
  pulse?: boolean;
  size?: "xs" | "sm" | "md";
  icon?: React.ReactNode;
}

interface VariantConfig {
  badgeClass: string;
  dotClass: string;
}

const VARIANT_CONFIGS: Record<StatusBadgeVariant, VariantConfig> = {
  hot: {
    badgeClass: "border-rose-200/80 bg-rose-50 text-rose-700",
    dotClass: "bg-rose-500",
  },
  warm: {
    badgeClass: "border-amber-200/80 bg-amber-50 text-amber-800",
    dotClass: "bg-amber-500",
  },
  cold: {
    badgeClass: "border-stone-200/80 bg-stone-100 text-stone-600",
    dotClass: "bg-stone-400",
  },
  qualified: {
    badgeClass: "border-emerald-200/90 bg-emerald-50 text-emerald-800",
    dotClass: "bg-emerald-600",
  },
  viewing: {
    badgeClass: "border-indigo-200/80 bg-indigo-50 text-indigo-800",
    dotClass: "bg-indigo-600",
  },
  inConversation: {
    badgeClass: "border-blue-200/80 bg-blue-50 text-blue-800",
    dotClass: "bg-blue-600",
  },
  contacting: {
    badgeClass: "border-amber-200/80 bg-amber-50 text-amber-800",
    dotClass: "bg-amber-500",
  },
  nurture: {
    badgeClass: "border-teal-200/80 bg-teal-50 text-teal-800",
    dotClass: "bg-teal-600",
  },
  humanManaged: {
    badgeClass: "border-sky-200/90 bg-sky-50 text-sky-800 font-medium",
    dotClass: "bg-sky-600",
  },
  success: {
    badgeClass: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
    dotClass: "bg-emerald-600",
  },
  warning: {
    badgeClass: "border-amber-200/80 bg-amber-50 text-amber-800",
    dotClass: "bg-amber-500",
  },
  destructive: {
    badgeClass: "border-red-200/80 bg-red-50 text-red-700",
    dotClass: "bg-red-500",
  },
  neutral: {
    badgeClass: "border-stone-200 bg-stone-50 text-stone-700",
    dotClass: "bg-stone-500",
  },
  outline: {
    badgeClass: "border-stone-200 text-stone-700 bg-white",
    dotClass: "bg-stone-500",
  },
};

function resolveVariantForStatus(status: string): StatusBadgeVariant {
  const normalized = status.trim().toLowerCase();

  switch (normalized) {
    case "hot":
    case "escalated":
      return "hot";
    case "warm":
    case "contacting":
    case "pending":
      return "warm";
    case "cold":
    case "follow-up":
      return "cold";
    case "nurture":
      return "nurture";
    case "human managed":
    case "human-managed":
    case "human takeover":
      return "humanManaged";
    case "qualified":
    case "completed":
    case "confirmed":
    case "closed":
    case "operational":
    case "active":
    case "live":
      return "qualified";
    case "viewing booked":
    case "viewing requested":
      return "viewing";
    case "in conversation":
      return "inConversation";
    case "cancelled":
    case "lost":
    case "disqualified":
    case "failed":
      return "destructive";
    case "paused":
    case "offline":
    case "no answer":
      return "neutral";
    case "new":
    default:
      return "outline";
  }
}

export function StatusBadge({
  status,
  variant,
  label,
  withDot = false,
  pulse = false,
  size = "sm",
  icon,
  className,
  ...props
}: StatusBadgeProps) {
  const resolvedVariant = variant || resolveVariantForStatus(status);
  const config = VARIANT_CONFIGS[resolvedVariant] || VARIANT_CONFIGS.neutral;
  const displayText = label || (status === "Viewing Requested" ? "Viewing Booked" : status);

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
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {withDot && (
        <span
          className={cn(
            "rounded-full shrink-0",
            config.dotClass,
            dotSizes[size],
            pulse && "animate-pulse"
          )}
          aria-hidden="true"
        />
      )}
      <span>{displayText}</span>
    </span>
  );
}
