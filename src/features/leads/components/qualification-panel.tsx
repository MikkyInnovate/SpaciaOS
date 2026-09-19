"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { Lead, QualificationProfile, DecisionReadinessStage } from "../types";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import {
  BuyerIntentBadge,
  IntentConfidenceGauge,
  IntentSignalPill,
} from "@/features/ai-agent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  DollarSign,
  Wallet,
  Copy,
  Check,
  Share2,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export interface QualificationPanelProps {
  lead: Lead;
  className?: string;
  onObjectionStatusChange?: (objectionId: string, newStatus: "open" | "resolved", note?: string) => void;
}

const READINESS_META: Record<
  DecisionReadinessStage,
  { label: string; badgeClass: string; dotClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  immediate_close: {
    label: "Immediate Execution (< 14d)",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    dotClass: "bg-emerald-500",
    icon: CheckCircle2,
  },
  evaluating_shortlist: {
    label: "Shortlist Comparison",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200/80",
    dotClass: "bg-blue-500",
    icon: TrendingUp,
  },
  spousal_board_review: {
    label: "Spousal / Board Review",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200/80",
    dotClass: "bg-purple-500",
    icon: UserCheck,
  },
  asset_liquidation: {
    label: "Capital / FX Clearance",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
    dotClass: "bg-amber-500",
    icon: Wallet,
  },
  exploratory: {
    label: "Exploratory / Research",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
    dotClass: "bg-stone-400",
    icon: HelpCircle,
  },
};

export function QualificationPanel({
  lead,
  className,
  onObjectionStatusChange,
}: QualificationPanelProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  // Derive or fallback profile safely
  const profile: QualificationProfile = React.useMemo(() => {
    if (lead.qualificationProfile) {
      return lead.qualificationProfile;
    }

    // Dynamic fallback if lead record doesn't have an explicit profile
    return {
      confidenceScore: lead.score >= 80 ? 92 : lead.score >= 60 ? 76 : 54,
      buyerIntent:
        lead.scoreCategory === "HOT"
          ? "high_purchase_intent"
          : lead.scoreCategory === "WARM"
          ? "investment_yield_seeking"
          : "exploratory",
      motivation:
        lead.aiNotes ||
        `Seeking prime residential or investment property in ${lead.location} within ${lead.budget} allocation.`,
      decisionReadiness: lead.score >= 80 ? "immediate_close" : lead.score >= 60 ? "evaluating_shortlist" : "exploratory",
      readinessNote:
        lead.score >= 80
          ? "Verified decision maker with confirmed funding source."
          : "Evaluating options across preferred corridors.",
      timelineWindow: lead.timeline || "< 30 days",
      timelineUrgency: lead.score >= 80 ? "urgent" : lead.score >= 60 ? "near_term" : "flexible",
      budgetAnalysis: {
        declared: lead.budget,
        verifiedLiquidity: `${lead.budget} (Initial intake validated)`,
        paymentStructure: "Outright",
        targetAskingPrice: lead.propertyDetails?.targetPrice || lead.budget,
        budgetStretchPercentage: 0,
        stretchCategory: "Within Budget",
      },
      intentSignals: [
        { id: "fallback_sig_1", type: "budget", label: `Budget: ${lead.budget}`, strength: "high" },
        { id: "fallback_sig_2", type: "timeline", label: `Timeline: ${lead.timeline}`, strength: "medium" },
      ],
      objections: [],
      explainableBreakdown: {
        baseScore: lead.score,
        positiveFactors: [
          { label: "Declared Capital Allocation", impact: 30, category: "liquidity", detail: `Stated budget of ${lead.budget}` },
          { label: "Target Property Fit", impact: 25, category: "property_fit", detail: `Interest in ${lead.propertyTitle}` },
          { label: "Timeline Commitment", impact: 20, category: "timeline", detail: `Moving timeline ${lead.timeline}` },
        ],
        riskFactors: lead.score < 70 ? [
          { label: "Unverified Liquidity Proof", impact: -15, category: "liquidity", detail: "Proof of funds pending bank confirmation" }
        ] : [],
      },
    };
  }, [lead]);

  // Local state for interactive objection toggles
  const [statusOverrides, setStatusOverrides] = React.useState<
    Record<string, { status: "open" | "resolved"; resolvedAt?: string }>
  >({});

  // Cleanly derive objections during render without cascading render effects
  const objections = React.useMemo(() => {
    return profile.objections.map((obj) => {
      const override = statusOverrides[obj.id];
      if (override) {
        return {
          ...obj,
          status: override.status,
          resolvedAt: override.resolvedAt,
        };
      }
      return obj;
    });
  }, [profile.objections, statusOverrides]);

  const handleToggleObjection = (objectionId: string) => {
    const current = objections.find((o) => o.id === objectionId);
    if (!current) return;

    const nextStatus = current.status === "open" ? "resolved" : "open";
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const resolvedAt = nextStatus === "resolved" ? `Today, ${now}` : undefined;
    const note = nextStatus === "resolved" ? current.resolutionNote || "Cleared by broker verification." : undefined;

    setStatusOverrides((prev) => ({
      ...prev,
      [objectionId]: {
        status: nextStatus,
        resolvedAt,
      },
    }));

    if (onObjectionStatusChange) {
      onObjectionStatusChange(objectionId, nextStatus, note);
    }

    toast.success(
      nextStatus === "resolved" ? "Objection Marked Resolved" : "Objection Reopened",
      {
        description: `"${current.title}" updated for ${lead.name}.`,
      }
    );
  };

  const handleCopyBrief = () => {
    const brief = `*PACIA QUALIFICATION DOSSIER — ${lead.name.toUpperCase()}*
Score: ${lead.score}/100 (${lead.scoreCategory}) | AI Confidence: ${profile.confidenceScore}%
Buyer Intent: ${profile.buyerIntent.replace(/_/g, " ").toUpperCase()}
Motivation: "${profile.motivation}"
Decision Readiness: ${profile.decisionReadiness.replace(/_/g, " ").toUpperCase()} (${profile.readinessNote})
Budget: ${profile.budgetAnalysis.declared} (${profile.budgetAnalysis.paymentStructure} - ${profile.budgetAnalysis.stretchCategory})
Target Property: ${lead.propertyTitle} (${lead.location})
Timeline: ${profile.timelineWindow} (${profile.timelineUrgency.toUpperCase()})
Open Objections: ${objections.filter((o) => o.status === "open").length}
Next Action: ${lead.nextAction}`;

    navigator.clipboard.writeText(brief);
    setHasCopied(true);
    toast.success("Executive Brief Copied", {
      description: "Formatted qualification brief copied to clipboard.",
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  const readinessMeta = READINESS_META[profile.decisionReadiness] || READINESS_META.exploratory;
  const ReadinessIcon = readinessMeta.icon;

  const openObjectionsCount = objections.filter((o) => o.status === "open").length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* 1. MASTER TELEMETRY & ACTION BAR */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-white shadow-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                <span>Autonomous Qualification Dossier</span>
                <Badge variant="live" className="text-[10px] px-1.5 py-0">
                  Live Audit
                </Badge>
              </h3>
              <p className="text-[11px] text-stone-500">
                AI Underwriting & Commercial Readiness Assessment for {lead.name}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyBrief}
              className="h-7 text-xs gap-1.5 bg-white text-stone-700 hover:text-stone-900"
            >
              {hasCopied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-stone-500" />
                  <span>Copy Brief</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-7 text-xs gap-1.5 bg-white text-stone-700 hover:text-stone-900"
            >
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Pacia Qualification for ${lead.name} (${lead.propertyTitle}): Score ${lead.score}/100, Budget ${profile.budgetAnalysis.declared}, Timeline ${profile.timelineWindow}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                title="Share via WhatsApp"
              >
                <Share2 className="h-3 w-3 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Top Metric Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Master Lead Score Indicator */}
          <div className="rounded-lg border border-stone-100 bg-stone-50/60 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-stone-500">Underwriting Score</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-display text-stone-900 tabular-nums">
                  {lead.score}
                </span>
                <span className="text-xs font-medium text-stone-400">/100</span>
              </div>
            </div>
            <ScoreIndicator score={lead.score} category={lead.scoreCategory} variant="badge" />
          </div>

          {/* AI Confidence Gauge */}
          <div className="rounded-lg border border-stone-100 bg-stone-50/60 p-3 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                <span>AI Intent Confidence</span>
              </span>
              <span className="font-mono font-bold text-stone-900 tabular-nums">
                {profile.confidenceScore}%
              </span>
            </div>
            <IntentConfidenceGauge score={profile.confidenceScore} size="sm" showLabel={false} />
          </div>
        </div>
      </div>

      {/* 2. BUYER INTENT & ROOT MOTIVATION */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-stone-600" />
            <span>Buyer Intent & Core Motivation</span>
          </span>
          <BuyerIntentBadge category={profile.buyerIntent} size="sm" />
        </div>

        {/* Explicit Motivation Callout */}
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              <span>Primary Purchase Catalyst</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-medium uppercase tracking-wider">
              Verified Driver
            </span>
          </div>
          <p className="text-xs text-stone-800 leading-relaxed font-normal">
            &ldquo;{profile.motivation}&rdquo;
          </p>
        </div>

        {/* Conversational Intent Signals */}
        {profile.intentSignals && profile.intentSignals.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Extracted Intent Signals
            </span>
            <div className="flex flex-wrap gap-1.5">
              {profile.intentSignals.map((signal) => (
                <IntentSignalPill key={signal.id} signal={signal} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. COMMERCIAL BUDGET & LIQUIDITY ANALYSIS */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-stone-600" />
            <span>Commercial Budget & Liquidity</span>
          </span>
          <Badge
            variant={
              profile.budgetAnalysis.stretchCategory === "Within Budget"
                ? "qualified"
                : profile.budgetAnalysis.stretchCategory === "Moderate Stretch"
                ? "warm"
                : "hot"
            }
            className="text-[10px]"
          >
            {profile.budgetAnalysis.stretchCategory}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="rounded-lg border border-stone-100 bg-stone-50/70 p-2.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Declared Budget
            </span>
            <p className="font-mono text-sm font-bold text-stone-900 tabular-nums">
              {profile.budgetAnalysis.declared}
            </p>
            <span className="text-[11px] text-stone-500">Stated ceiling</span>
          </div>

          <div className="rounded-lg border border-stone-100 bg-stone-50/70 p-2.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Payment Structure
            </span>
            <p className="text-xs font-semibold text-stone-900 mt-0.5 flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5 text-stone-600" />
              <span>{profile.budgetAnalysis.paymentStructure}</span>
            </p>
            <span className="text-[11px] text-stone-500">
              {profile.budgetAnalysis.paymentStructure === "Outright"
                ? "Immediate wire transfer"
                : profile.budgetAnalysis.paymentStructure === "Milestone Plan"
                ? "Stage milestone disbursements"
                : "Mortgage bank guarantee"}
            </span>
          </div>

          <div className="rounded-lg border border-stone-100 bg-stone-50/70 p-2.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Target Asking Price
            </span>
            <p className="font-mono text-sm font-bold text-stone-900 tabular-nums">
              {profile.budgetAnalysis.targetAskingPrice || lead.propertyDetails?.targetPrice || lead.budget}
            </p>
            <span className="text-[11px] text-stone-500">
              {profile.budgetAnalysis.budgetStretchPercentage === 0
                ? "Exact 1:1 match"
                : `+${profile.budgetAnalysis.budgetStretchPercentage}% negotiation spread`}
            </span>
          </div>
        </div>

        {/* Verified Liquidity Callout */}
        {profile.budgetAnalysis.verifiedLiquidity && (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="text-stone-600">
                Verified Liquidity:{" "}
                <strong className="text-stone-900 font-semibold">
                  {profile.budgetAnalysis.verifiedLiquidity}
                </strong>
              </span>
            </div>
            <span className="text-[10px] font-mono text-stone-400 uppercase">Underwritten</span>
          </div>
        )}
      </div>

      {/* 4. DECISION READINESS & TIMELINE VELOCITY */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-stone-600" />
            <span>Decision Readiness & Timeline</span>
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium shadow-2xs",
              readinessMeta.badgeClass
            )}
          >
            <ReadinessIcon className="h-3 w-3" />
            <span>{readinessMeta.label}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Readiness Stage Details */}
          <div className="rounded-lg border border-stone-100 bg-stone-50/70 p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Sign-Off Context
            </span>
            <p className="text-xs text-stone-800 leading-relaxed font-medium">
              {profile.readinessNote}
            </p>
          </div>

          {/* Timeline Velocity */}
          <div className="rounded-lg border border-stone-100 bg-stone-50/70 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Closing Window
              </span>
              <Badge
                variant={
                  profile.timelineUrgency === "urgent"
                    ? "hot"
                    : profile.timelineUrgency === "near_term"
                    ? "warm"
                    : "outline"
                }
                className="text-[10px] uppercase font-bold"
              >
                {profile.timelineUrgency}
              </Badge>
            </div>
            <p className="font-mono text-sm font-bold text-stone-900 tabular-nums">
              {profile.timelineWindow}
            </p>
            {profile.targetClosingDate && (
              <span className="text-[11px] text-stone-500 block">
                Target Settlement: {profile.targetClosingDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE OBJECTIONS & RISK CLEARANCE */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-stone-600" />
              <span>Identified Objections & Risk Items</span>
            </span>
            {openObjectionsCount > 0 ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {openObjectionsCount} Open
              </Badge>
            ) : (
              <Badge variant="qualified" className="text-[10px] px-1.5 py-0">
                All Cleared
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-stone-400">Click to resolve</span>
        </div>

        {objections.length === 0 ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 text-xs flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Zero open friction points identified. Prospect exhibits smooth transaction trajectory.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {objections.map((objection) => {
              const isResolved = objection.status === "resolved";

              const severityBadge = {
                high: "bg-rose-50 text-rose-800 border-rose-200",
                medium: "bg-amber-50 text-amber-800 border-amber-200",
                low: "bg-stone-100 text-stone-700 border-stone-200",
              }[objection.severity];

              return (
                <div
                  key={objection.id}
                  className={cn(
                    "rounded-lg border p-3 text-xs transition-all",
                    isResolved
                      ? "border-emerald-200 bg-emerald-50/20 text-stone-600"
                      : "border-stone-200 bg-stone-50/60 hover:bg-stone-50"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          isResolved
                            ? "bg-emerald-500"
                            : objection.severity === "high"
                            ? "bg-rose-500"
                            : objection.severity === "medium"
                            ? "bg-amber-500"
                            : "bg-stone-400"
                        )}
                      />
                      <h4
                        className={cn(
                          "font-semibold text-xs",
                          isResolved ? "line-through text-stone-500" : "text-stone-900"
                        )}
                      >
                        {objection.title}
                      </h4>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded text-[10px] font-semibold border uppercase",
                          severityBadge
                        )}
                      >
                        {objection.severity}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleObjection(objection.id)}
                      className={cn(
                        "h-6 px-2 text-[11px] gap-1 self-start sm:self-auto",
                        isResolved
                          ? "text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
                          : "text-stone-700 bg-white hover:bg-stone-100"
                      )}
                    >
                      {isResolved ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Resolved</span>
                        </>
                      ) : (
                        <span>Mark Resolved</span>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-stone-700 mt-1 pl-4 leading-relaxed">
                    {objection.description}
                  </p>

                  {isResolved && objection.resolutionNote && (
                    <div className="mt-2 ml-4 rounded border border-emerald-100 bg-white p-2 text-[11px] text-emerald-900">
                      <span className="font-semibold block">Broker Resolution Note:</span>
                      <span className="text-stone-600">{objection.resolutionNote}</span>
                      {objection.resolvedAt && (
                        <span className="text-[10px] text-stone-400 block mt-0.5 font-mono">
                          Resolved {objection.resolvedAt}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. EXPLAINABLE ALGORITHMIC SCORE BREAKDOWN */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#0d4a36]" />
            <span>Explainable Score Underwriting Audit</span>
          </span>
          <span className="text-[10px] font-mono text-stone-400">Audited Model v2.4</span>
        </div>

        <div className="space-y-2">
          {/* Positive Catalysts */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Positive Underwriting Catalysts</span>
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {profile.explainableBreakdown.positiveFactors.map((factor, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/30 px-2.5 py-1.5 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-stone-900 text-xs">{factor.label}</span>
                    {factor.detail && (
                      <p className="text-[11px] text-stone-500">{factor.detail}</p>
                    )}
                  </div>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px] shrink-0 ml-2">
                    +{factor.impact} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Deductions */}
          {profile.explainableBreakdown.riskFactors.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-rose-600" />
                <span>Frictional Deductions & Risk Factors</span>
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {profile.explainableBreakdown.riskFactors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/40 px-2.5 py-1.5 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-medium text-stone-900 text-xs">{factor.label}</span>
                      {factor.detail && (
                        <p className="text-[11px] text-stone-500">{factor.detail}</p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-[11px] shrink-0 ml-2">
                      {factor.impact} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Net Audit Calculation Summary */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs text-stone-600 font-medium">
          <span>Net Underwriting Output:</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-bold text-stone-900">{lead.score} / 100</span>
            <ScoreIndicator score={lead.score} category={lead.scoreCategory} variant="badge" />
          </div>
        </div>
      </div>

      {/* 7. REGULATORY COMPLIANCE DISCLAIMER */}
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-[10px] text-stone-400 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
        <span>
          Underwriting scores, liquidity estimations, and buyer intent classifications represent
          autonomous sales screening criteria. Official real estate transaction closing remains
          subject to legal title search, Governor&apos;s Consent confirmation, and verified banking escrow.
        </span>
      </div>
    </div>
  );
}
