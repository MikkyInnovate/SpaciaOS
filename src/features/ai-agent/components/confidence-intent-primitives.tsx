"use client";

import React from "react";
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Compass, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  AlertCircle,
  LucideIcon,
  ArrowRight,
  CalendarCheck,
  CreditCard,
  Banknote
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import type { 
  BuyerIntentCategory, 
  IntentSignal, 
  BuyerIntentEvaluation 
} from "../types";

// ============================================================================
// 1. BUYER INTENT CONFIGURATION & BADGES
// ============================================================================

export interface BuyerIntentMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: LucideIcon;
  description: string;
}

export const BUYER_INTENT_META: Record<BuyerIntentCategory, BuyerIntentMeta> = {
  high_purchase_intent: {
    label: "High Purchase Intent",
    badgeClass: "bg-emerald-50/80 text-[#0d4a36] border-emerald-200/90",
    dotClass: "bg-[#0d4a36]",
    icon: Target,
    description: "Verified budget, immediate closing timeline (<30d), and explicit property requirements match.",
  },
  investment_yield_seeking: {
    label: "Yield Seeking Investor",
    badgeClass: "bg-blue-50/70 text-blue-900 border-blue-200/80",
    dotClass: "bg-blue-600",
    icon: TrendingUp,
    description: "Evaluates rental yields, off-plan capital appreciation, and structured payment plans.",
  },
  luxury_relocation: {
    label: "Luxury Relocation",
    badgeClass: "bg-purple-50/70 text-purple-900 border-purple-200/80",
    dotClass: "bg-purple-600",
    icon: Sparkles,
    description: "High net-worth buyer seeking prime luxury residence with bespoke finishings and security.",
  },
  exploratory: {
    label: "Exploratory / Research",
    badgeClass: "bg-amber-50/70 text-amber-900 border-amber-200/80",
    dotClass: "bg-amber-600",
    icon: Compass,
    description: "Early market research phase; unclear liquidity or tentative timeline (>6 months).",
  },
  unqualified: {
    label: "Unqualified",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
    dotClass: "bg-stone-400",
    icon: HelpCircle,
    description: "Budget mismatch with prime inventory or non-responsive to qualification criteria.",
  },
};

export interface BuyerIntentBadgeProps {
  category: BuyerIntentCategory;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BuyerIntentBadge({
  category,
  showIcon = true,
  size = "md",
  className,
}: BuyerIntentBadgeProps) {
  const meta = BUYER_INTENT_META[category] ?? BUYER_INTENT_META.exploratory;
  const Icon = meta.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1 text-xs gap-2 font-medium",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-semibold transition-colors shadow-2xs select-none",
        meta.badgeClass,
        sizeClasses,
        className
      )}
    >
      {showIcon && <Icon className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />}
      <span>{meta.label}</span>
    </span>
  );
}

// ============================================================================
// 2. CONFIDENCE GAUGE
// ============================================================================

export interface IntentConfidenceGaugeProps {
  score: number; // 0 to 100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showBar?: boolean;
  className?: string;
}

export function IntentConfidenceGauge({
  score,
  size = "md",
  showLabel = true,
  showBar = true,
  className,
}: IntentConfidenceGaugeProps) {
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  const getTier = (val: number) => {
    if (val >= 80) {
      return {
        label: "High Certainty",
        textClass: "text-[#0d4a36]",
        barClass: "bg-[#0d4a36]",
      };
    }
    if (val >= 60) {
      return {
        label: "Moderate Certainty",
        textClass: "text-amber-700",
        barClass: "bg-amber-500",
      };
    }
    return {
      label: "Low Certainty",
      textClass: "text-rose-700",
      barClass: "bg-rose-500",
    };
  };

  const tier = getTier(clampedScore);

  if (size === "sm") {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        {showBar && (
          <div className="w-14 h-1.5 rounded-full bg-stone-100 border border-stone-200/70 overflow-hidden">
            <div
              className={cn("h-full transition-all duration-300", tier.barClass)}
              style={{ width: `${clampedScore}%` }}
            />
          </div>
        )}
        <span className={cn("text-xs font-semibold tabular-nums font-mono", tier.textClass)}>
          {clampedScore}%
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
          Confidence Score
        </span>
        <div className="flex items-center gap-1.5 font-mono">
          {showLabel && (
            <span className={cn("text-[11px] font-medium font-sans", tier.textClass)}>
              {tier.label}
            </span>
          )}
          <span className={cn("font-bold text-xs tabular-nums", tier.textClass)}>
            {clampedScore}%
          </span>
        </div>
      </div>
      {showBar && (
        <div className="w-full h-1.5 rounded-full bg-stone-100 border border-stone-200/70 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", tier.barClass)}
            style={{ width: `${clampedScore}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. INTENT SIGNAL PILL (DISCIPLINED ARCHITECTURAL CHIP)
// ============================================================================

export interface IntentSignalPillProps {
  signal: IntentSignal;
  className?: string;
}

const SIGNAL_ICONS: Record<IntentSignal["type"], React.ComponentType<{ className?: string }>> = {
  budget: Banknote,
  timeline: Clock,
  authority: Target,
  property_fit: Building2,
  objection: AlertCircle,
};

export function IntentSignalPill({ signal, className }: IntentSignalPillProps) {
  const Icon = SIGNAL_ICONS[signal.type] ?? Sparkles;
  const displayLabel = signal.label || signal.text || "Signal";

  const isWarning = signal.type === "objection" || signal.strength === "low";
  const isHighStrength = signal.strength === "high";

  return (
    <div
      title={signal.evidence || signal.text}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors select-none shadow-2xs",
        isWarning
          ? "bg-amber-50/70 text-amber-900 border-amber-200/90"
          : "bg-white text-stone-800 border-stone-200 hover:border-stone-300 hover:bg-stone-50/60",
        className
      )}
    >
      <Icon
        className={cn(
          "w-3.5 h-3.5 shrink-0",
          isWarning
            ? "text-amber-600"
            : isHighStrength
            ? "text-[#0d4a36]"
            : "text-stone-400"
        )}
      />
      <span className="leading-none">{displayLabel}</span>
    </div>
  );
}

// ============================================================================
// 4. BUYER INTENT EVALUATION CARD
// ============================================================================

export interface BuyerIntentCardProps {
  evaluation: BuyerIntentEvaluation;
  onSelectAction?: (leadId: string, action: string) => void;
  autoDispatch?: boolean;
  className?: string;
}

export function BuyerIntentCard({
  evaluation,
  onSelectAction,
  autoDispatch = false,
  className,
}: BuyerIntentCardProps) {
  const category = evaluation.intentCategory || evaluation.category;
  const signals = evaluation.signals || evaluation.intentSignals || [];
  const actionText = evaluation.nextRecommendedAction || evaluation.recommendedAction;
  const leadId = evaluation.leadId || evaluation.id;
  const leadName = evaluation.leadName || `Lead #${leadId.slice(0, 6)}`;

  return (
    <div
      className={cn(
        "rounded-lg border border-stone-200/90 bg-white p-4 shadow-2xs hover:border-stone-300 transition-colors space-y-3",
        className
      )}
    >
      {/* Header: Lead identity and intent badge */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h4 className="text-sm font-semibold text-stone-900 tracking-tight">
            {leadName}
          </h4>
          <ScoreIndicator score={evaluation.confidenceScore} variant="badge" size="sm" />
        </div>
        <div>
          <BuyerIntentBadge category={category} size="sm" />
        </div>
      </div>

      {/* Confidence Gauge */}
      <IntentConfidenceGauge score={evaluation.confidenceScore} />

      {/* Synthesis Quote / Summary with Architectural Left Laser Line */}
      <div className="rounded-md border-l-2 border-[#0d4a36] bg-stone-50/70 border-y border-r border-stone-200/80 p-2.5 text-xs text-stone-800 leading-relaxed font-normal shadow-2xs">
        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-0.5">
          AI Executive Synthesis
        </span>
        &ldquo;{evaluation.summary}&rdquo;
      </div>

      {/* Extracted Signals */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
          <span>Extracted Signals</span>
          <span className="font-mono text-stone-400">({signals.length})</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {signals.map((sig: IntentSignal) => (
            <IntentSignalPill key={sig.id} signal={sig} />
          ))}
        </div>
      </div>

      {/* Post-Call Company Calendar Booking (Autonomous AI Result) */}
      {evaluation.scheduledEvent && (
        <div className="flex items-center justify-between gap-2 rounded-md bg-emerald-50/50 border border-emerald-200/90 p-2.5 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white border border-emerald-200 text-[#0d4a36] shrink-0 shadow-2xs">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-900 text-xs truncate">
                  {evaluation.scheduledEvent.type === "inspection"
                    ? "Physical Inspection Booked"
                    : evaluation.scheduledEvent.type === "virtual_tour"
                    ? "Virtual Tour Scheduled"
                    : "Follow-up Scheduled"}
                </span>
                <span className="rounded-[3px] bg-emerald-100/90 text-[9px] font-mono font-semibold text-emerald-900 px-1.5 py-0.2 border border-emerald-200/80">
                  Company Calendar
                </span>
              </div>
              <p className="text-[11px] text-stone-600 font-mono mt-0.5 truncate">
                {evaluation.scheduledEvent.scheduledTime}
                {evaluation.scheduledEvent.assignedBroker
                  ? ` · Lead: ${evaluation.scheduledEvent.assignedBroker}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Human Role & Closing Action */}
      <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-stone-600 truncate">
          <span className="font-semibold text-stone-900 text-[11px] uppercase tracking-wider text-stone-500">
            {evaluation.humanActionStage === "awaiting_closing_payment"
              ? "Human Stage:"
              : "Next Action:"}
          </span>
          <span className="truncate text-stone-700 text-xs">
            {evaluation.humanActionStage === "awaiting_closing_payment"
              ? "AI scheduled inspection · Closer handles showing & payment"
              : actionText}
          </span>
        </div>

        {evaluation.humanActionStage === "awaiting_closing_payment" ? (
          onSelectAction && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onSelectAction(leadId, "Initiate Closing & Payment Escrow")}
              className="h-7 px-2.5 text-xs font-semibold bg-[#0d4a36] hover:bg-[#093829] text-white shadow-2xs cursor-pointer shrink-0 gap-1.5 rounded-md"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Collect Payment</span>
            </Button>
          )
        ) : autoDispatch ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0d4a36] bg-emerald-50 border border-emerald-200/80 rounded-md px-2 py-0.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0d4a36]" /> Calendar Synced
          </span>
        ) : (
          onSelectAction && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSelectAction(leadId, actionText)}
              className="h-7 px-2.5 text-xs font-semibold text-[#0d4a36] hover:bg-stone-100 cursor-pointer shrink-0 rounded-md"
            >
              View Calendar <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}
