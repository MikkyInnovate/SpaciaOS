import * as React from "react";
import {
  FolderOpen,
  SearchX,
  Users,
  PhoneCall,
  CalendarX,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type EmptyStatePreset =
  | "no-leads"
  | "no-calls"
  | "no-appointments"
  | "no-search-results"
  | "no-data";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  preset?: EmptyStatePreset;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  size?: "default" | "compact" | "inline";
  onActionClick?: () => void;
  actionLabel?: string;
}

const PRESET_CONFIGS: Record<
  EmptyStatePreset,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    defaultActionLabel?: string;
  }
> = {
  "no-leads": {
    icon: <Users className="h-6 w-6 text-stone-400" />,
    title: "No Inbound Leads Found",
    description: "Your pipeline is clear. Leads will appear automatically when captured via inbound ads, WhatsApp, or phone calls.",
    defaultActionLabel: "Manual Lead Intake",
  },
  "no-calls": {
    icon: <PhoneCall className="h-6 w-6 text-stone-400" />,
    title: "No AI Voice Calls Recorded",
    description: "Autonomous voice interactions will be logged here with audio playback, full transcripts, and BANT scoring.",
  },
  "no-appointments": {
    icon: <CalendarX className="h-6 w-6 text-stone-400" />,
    title: "No Viewings Scheduled",
    description: "Confirmed on-site inspections booked by the AI agent or sales brokers will show on your calendar timeline.",
    defaultActionLabel: "Schedule Inspection",
  },
  "no-search-results": {
    icon: <SearchX className="h-6 w-6 text-stone-400" />,
    title: "No Matching Records Found",
    description: "Try adjusting your search terms, removing filter constraints, or resetting your query parameters.",
    defaultActionLabel: "Clear Search Filters",
  },
  "no-data": {
    icon: <FolderOpen className="h-6 w-6 text-stone-400" />,
    title: "No Data Available",
    description: "There are currently no records to display in this workspace view.",
  },
};

export function EmptyState({
  preset,
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  action,
  secondaryAction,
  size = "default",
  onActionClick,
  actionLabel,
  className,
  ...props
}: EmptyStateProps) {
  const presetConfig = preset ? PRESET_CONFIGS[preset] : undefined;

  const icon = customIcon || presetConfig?.icon || <FolderOpen className="h-6 w-6 text-stone-400" aria-hidden="true" />;
  const title = customTitle || presetConfig?.title || "No Data Available";
  const description = customDescription || presetConfig?.description;
  const computedActionLabel = actionLabel || presetConfig?.defaultActionLabel;

  const sizeClasses = {
    inline: "p-4 min-h-[140px]",
    compact: "p-6 min-h-[220px]",
    default: "p-8 min-h-[300px]",
  };

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-200 bg-white/60 text-center animate-in fade-in-50 duration-200",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-50 border border-stone-200/60 shadow-2xs mb-3">
        {icon}
      </div>

      <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1 max-w-sm text-xs text-stone-500 leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction || (computedActionLabel && onActionClick)) && (
        <div className="mt-4 flex items-center gap-2">
          {action ? (
            action
          ) : computedActionLabel && onActionClick ? (
            <Button
              size="sm"
              onClick={onActionClick}
              className="h-8 gap-1.5 text-xs bg-[#0d4a36] text-white hover:bg-[#093829] shadow-2xs cursor-pointer"
            >
              {preset === "no-search-results" ? (
                <RefreshCw className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>{computedActionLabel}</span>
            </Button>
          ) : null}

          {secondaryAction}
        </div>
      )}
    </div>
  );
}
