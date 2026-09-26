"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { CallSummary } from "../types";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRightCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface CallSummaryCardProps {
  summary?: CallSummary | null;
  leadName?: string;
  className?: string;
}

export function CallSummaryCard({
  summary,
  leadName = "Prospect",
  className,
}: CallSummaryCardProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  if (!summary) {
    return (
      <div
        className={cn(
          "rounded-xl border border-stone-200 bg-white p-6 shadow-2xs text-center space-y-2",
          className
        )}
      >
        <div className="flex h-9 w-9 mx-auto items-center justify-center rounded-full bg-emerald-50 text-[#0d4a36]">
          <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
        </div>
        <h4 className="text-xs font-semibold text-stone-900">
          Executive AI Voice Brief Pending
        </h4>
        <p className="text-[11px] text-stone-500 max-w-xs mx-auto leading-relaxed">
          Structured synthesis, key takeaways, and next actions will be automatically generated upon call completion.
        </p>
      </div>
    );
  }

  const handleCopySummary = () => {
    const text = `*EXECUTIVE CALL BRIEF — ${leadName.toUpperCase()}*
Synthesis: ${summary.synthesis}

Key Takeaways:
${summary.keyTakeaways.map((t) => `• ${t}`).join("\n")}

Objections Raised:
${summary.objectionsRaised.length > 0 ? summary.objectionsRaised.map((o) => `• ${o}`).join("\n") : "• None identified"}

Action Items:
${summary.actionItems.map((a) => `• ${a}`).join("\n")}

Suggested Next Step: ${summary.suggestedNextStep || "Review conversation"}`;

    navigator.clipboard.writeText(text);
    setHasCopied(true);
    toast.success("Executive Brief Copied", {
      description: "Formatted call briefing copied to clipboard.",
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0d4a36] text-white">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-stone-900">
              Executive AI Voice Brief
            </h4>
            <span className="text-[10px] text-stone-400 block font-mono">
              Synthesized from speech recognition stream
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopySummary}
          className="h-7 text-xs gap-1.5 bg-white text-stone-700 hover:text-stone-900 shadow-2xs"
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
      </div>

      {/* 1. Core Synthesis */}
      <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
          Primary Call Synthesis
        </span>
        <p className="text-xs text-stone-800 leading-relaxed font-normal">
          {summary.synthesis}
        </p>
      </div>

      {/* 2. Key Takeaways */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <span>Key Verified Facts</span>
        </span>
        <div className="space-y-1">
          {summary.keyTakeaways.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-xs text-stone-700 rounded-md bg-stone-50/80 border border-stone-100 p-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <span className="leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Identified Objections */}
      {summary.objectionsRaised.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            <span>Friction Points & Questions</span>
          </span>
          <div className="space-y-1">
            {summary.objectionsRaised.map((obj, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-amber-900 rounded-md bg-amber-50/50 border border-amber-200/80 p-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span className="leading-snug">{obj}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Action Directives */}
      <div className="space-y-1.5 pt-1 border-t border-stone-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
          <ArrowRightCircle className="h-3 w-3 text-stone-700" />
          <span>Recommended Broker Protocol</span>
        </span>
        <div className="space-y-1">
          {summary.actionItems.map((action, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-xs text-stone-800 rounded-md bg-white border border-stone-200 p-2 shadow-2xs font-medium"
            >
              <span className="text-emerald-700 font-bold shrink-0">→</span>
              <span className="leading-snug">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
