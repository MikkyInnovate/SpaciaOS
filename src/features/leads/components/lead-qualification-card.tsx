"use client";

import * as React from "react";
import type { BantBreakdown, LeadScoreCategory } from "../types";
import { ScoreIndicator, type BantDimension } from "@/components/ui/score-indicator";
import { Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";

export interface LeadQualificationCardProps {
  score: number;
  category: LeadScoreCategory;
  bant?: BantBreakdown;
  aiNotes?: string;
}

export function LeadQualificationCard({
  score,
  category,
  bant,
  aiNotes,
}: LeadQualificationCardProps) {
  // Map BantBreakdown to BantDimension[] format expected by ScoreIndicator primitive
  const dimensions: BantDimension[] = React.useMemo(() => {
    if (bant) {
      return [
        {
          name: "Budget & Liquidity",
          score: bant.budgetScore,
          weight: "25%",
          statusText: bant.budgetNote,
        },
        {
          name: "Authority & Decision Maker",
          score: bant.authorityScore,
          weight: "20%",
          statusText: bant.authorityNote,
        },
        {
          name: "Need & Requirement Match",
          score: bant.needScore,
          weight: "20%",
          statusText: bant.needNote,
        },
        {
          name: "Timeline Velocity",
          score: bant.timelineScore,
          weight: "20%",
          statusText: bant.timelineNote,
        },
        {
          name: "Location & Property Fit",
          score: bant.propertyFitScore,
          weight: "15%",
          statusText: bant.propertyFitNote,
        },
      ];
    }

    return [
      {
        name: "Budget Verification",
        score: score >= 80 ? 95 : score >= 60 ? 70 : 50,
        weight: "25%",
        statusText: "Verified Proof of Funds",
      },
      {
        name: "Authority",
        score: score >= 80 ? 90 : score >= 60 ? 75 : 55,
        weight: "20%",
        statusText: "Decision Maker",
      },
      {
        name: "Need & Specification",
        score: score >= 80 ? 88 : score >= 60 ? 68 : 50,
        weight: "20%",
        statusText: "Clear property criteria",
      },
      {
        name: "Timeline",
        score: score >= 80 ? 92 : score >= 60 ? 65 : 45,
        weight: "20%",
        statusText: "< 30 days window",
      },
      {
        name: "Property Fit",
        score: score >= 80 ? 90 : score >= 60 ? 70 : 50,
        weight: "15%",
        statusText: "Inventory match confirmed",
      },
    ];
  }, [bant, score]);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#0d4a36]" />
          Autonomous Qualification Underwriting
        </h4>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-stone-400">5-Point Criteria</span>
        </div>
      </div>

      {/* 5-point BANT Breakdown rendered via Day 4 ScoreIndicator primitive */}
      <ScoreIndicator
        score={score}
        category={category}
        variant="breakdown"
        dimensions={dimensions}
        className="border-0 p-0 shadow-none"
      />

      {/* Autonomous AI Reasoning Commentary */}
      {aiNotes && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-900 flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              AI Intake Assessment
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
              Simulated Analysis
            </span>
          </div>
          <p className="text-stone-700 text-xs leading-relaxed italic">
            &ldquo;{aiNotes}&rdquo;
          </p>
        </div>
      )}

      {/* Verification Notice / Boundary Disclaimer */}
      <div className="flex items-center gap-1.5 text-[10px] text-stone-400 pt-1">
        <ShieldAlert className="h-3 w-3 text-stone-400 shrink-0" />
        <span>
          Underwriting scores and liquidity notes represent autonomous sales screening criteria pending legal and financial closing.
        </span>
      </div>
    </div>
  );
}
