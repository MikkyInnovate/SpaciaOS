"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { HandoffContext } from "../types";
import {
  AlertTriangle,
  Flame,
  UserCheck,
  Quote,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface HandoffContextCardProps {
  handoffContext?: HandoffContext;
  handoff?: HandoffContext;
  className?: string;
}

const CATEGORY_CONFIG: Record<
  HandoffContext["triggerCategory"],
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  negotiation: {
    label: "Price Negotiation Detected",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: AlertTriangle,
  },
  objection: {
    label: "Complex Legal / Title Objection",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: ShieldAlert,
  },
  high_value: {
    label: "High-Value Transaction Tier",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: Flame,
  },
  manual_broker: {
    label: "Manual Broker Takeover",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    icon: UserCheck,
  },
  prospect_request: {
    label: "Prospect Requested Human Broker",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    icon: MessageSquare,
  },
};

export function HandoffContextCard({
  handoffContext,
  handoff,
  className,
}: HandoffContextCardProps) {
  const context = handoffContext || handoff;
  if (!context) return null;

  const categoryConfig =
    CATEGORY_CONFIG[context.triggerCategory] || CATEGORY_CONFIG.manual_broker;
  const CategoryIcon = categoryConfig.icon;

  return (
    <div
      className={cn(
        "rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50/60 via-white to-sky-50/30 p-4 shadow-2xs space-y-3.5",
        className
      )}
    >
      {/* Header with trigger category and takeover timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("gap-1.5 px-2 py-0.5 text-xs font-semibold shadow-2xs", categoryConfig.badgeClass)}
          >
            <CategoryIcon className="h-3.5 w-3.5 shrink-0" />
            <span>{categoryConfig.label}</span>
          </Badge>
          <span className="text-[11px] text-stone-500 font-medium">
            Triggered {context.handedOffAt}
          </span>
        </div>

        {context.brokerName && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-700">
            <UserCheck className="h-3.5 w-3.5 text-sky-700 shrink-0" />
            <span>Active Broker: <strong className="text-stone-900 font-semibold">{context.brokerName}</strong></span>
          </div>
        )}
      </div>

      {/* Trigger reason banner */}
      <div className="rounded-lg bg-white/80 border border-sky-200/60 p-2.5">
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 shrink-0 mt-0.5">
            Handoff Catalyst:
          </span>
          <p className="text-xs font-semibold text-stone-900 leading-snug">
            {context.triggerReason}
          </p>
        </div>
      </div>

      {/* Conversational Synthesis */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">
          <Sparkles className="h-3.5 w-3.5 text-[#0d4a36]" />
          <span>AI Discovery Synthesis</span>
        </div>
        <p className="text-xs text-stone-700 leading-relaxed pl-5 font-normal">
          {context.synthesis}
        </p>
      </div>

      {/* Key Quotes from Prospect */}
      {context.keyQuotes && context.keyQuotes.length > 0 && (
        <div className="space-y-1.5 pl-2 border-l-2 border-sky-300">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Quote className="h-3 w-3 text-sky-700 shrink-0" />
            <span>Direct Prospect Statement</span>
          </span>
          {context.keyQuotes.map((quote, idx) => (
            <p
              key={idx}
              className="text-xs italic text-stone-800 font-serif leading-relaxed bg-white/60 rounded px-2 py-1"
            >
              &ldquo;{quote}&rdquo;
            </p>
          ))}
        </div>
      )}

      {/* Unresolved Objections Flagged */}
      {context.unresolvedObjections && context.unresolvedObjections.length > 0 && (
        <div className="pt-2 border-t border-sky-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-rose-800 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            <span>Unresolved Question:</span>
          </span>
          {context.unresolvedObjections.map((obj, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-md bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[11px] font-medium text-rose-800"
            >
              {obj}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
