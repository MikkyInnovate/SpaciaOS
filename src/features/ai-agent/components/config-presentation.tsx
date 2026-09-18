"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { AIAgentConfiguration } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, ShieldCheck, Sliders, Volume2 } from "lucide-react";
import { toast } from "sonner";

export interface AIAgentConfigPresentationProps {
  config?: AIAgentConfiguration;
  configuration?: AIAgentConfiguration;
  onSaveConfig?: (newConfig: AIAgentConfiguration) => Promise<void> | void;
  className?: string;
}

export function AIAgentConfigPresentation({
  config,
  configuration,
  onSaveConfig,
  className,
}: AIAgentConfigPresentationProps) {
  const activeConfig = configuration ?? config;
  const [activeTab, setActiveTab] = React.useState<"persona" | "bant" | "guardrails">("persona");
  const [overrideAutoDispatch, setOverrideAutoDispatch] = React.useState<boolean | null>(null);
  const autoDispatch = overrideAutoDispatch ?? Boolean(activeConfig?.guardrails?.autoDispatchBookings);

  const handleToggleAutoDispatch = async (checked: boolean) => {
    if (!activeConfig) return;
    setOverrideAutoDispatch(checked);
    const updatedConfig: AIAgentConfiguration = {
      ...activeConfig,
      guardrails: {
        ...activeConfig.guardrails,
        autoDispatchBookings: checked,
      },
    };
    if (onSaveConfig) {
      await onSaveConfig(updatedConfig);
    }
    if (checked) {
      toast.success("Autonomous Auto-Pilot Active", {
        description:
          "High-intent buyer actions (>85% certainty) will execute automatically without manual clicks.",
      });
    } else {
      toast.info("Supervised Approval Mode Active", {
        description:
          "High-intent actions now require one-click manual approval via the 'Execute' button.",
      });
    }
  };

  if (!activeConfig) return null;

  return (
    <Card className={cn("rounded-lg border border-border bg-white shadow-2xs overflow-hidden", className)}>
      {/* Card Header matching Spacia Lead Intake Table header */}
      <div className="flex items-center justify-between border-b border-border p-4 bg-stone-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-stone-900">
              Agent Configuration
            </h2>
            <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Verified Core
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Voice persona, BANT qualification gates, and legal safety guardrails
          </p>
        </div>
      </div>

      {/* Tab Navigation matching Lead Dossier Panel in screenshot */}
      <div className="flex border-b border-border bg-stone-50/40 px-4 pt-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("persona")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 pb-2 text-xs font-semibold transition-colors cursor-pointer",
            activeTab === "persona"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          )}
        >
          <Volume2 className="h-3.5 w-3.5" />
          <span>Voice Persona</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bant")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 pb-2 text-xs font-semibold transition-colors cursor-pointer",
            activeTab === "bant"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          )}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>BANT Gates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("guardrails")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 pb-2 text-xs font-semibold transition-colors cursor-pointer",
            activeTab === "guardrails"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Guardrails &amp; Safety</span>
        </button>
      </div>

      <CardContent className="p-4">
        {/* TAB 1: VOICE PERSONA */}
        {activeTab === "persona" && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider">
                  Identity Name
                </span>
                <p className="font-semibold text-stone-900">{activeConfig.persona.name}</p>
                <p className="text-[11px] text-stone-400">{activeConfig.persona.identityTitle}</p>
              </div>

              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider">
                  Voice Engine
                </span>
                <p className="font-semibold text-stone-900">{activeConfig.persona.voiceModel}</p>
                <p className="text-[11px] text-stone-500 font-mono">{activeConfig.persona.accent}</p>
              </div>

              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider">
                  Verified Truth Policy
                </span>
                <p className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Enforced Strict</span>
                </p>
                <p className="text-[11px] text-stone-400">Never quotes unvetted prices or deeds</p>
              </div>

              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider">
                  Turn Parameters
                </span>
                <p className="font-mono font-semibold text-stone-900">
                  {activeConfig.persona.temperature} temp • {activeConfig.persona.interruptionToleranceMs}ms pause
                </p>
                <p className="text-[11px] text-stone-400">Calibrated for natural turn-taking</p>
              </div>
            </div>

            {/* Greeting Script Preview */}
            <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/70 space-y-1">
              <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
                Outbound Verification Script
              </span>
              <p className="text-xs text-stone-700 bg-white p-2.5 rounded border border-stone-200 leading-relaxed italic">
                &ldquo;{activeConfig.persona.greeting}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: BANT QUALIFICATION GATES */}
        {activeTab === "bant" && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider">
                  Minimum Budget
                </span>
                <p className="font-mono text-base font-bold text-stone-900">
                  {activeConfig.qualificationGates.formattedMinimumBudget}
                </p>
                <p className="text-[11px] text-stone-400">Under threshold routed to nurture pipeline</p>
              </div>

              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider">
                  Decision Horizon
                </span>
                <p className="font-mono text-base font-bold text-stone-900">
                  &lt; {activeConfig.qualificationGates.targetTimelineDays} Days
                </p>
                <p className="text-[11px] text-stone-400">Qualifies for immediate physical viewing slot</p>
              </div>
            </div>

            {/* Approved Title Deeds */}
            <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-2">
              <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                Approved Property Title Deeds
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeConfig.qualificationGates.requiredTitleDeeds.map((deed, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-white px-2 py-0.5 text-xs font-medium text-stone-700 border border-stone-200 shadow-2xs"
                  >
                    {deed}
                  </span>
                ))}
              </div>
            </div>

            {/* Escalation Keywords */}
            <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-2">
              <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                Immediate Broker Escalation Keywords
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeConfig.qualificationGates.immediateEscalationKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium"
                  >
                    &ldquo;{kw}&rdquo;
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SAFETY GUARDRAILS */}
        {activeTab === "guardrails" && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider">
                  Max Outbound Calls
                </span>
                <p className="font-mono text-base font-bold text-stone-900">
                  {activeConfig.guardrails.maxOutboundAttempts} Calls Max
                </p>
                <p className="text-[11px] text-stone-400">Strict carrier spam protection</p>
              </div>

              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider">
                  Quiet Hours Window
                </span>
                <p className="font-mono text-base font-bold text-stone-900">
                  {activeConfig.guardrails.quietHoursStart} – {activeConfig.guardrails.quietHoursEnd}
                </p>
                <p className="text-[11px] text-stone-400">Queued to 9:00 AM next business day</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50/80 border border-stone-200/80">
                <div>
                  <p className="font-semibold text-stone-900">Strict DNC List Enforcement</p>
                  <p className="text-[11px] text-stone-400">Immediate telephone unsubscribe suppression</p>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50/80 border border-stone-200/80">
                <div>
                  <p className="font-semibold text-stone-900">Auto-Handoff on Price Negotiation</p>
                  <p className="text-[11px] text-stone-400">Transfers unlisted discounts directly to broker</p>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Enforced
                </span>
              </div>

              {/* Autonomous Auto-Dispatch Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50/80 border border-stone-200/80 hover:bg-stone-50/60 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-stone-900">
                      Autonomous Action Dispatch (Auto-Pilot)
                    </p>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[10px] font-semibold border",
                        autoDispatch
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-stone-100 text-stone-600 border border-stone-200"
                      )}
                    >
                      {autoDispatch ? "Auto-Pilot Active" : "Manual Approval"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Automatically dispatches viewing calendar invites &amp; assigns lead brokers when intent confidence &gt; 85% (no manual &ldquo;Execute&rdquo; clicks required)
                  </p>
                </div>
                <div className="shrink-0 ml-4">
                  <Switch
                    checked={autoDispatch}
                    onCheckedChange={handleToggleAutoDispatch}
                    aria-label="Toggle autonomous booking dispatch"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
