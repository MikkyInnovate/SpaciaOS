"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { AIAgentConfiguration } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle2,
  ShieldCheck,
  Sliders,
  Volume2,
  Pencil,
  Save,
  X,
  Plus,
  Loader2,
  Sparkles,
} from "lucide-react";
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
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Editable state buffer initialized when entering edit mode
  const [editConfig, setEditConfig] = React.useState<AIAgentConfiguration | null>(() =>
    activeConfig ? JSON.parse(JSON.stringify(activeConfig)) : null
  );

  // Tag creation inputs
  const [newDeedText, setNewDeedText] = React.useState("");
  const [newKeywordText, setNewKeywordText] = React.useState("");

  if (!activeConfig || !editConfig) return null;

  const currentDisplayConfig = isEditing ? editConfig : activeConfig;

  const handleStartEdit = () => {
    setEditConfig(JSON.parse(JSON.stringify(activeConfig)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditConfig(JSON.parse(JSON.stringify(activeConfig)));
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!onSaveConfig || !editConfig) return;
    setIsSaving(true);
    try {
      // Recalculate formatted budget if budget number changed
      const budgetNum = Number(editConfig.qualificationGates.minimumBudgetNaira) || 85000000;
      const formattedBudget = `₦${budgetNum.toLocaleString()}`;
      const payload: AIAgentConfiguration = {
        ...editConfig,
        qualificationGates: {
          ...editConfig.qualificationGates,
          minimumBudgetNaira: budgetNum,
          formattedMinimumBudget: formattedBudget,
        },
      };

      await onSaveConfig(payload);
      setIsEditing(false);
      toast.success("Configuration Saved", {
        description: "Updated BANT criteria, voice persona, and safety parameters synchronized.",
      });
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  // Title deeds handlers
  const handleAddDeed = () => {
    const trimmed = newDeedText.trim();
    if (!trimmed) return;
    if (editConfig.qualificationGates.requiredTitleDeeds.includes(trimmed)) {
      toast.info("Title deed already in list");
      return;
    }
    setEditConfig((prev) =>
      prev
        ? {
            ...prev,
            qualificationGates: {
              ...prev.qualificationGates,
              requiredTitleDeeds: [...prev.qualificationGates.requiredTitleDeeds, trimmed],
            },
          }
        : null
    );
    setNewDeedText("");
  };

  const handleRemoveDeed = (index: number) => {
    setEditConfig((prev) =>
      prev
        ? {
            ...prev,
            qualificationGates: {
              ...prev.qualificationGates,
              requiredTitleDeeds: prev.qualificationGates.requiredTitleDeeds.filter((_, i) => i !== index),
            },
          }
        : null
    );
  };

  // Escalation keywords handlers
  const handleAddKeyword = () => {
    const trimmed = newKeywordText.trim().toLowerCase();
    if (!trimmed) return;
    if (editConfig.qualificationGates.immediateEscalationKeywords.includes(trimmed)) {
      toast.info("Keyword already in list");
      return;
    }
    setEditConfig((prev) =>
      prev
        ? {
            ...prev,
            qualificationGates: {
              ...prev.qualificationGates,
              immediateEscalationKeywords: [
                ...prev.qualificationGates.immediateEscalationKeywords,
                trimmed,
              ],
            },
          }
        : null
    );
    setNewKeywordText("");
  };

  const handleRemoveKeyword = (index: number) => {
    setEditConfig((prev) =>
      prev
        ? {
            ...prev,
            qualificationGates: {
              ...prev.qualificationGates,
              immediateEscalationKeywords: prev.qualificationGates.immediateEscalationKeywords.filter(
                (_, i) => i !== index
              ),
            },
          }
        : null
    );
  };

  // Auto-dispatch toggle handler
  const handleToggleAutoDispatch = async (checked: boolean) => {
    const updated = {
      ...currentDisplayConfig,
      guardrails: {
        ...currentDisplayConfig.guardrails,
        autoDispatchBookings: checked,
      },
    };
    if (isEditing) {
      setEditConfig(updated);
    } else if (onSaveConfig) {
      await onSaveConfig(updated);
      toast.success(checked ? "Auto-Pilot Active" : "Supervised Approval Active");
    }
  };

  return (
    <Card className={cn("rounded-lg border border-border bg-white shadow-2xs overflow-hidden", className)}>
      {/* Card Header with Edit/Save Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border p-4 bg-stone-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-stone-900">
              Agent Studio &amp; Guardrails
            </h2>
            <span className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Verified Core
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Voice persona parameters, BANT qualification gates, and legal compliance rules
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleStartEdit}
              className="h-8 px-3 text-xs gap-1.5 bg-white border-stone-200 text-stone-800 hover:bg-stone-50 shadow-2xs cursor-pointer font-medium"
            >
              <Pencil className="h-3.5 w-3.5 text-stone-500" />
              <span>Edit Configuration</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-3 text-xs gap-1.5 bg-[#0d4a36] hover:bg-[#093829] text-white shadow-2xs cursor-pointer font-semibold"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 text-emerald-300" />
                )}
                <span>Save Changes</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation (SpaciaOS Design System Standard) */}
      <div className="border-b border-stone-200 px-4 bg-white">
        <div className="flex items-center gap-6 -mb-px overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("persona")}
            className={cn(
              "flex items-center gap-2 pb-2.5 pt-3 text-xs transition-colors cursor-pointer whitespace-nowrap select-none border-b-2",
              activeTab === "persona"
                ? "border-[#0d4a36] text-[#0d4a36] font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300 font-medium"
            )}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Voice Persona</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bant")}
            className={cn(
              "flex items-center gap-2 pb-2.5 pt-3 text-xs transition-colors cursor-pointer whitespace-nowrap select-none border-b-2",
              activeTab === "bant"
                ? "border-[#0d4a36] text-[#0d4a36] font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300 font-medium"
            )}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>BANT Gates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("guardrails")}
            className={cn(
              "flex items-center gap-2 pb-2.5 pt-3 text-xs transition-colors cursor-pointer whitespace-nowrap select-none border-b-2",
              activeTab === "guardrails"
                ? "border-[#0d4a36] text-[#0d4a36] font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300 font-medium"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Guardrails &amp; Safety</span>
          </button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* ==================================================================== */}
        {/* TAB 1: VOICE PERSONA */}
        {/* ==================================================================== */}
        {activeTab === "persona" && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Identity Name
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editConfig.persona.name}
                    onChange={(e) =>
                      setEditConfig((prev) =>
                        prev
                          ? { ...prev, persona: { ...prev.persona, name: e.target.value } }
                          : null
                      )
                    }
                    className="w-full h-8 px-2.5 text-xs font-semibold rounded-md border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#0d4a36]"
                  />
                ) : (
                  <>
                    <p className="font-semibold text-stone-900">{currentDisplayConfig.persona.name}</p>
                    <p className="text-[11px] text-stone-400">{currentDisplayConfig.persona.identityTitle}</p>
                  </>
                )}
              </div>

              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Voice Model
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editConfig.persona.voiceModel}
                    onChange={(e) =>
                      setEditConfig((prev) =>
                        prev
                          ? { ...prev, persona: { ...prev.persona, voiceModel: e.target.value } }
                          : null
                      )
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono font-semibold rounded-md border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#0d4a36]"
                  />
                ) : (
                  <>
                    <p className="font-semibold text-stone-900">{currentDisplayConfig.persona.voiceModel}</p>
                    <p className="text-[11px] text-stone-500 font-mono">{currentDisplayConfig.persona.accent}</p>
                  </>
                )}
              </div>

              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Verified Truth Policy
                </span>
                <p className="font-semibold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0d4a36]" />
                  <span>Enforced Strict</span>
                </p>
                <p className="text-[11px] text-stone-400">Never quotes unvetted prices or title deeds</p>
              </div>

              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Speech &amp; Latency Parameters
                </span>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Temperature:</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="0.8"
                        value={editConfig.persona.temperature}
                        onChange={(e) =>
                          setEditConfig((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  persona: {
                                    ...prev.persona,
                                    temperature: parseFloat(e.target.value) || 0.3,
                                  },
                                }
                              : null
                          )
                        }
                        className="w-full h-7 px-2 text-xs font-mono rounded border border-stone-300 bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">Pause (ms):</span>
                      <input
                        type="number"
                        step="50"
                        min="100"
                        max="1000"
                        value={editConfig.persona.interruptionToleranceMs}
                        onChange={(e) =>
                          setEditConfig((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  persona: {
                                    ...prev.persona,
                                    interruptionToleranceMs: parseInt(e.target.value, 10) || 400,
                                  },
                                }
                              : null
                          )
                        }
                        className="w-full h-7 px-2 text-xs font-mono rounded border border-stone-300 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-mono font-semibold text-stone-900">
                      {currentDisplayConfig.persona.temperature} temp • {currentDisplayConfig.persona.interruptionToleranceMs}ms pause
                    </p>
                    <p className="text-[11px] text-stone-400">Calibrated for natural, human turn-taking</p>
                  </>
                )}
              </div>
            </div>

            {/* Greeting Script Editor / Preview */}
            <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/70 space-y-1.5">
              <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider block">
                Outbound Qualification Script (Greeting)
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={editConfig.persona.greeting}
                  onChange={(e) =>
                    setEditConfig((prev) =>
                      prev
                        ? { ...prev, persona: { ...prev.persona, greeting: e.target.value } }
                        : null
                    )
                  }
                  className="w-full p-2.5 text-xs rounded-md border border-stone-300 bg-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0d4a36]"
                />
              ) : (
                <p className="text-xs text-stone-800 bg-white p-2.5 rounded-md border border-stone-200 leading-relaxed italic shadow-2xs">
                  &ldquo;{currentDisplayConfig.persona.greeting}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: BANT QUALIFICATION GATES (EDITABLE) */}
        {/* ==================================================================== */}
        {activeTab === "bant" && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Minimum Budget Threshold */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Minimum Budget Threshold
                </span>
                {isEditing ? (
                  <div className="space-y-1">
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-stone-500 font-mono text-xs">₦</span>
                      <input
                        type="number"
                        step="5000000"
                        value={editConfig.qualificationGates.minimumBudgetNaira}
                        onChange={(e) =>
                          setEditConfig((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  qualificationGates: {
                                    ...prev.qualificationGates,
                                    minimumBudgetNaira: Number(e.target.value),
                                  },
                                }
                              : null
                          )
                        }
                        className="w-full h-8 pl-7 pr-2.5 text-xs font-mono font-bold rounded-md border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#0d4a36]"
                      />
                    </div>
                    <p className="text-[11px] text-stone-400">Under threshold routed to automated nurture pipeline</p>
                  </div>
                ) : (
                  <>
                    <p className="font-mono text-base font-bold text-stone-900">
                      {currentDisplayConfig.qualificationGates.formattedMinimumBudget}
                    </p>
                    <p className="text-[11px] text-stone-400">Under threshold routed to nurture pipeline</p>
                  </>
                )}
              </div>

              {/* Decision Horizon */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Decision Horizon (Days)
                </span>
                {isEditing ? (
                  <div className="space-y-1">
                    <input
                      type="number"
                      step="5"
                      min="7"
                      max="180"
                      value={editConfig.qualificationGates.targetTimelineDays}
                      onChange={(e) =>
                        setEditConfig((prev) =>
                          prev
                            ? {
                                ...prev,
                                qualificationGates: {
                                  ...prev.qualificationGates,
                                  targetTimelineDays: parseInt(e.target.value, 10) || 30,
                                },
                              }
                            : null
                        )
                      }
                      className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-md border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#0d4a36]"
                    />
                    <p className="text-[11px] text-stone-400">Qualifies for immediate physical viewing slot</p>
                  </div>
                ) : (
                  <>
                    <p className="font-mono text-base font-bold text-stone-900">
                      &lt; {currentDisplayConfig.qualificationGates.targetTimelineDays} Days
                    </p>
                    <p className="text-[11px] text-stone-400">Qualifies for immediate physical viewing slot</p>
                  </>
                )}
              </div>
            </div>

            {/* Approved Title Deeds Editor */}
            <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Approved Property Title Deeds
                </span>
                {isEditing && (
                  <span className="text-[10px] text-stone-400">Click &times; to remove</span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                {currentDisplayConfig.qualificationGates.requiredTitleDeeds.map((deed, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-stone-800 border border-stone-200 shadow-2xs"
                  >
                    <span>{deed}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDeed(idx)}
                        className="text-stone-400 hover:text-rose-600 cursor-pointer p-0.5"
                        title={`Remove ${deed}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* Add New Deed Input in Edit Mode */}
              {isEditing && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newDeedText}
                    onChange={(e) => setNewDeedText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDeed();
                      }
                    }}
                    placeholder="e.g. Deed of Sublease"
                    className="h-7.5 px-2.5 text-xs rounded-md border border-stone-300 bg-white text-stone-900 w-60 focus:outline-none focus:ring-1 focus:ring-[#0d4a36]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddDeed}
                    className="h-7.5 px-2.5 text-xs gap-1 bg-white hover:bg-stone-50 text-stone-800 border-stone-200 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-stone-500" />
                    <span>Add Deed</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Escalation Keywords Editor */}
            <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Immediate Broker Escalation Keywords
                </span>
                {isEditing && (
                  <span className="text-[10px] text-stone-400">Click &times; to remove</span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                {currentDisplayConfig.qualificationGates.immediateEscalationKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/90 font-medium"
                  >
                    <span>&ldquo;{kw}&rdquo;</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(idx)}
                        className="text-amber-700 hover:text-rose-600 cursor-pointer p-0.5"
                        title={`Remove "${kw}"`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* Add New Keyword Input in Edit Mode */}
              {isEditing && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newKeywordText}
                    onChange={(e) => setNewKeywordText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    placeholder="e.g. bank guarantee"
                    className="h-7.5 px-2.5 text-xs rounded-md border border-stone-300 bg-white text-stone-900 w-60 focus:outline-none focus:ring-1 focus:ring-[#0d4a36]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddKeyword}
                    className="h-7.5 px-2.5 text-xs gap-1 bg-white hover:bg-stone-50 text-stone-800 border-stone-200 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-stone-500" />
                    <span>Add Keyword</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: SAFETY GUARDRAILS */}
        {/* ==================================================================== */}
        {activeTab === "guardrails" && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Max Outbound Calls per Lead
                </span>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editConfig.guardrails.maxOutboundAttempts}
                    onChange={(e) =>
                      setEditConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              guardrails: {
                                ...prev.guardrails,
                                maxOutboundAttempts: parseInt(e.target.value, 10) || 3,
                              },
                            }
                          : null
                      )
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-md border border-stone-300 bg-white text-stone-900"
                  />
                ) : (
                  <>
                    <p className="font-mono text-base font-bold text-stone-900">
                      {currentDisplayConfig.guardrails.maxOutboundAttempts} Calls Max
                    </p>
                    <p className="text-[11px] text-stone-400">Strict carrier spam protection</p>
                  </>
                )}
              </div>

              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Quiet Hours Window
                </span>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <input
                      type="text"
                      value={editConfig.guardrails.quietHoursStart}
                      onChange={(e) =>
                        setEditConfig((prev) =>
                          prev
                            ? {
                                ...prev,
                                guardrails: {
                                  ...prev.guardrails,
                                  quietHoursStart: e.target.value,
                                },
                              }
                            : null
                        )
                      }
                      placeholder="20:00"
                      className="h-8 px-2 text-xs font-mono rounded border border-stone-300 bg-white"
                    />
                    <input
                      type="text"
                      value={editConfig.guardrails.quietHoursEnd}
                      onChange={(e) =>
                        setEditConfig((prev) =>
                          prev
                            ? {
                                ...prev,
                                guardrails: {
                                  ...prev.guardrails,
                                  quietHoursEnd: e.target.value,
                                },
                              }
                            : null
                        )
                      }
                      placeholder="08:00"
                      className="h-8 px-2 text-xs font-mono rounded border border-stone-300 bg-white"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-mono text-base font-bold text-stone-900">
                      {currentDisplayConfig.guardrails.quietHoursStart} – {currentDisplayConfig.guardrails.quietHoursEnd}
                    </p>
                    <p className="text-[11px] text-stone-400">Queued to 9:00 AM next business day</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50/80 border border-stone-200/80">
                <div>
                  <p className="font-semibold text-stone-900">Strict DNC List Enforcement</p>
                  <p className="text-[11px] text-stone-400">Immediate telephone unsubscribe suppression</p>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200/90">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50/80 border border-stone-200/80">
                <div>
                  <p className="font-semibold text-stone-900">Auto-Handoff on Price Negotiation</p>
                  <p className="text-[11px] text-stone-400">Transfers unlisted discounts directly to broker</p>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200/90">
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
                        currentDisplayConfig.guardrails.autoDispatchBookings
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-stone-100 text-stone-600 border border-stone-200"
                      )}
                    >
                      {currentDisplayConfig.guardrails.autoDispatchBookings ? "Auto-Pilot Active" : "Manual Approval"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Automatically dispatches viewing calendar invites &amp; assigns lead brokers when intent confidence &gt; 85%
                  </p>
                </div>
                <div className="shrink-0 ml-4">
                  <Switch
                    checked={Boolean(currentDisplayConfig.guardrails.autoDispatchBookings)}
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
