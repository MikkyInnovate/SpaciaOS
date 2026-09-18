import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { WorkflowExecutionStatus } from "../types";
import {
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Ban,
  PauseCircle,
  Circle,
} from "lucide-react";

export interface WorkflowStatusIndicatorProps {
  status: WorkflowExecutionStatus;
  retryAttempt?: number;
  maxRetries?: number;
  variant?: "badge" | "pill" | "dot-only" | "expanded";
  className?: string;
  showIcon?: boolean;
  labelOverride?: string;
}

export function WorkflowStatusIndicator({
  status,
  retryAttempt,
  maxRetries,
  variant = "badge",
  className,
  showIcon = true,
  labelOverride,
}: WorkflowStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "in_progress":
        return {
          label: labelOverride || "In Progress",
          icon: <Loader2 className="h-3 w-3 animate-spin text-emerald-700" />,
          dotColor: "bg-emerald-600 animate-pulse",
          badgeClasses:
            "bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-2xs",
          description: "Workflow step is actively executing asynchronously.",
        };
      case "retrying":
        return {
          label:
            labelOverride ||
            (retryAttempt && maxRetries
              ? `Retrying (${retryAttempt}/${maxRetries})`
              : "Retrying"),
          icon: <RefreshCw className="h-3 w-3 animate-spin text-amber-700" />,
          dotColor: "bg-amber-500 animate-ping",
          badgeClasses:
            "bg-amber-50 text-amber-800 border-amber-300 shadow-2xs",
          description: "Recovering from temporary connection or provider fault.",
        };
      case "failed":
        return {
          label: labelOverride || "Failed",
          icon: <AlertCircle className="h-3 w-3 text-rose-700" />,
          dotColor: "bg-rose-600",
          badgeClasses:
            "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs",
          description: "Workflow execution failed; requires review or retry.",
        };
      case "completed":
        return {
          label: labelOverride || "Completed",
          icon: <CheckCircle2 className="h-3 w-3 text-emerald-700" />,
          dotColor: "bg-emerald-600",
          badgeClasses:
            "bg-stone-50 text-stone-700 border-stone-200",
          description: "Execution successfully concluded.",
        };
      case "queued":
        return {
          label: labelOverride || "Queued",
          icon: <Clock className="h-3 w-3 text-stone-500" />,
          dotColor: "bg-stone-400",
          badgeClasses:
            "bg-stone-100 text-stone-600 border-stone-200",
          description: "Dispatched to worker queue; waiting for execution slot.",
        };
      case "blocked":
        return {
          label: labelOverride || "Action Required",
          icon: <PauseCircle className="h-3 w-3 text-amber-700" />,
          dotColor: "bg-amber-600",
          badgeClasses:
            "bg-amber-50 text-amber-900 border-amber-200",
          description: "Automation paused; awaiting human broker decision.",
        };
      case "cancelled":
        return {
          label: labelOverride || "Cancelled",
          icon: <Ban className="h-3 w-3 text-stone-500" />,
          dotColor: "bg-stone-400",
          badgeClasses:
            "bg-stone-100 text-stone-500 border-stone-200",
          description: "Cancelled by broker or system policy.",
        };
      case "idle":
      default:
        return {
          label: labelOverride || "Idle",
          icon: <Circle className="h-3 w-3 text-stone-400" />,
          dotColor: "bg-stone-300",
          badgeClasses:
            "bg-stone-50 text-stone-600 border-stone-200",
          description: "Workflow initialized and ready.",
        };
    }
  };

  const config = getStatusConfig();

  if (variant === "dot-only") {
    return (
      <span
        className={cn("relative flex h-2 w-2 items-center justify-center", className)}
        title={`${config.label}: ${config.description}`}
      >
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            config.dotColor
          )}
        />
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", config.dotColor)} />
      </span>
    );
  }

  if (variant === "expanded") {
    return (
      <div
        className={cn(
          "flex items-start gap-2.5 p-2.5 rounded-lg border text-xs",
          config.badgeClasses,
          className
        )}
      >
        <div className="shrink-0 pt-0.5">{config.icon}</div>
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="font-semibold">{config.label}</div>
          <div className="text-[11px] opacity-80">{config.description}</div>
        </div>
      </div>
    );
  }

  // "badge" and "pill"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-mono text-[11px] font-medium leading-none select-none transition-colors",
        variant === "pill" ? "rounded-full px-2.5 py-1" : "rounded-md px-2 py-0.5",
        config.badgeClasses,
        className
      )}
      title={config.description}
    >
      {showIcon && <span className="shrink-0">{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
}
