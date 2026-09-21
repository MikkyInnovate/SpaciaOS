"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { RecommendedAction } from "../types";
import {
  Compass,
  Phone,
  Mail,
  Calendar,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface RecommendedActionCardProps {
  action: RecommendedAction;
  leadName?: string;
  leadPhone?: string;
  leadEmail?: string;
  onExecute?: (actionType: string) => void;
  className?: string;
}

const PRIORITY_BADGES: Record<
  RecommendedAction["priority"],
  { label: string; className: string }
> = {
  Immediate: {
    label: "Immediate Action Required",
    className: "bg-rose-50 text-rose-800 border-rose-200 animate-pulse",
  },
  Scheduled: {
    label: "Scheduled Directive",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  Routine: {
    label: "Routine Touchpoint",
    className: "bg-stone-100 text-stone-700 border-stone-200",
  },
};

const CHANNEL_CONFIG: Record<
  RecommendedAction["suggestedChannel"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  call: { label: "Phone Call", icon: Phone },
  email: { label: "Email", icon: Mail },
  in_person: { label: "Site Inspection", icon: Calendar },
  whatsapp: { label: "Email", icon: Mail },
};

export function RecommendedActionCard({
  action,
  leadName,
  leadPhone,
  leadEmail,
  onExecute,
  className,
}: RecommendedActionCardProps) {
  const priorityConfig = PRIORITY_BADGES[action.priority] || PRIORITY_BADGES.Routine;
  const channelConfig = CHANNEL_CONFIG[action.suggestedChannel] || CHANNEL_CONFIG.call;
  const ChannelIcon = channelConfig.icon;

  const handleAction = (type: string, description: string) => {
    onExecute?.(type);
    toast.success(`Action Protocol Triggered: ${type}`, {
      description,
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3",
        className
      )}
    >
      {/* Header with Title and Priority */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 leading-none">
              Recommended Broker Directive
            </h4>
            {action.dueTimeFormatted && (
              <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-stone-400" />
                Target Window: {action.dueTimeFormatted}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn("gap-1 text-[11px] font-semibold py-0.5 px-2", priorityConfig.className)}
          >
            <Zap className="h-3 w-3 shrink-0" />
            <span>{priorityConfig.label}</span>
          </Badge>

          <Badge
            variant="outline"
            className="gap-1 text-[11px] font-medium bg-stone-50 text-stone-700 border-stone-200 py-0.5 px-2"
          >
            <ChannelIcon className="h-3 w-3 text-stone-500" />
            <span>{channelConfig.label}</span>
          </Badge>
        </div>
      </div>

      {/* Action Title & Directive Details */}
      <div className="space-y-1.5">
        <h5 className="text-sm font-semibold text-stone-900 tracking-tight flex items-center gap-1.5">
          <span>{action.title}</span>
        </h5>
        <p className="text-xs text-stone-600 leading-relaxed">
          {action.directive}
        </p>
      </div>

      {/* Protocol Guidance / Script Box */}
      <div className="rounded-lg bg-stone-50 border border-stone-200/70 p-2.5 text-xs text-stone-700 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-stone-500" />
          <span>Execution Protocol</span>
        </span>
        <p className="text-xs text-stone-800 leading-relaxed font-sans pl-5">
          {action.actionProtocol}
        </p>
      </div>

      {/* Quick 1-Click Execution Buttons */}
      <div className="pt-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="h-8 gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium cursor-pointer"
          onClick={() => {
            handleAction(
              "Direct Phone Call",
              `Connecting to ${leadName || "prospect"} via phone ${leadPhone || ""}`
            );
            if (leadPhone) {
              window.location.href = `tel:${leadPhone.replace(/\s+/g, "")}`;
            }
          }}
        >
          <Phone className="h-3.5 w-3.5" />
          <span>Call ({leadPhone ? leadPhone.split(" ")[0] : "Initiate"})</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-white hover:bg-stone-50 text-stone-700 border-stone-200 text-xs font-medium shadow-2xs cursor-pointer"
          onClick={() => {
            handleAction(
              "Executive Email Dispatch",
              `Drafting outbound executive email for ${leadName || "prospect"}${leadEmail ? ` (${leadEmail})` : ""}`
            );
            if (leadEmail) {
              window.location.href = `mailto:${leadEmail}?subject=${encodeURIComponent(`Spacia Advisory: ${action.title}`)}`;
            }
          }}
        >
          <Mail className="h-3.5 w-3.5 text-stone-600" />
          <span>Send Email</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-white hover:bg-stone-50 text-stone-700 border-stone-200 text-xs font-medium shadow-2xs cursor-pointer"
          onClick={() =>
            handleAction(
              "Inspection Booking",
              `Opening calendar viewing drawer for ${leadName || "prospect"}`
            )
          }
        >
          <Calendar className="h-3.5 w-3.5 text-stone-500" />
          <span>Schedule Viewing</span>
        </Button>
      </div>
    </div>
  );
}
