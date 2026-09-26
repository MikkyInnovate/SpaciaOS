"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type {
  AIAgentConfiguration,
  AIAgentTone,
  AIAgentLanguage,
} from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sliders,
  Volume2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Pencil,
  Save,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export interface AIAgentConfigPresentationProps {
  config?: AIAgentConfiguration;
  configuration?: AIAgentConfiguration;
  onSaveConfig?: (newConfig: AIAgentConfiguration) => Promise<void> | void;
  onResetConfig?: () => Promise<void> | void;
  className?: string;
}

const VOICE_OPTIONS = [
  {
    id: "en-NG-EzinneNeural",
    label: "Ezinne — Nigerian Lagos Neutral (Female)",
    accent: "Executive Lagos Neutral",
  },
  {
    id: "en-NG-AbeoNeural",
    label: "Abeo — Nigerian Lagos Professional (Male)",
    accent: "Commercial Lagos Executive",
  },
  {
    id: "en-GB-SoniaNeural",
    label: "Sonia — British Commonwealth Executive (Female)",
    accent: "London Mayfair Neutral",
  },
  {
    id: "en-US-JennyNeural",
    label: "Jenny — Global Metropolitan Prime (Female)",
    accent: "International American",
  },
];

const TONE_OPTIONS: Array<{
  id: AIAgentTone;
  label: string;
  badge: string;
  description: string;
}> = [
  {
    id: "luxury_professional",
    label: "Luxury Professional",
    badge: "Discreet & Refined",
    description:
      "Understated elegance, respectful vocabulary, tailored for High-Net-Worth individuals and institutional buyers.",
  },
  {
    id: "consultative",
    label: "Consultative Advisory",
    badge: "Diagnostic & Strategic",
    description:
      "Acts as a strategic asset advisor, uncovering buyer motivations and portfolio criteria through thoughtful discovery.",
  },
  {
    id: "assertive",
    label: "High Velocity / Assertive",
    badge: "Direct & Decisive",
    description:
      "Emphasizes scarce luxury inventory, capital appreciation potential, and immediate private viewing booking.",
  },
  {
    id: "warm_friendly",
    label: "Warm & Hospitable",
    badge: "Welcoming & Approachable",
    description:
      "Accessible, gracious, and reassuring while maintaining complete regulatory accuracy and pricing discipline.",
  },
];

const LANGUAGE_OPTIONS: Array<{
  id: AIAgentLanguage;
  label: string;
  dialect: string;
}> = [
  { id: "en-NG", label: "English (Nigeria)", dialect: "Prime Nigerian Real Estate Standard" },
  { id: "en-US", label: "English (United States)", dialect: "North American Metropolitan" },
  { id: "en-GB", label: "English (United Kingdom)", dialect: "British Commonwealth Formal" },
  { id: "pcm-NG", label: "Nigerian Pidgin", dialect: "Commercial West African Vernacular" },
];

const WEEKDAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

export function AIAgentConfigPresentation({
  config,
  configuration,
  onSaveConfig,
  onResetConfig,
  className,
}: AIAgentConfigPresentationProps) {
  const activeConfig = configuration ?? config;
  const [activeTab, setActiveTab] = React.useState<
    "persona" | "hours" | "escalation" | "followup" | "bant"
  >("persona");
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  // Editable working copy buffer
  const [editConfig, setEditConfig] = React.useState<AIAgentConfiguration | null>(() =>
    activeConfig ? JSON.parse(JSON.stringify(activeConfig)) : null
  );

  // Tag inputs
  const [newKeywordText, setNewKeywordText] = React.useState("");
  const [newDeedText, setNewDeedText] = React.useState("");

  const [prevActiveConfig, setPrevActiveConfig] = React.useState(activeConfig);
  if (activeConfig !== prevActiveConfig) {
    setPrevActiveConfig(activeConfig);
    if (!isEditing) {
      setEditConfig(activeConfig ? JSON.parse(JSON.stringify(activeConfig)) : null);
    }
  }

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
      const budgetNum = Number(editConfig.escalationRules?.budgetThresholdNaira) || 500000000;
      const formattedBudget = `₦${budgetNum.toLocaleString()}`;

      const payload: AIAgentConfiguration = {
        ...editConfig,
        name: editConfig.name.trim() || "Amara",
        voice: editConfig.voice,
        tone: editConfig.tone,
        language: editConfig.language,
        greeting: editConfig.greeting.trim(),
        businessHours: {
          ...editConfig.businessHours,
        },
        escalationRules: {
          ...editConfig.escalationRules,
          budgetThresholdNaira: budgetNum,
        },
        followUpRules: {
          ...editConfig.followUpRules,
        },
        qualificationGates: {
          ...editConfig.qualificationGates,
          minimumBudgetNaira: budgetNum,
          formattedMinimumBudget: formattedBudget,
          targetTimelineDays: editConfig.qualificationGates?.targetTimelineDays ?? 30,
          requiredTitleDeeds: editConfig.qualificationGates?.requiredTitleDeeds || [],
          immediateEscalationKeywords: editConfig.escalationRules?.humanTakeoverKeywords || [],
        },
      };

      await onSaveConfig(payload);
      setIsEditing(false);
      toast.success("AI Configuration Persisted", {
        description: "Agent persona, business hours, and escalation rules updated across all channels.",
      });
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToBaseline = async () => {
    if (!confirm("Are you sure you want to reset all AI agent parameters to Spacia luxury baseline?")) {
      return;
    }
    setIsResetting(true);
    try {
      if (onResetConfig) {
        await onResetConfig();
      }
      setIsEditing(false);
      toast.info("Configuration Reset", {
        description: "Restored baseline Spacia luxury settings.",
      });
    } catch {
      toast.error("Failed to reset configuration");
    } finally {
      setIsResetting(false);
    }
  };

  // Day toggle handler
  const handleToggleDay = (dayKey: string) => {
    if (!isEditing || !editConfig) return;
    const currentDays = editConfig.businessHours.days || [];
    const exists = currentDays.includes(dayKey);
    const updatedDays = exists
      ? currentDays.filter((d) => d !== dayKey)
      : [...currentDays, dayKey];

    setEditConfig({
      ...editConfig,
      businessHours: {
        ...editConfig.businessHours,
        days: updatedDays,
      },
    });
  };

  // Keyword handlers
  const handleAddKeyword = () => {
    const trimmed = newKeywordText.trim().toLowerCase();
    if (!trimmed || !editConfig) return;
    const currentKeywords = editConfig.escalationRules.humanTakeoverKeywords || [];
    if (currentKeywords.includes(trimmed)) {
      toast.info("Keyword already registered");
      return;
    }
    setEditConfig({
      ...editConfig,
      escalationRules: {
        ...editConfig.escalationRules,
        humanTakeoverKeywords: [...currentKeywords, trimmed],
      },
    });
    setNewKeywordText("");
  };

  const handleRemoveKeyword = (index: number) => {
    if (!editConfig) return;
    setEditConfig({
      ...editConfig,
      escalationRules: {
        ...editConfig.escalationRules,
        humanTakeoverKeywords: (editConfig.escalationRules.humanTakeoverKeywords || []).filter(
          (_, i) => i !== index
        ),
      },
    });
  };

  // Deed handlers
  const handleAddDeed = () => {
    const trimmed = newDeedText.trim();
    if (!trimmed || !editConfig) return;
    const currentDeeds = editConfig.qualificationGates?.requiredTitleDeeds || [];
    if (currentDeeds.includes(trimmed)) {
      toast.info("Title deed already in list");
      return;
    }
    setEditConfig({
      ...editConfig,
      qualificationGates: {
        ...editConfig.qualificationGates!,
        requiredTitleDeeds: [...currentDeeds, trimmed],
      },
    });
    setNewDeedText("");
  };

  const handleRemoveDeed = (index: number) => {
    if (!editConfig) return;
    setEditConfig({
      ...editConfig,
      qualificationGates: {
        ...editConfig.qualificationGates!,
        requiredTitleDeeds: (editConfig.qualificationGates?.requiredTitleDeeds || []).filter(
          (_, i) => i !== index
        ),
      },
    });
  };

  return (
    <Card className={cn("rounded-lg border border-border bg-white shadow-2xs overflow-hidden", className)}>
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border p-4 bg-stone-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-stone-900">
              AI Agent Configuration
            </h2>
            <span className="flex items-center gap-1.5 rounded-md border border-emerald-200/90 bg-emerald-50/80 px-2 py-0.5 text-[11px] font-medium text-emerald-800 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Workspace Scoped
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage agent persona, voice parameters, business hours, escalation triggers, and follow-up cadences.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing ? (
            <>
              {onResetConfig && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResetToBaseline}
                  disabled={isResetting}
                  className="h-8 px-2.5 text-xs gap-1.5 bg-white border-stone-200 text-stone-600 hover:text-stone-900 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3 text-stone-400" />
                  <span>Reset Defaults</span>
                </Button>
              )}
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
            </>
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

      {/* 2. Sub-Tab Navigation for all 8 parameters */}
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
            <span>Persona &amp; Voice</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
              5 Parameters
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hours")}
            className={cn(
              "flex items-center gap-2 pb-2.5 pt-3 text-xs transition-colors cursor-pointer whitespace-nowrap select-none border-b-2",
              activeTab === "hours"
                ? "border-[#0d4a36] text-[#0d4a36] font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300 font-medium"
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Business Hours</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
              {currentDisplayConfig.businessHours.enabled ? "Active" : "24/7"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("escalation")}
            className={cn(
              "flex items-center gap-2 pb-2.5 pt-3 text-xs transition-colors cursor-pointer whitespace-nowrap select-none border-b-2",
              activeTab === "escalation"
                ? "border-[#0d4a36] text-[#0d4a36] font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300 font-medium"
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Escalation Rules</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
              {currentDisplayConfig.escalationRules.humanTakeoverKeywords.length} Keywords
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("followup")}
            className={cn(
              "flex items-center gap-2 pb-2.5 pt-3 text-xs transition-colors cursor-pointer whitespace-nowrap select-none border-b-2",
              activeTab === "followup"
                ? "border-[#0d4a36] text-[#0d4a36] font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300 font-medium"
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Follow-Up Rules</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
              {currentDisplayConfig.followUpRules.maxAttempts} Attempts
            </span>
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
        </div>
      </div>

      <CardContent className="p-4">
        {/* ==================================================================== */}
        {/* TAB 1: PERSONA & VOICE (Name, Voice, Tone, Language, Greeting) */}
        {/* ==================================================================== */}
        {activeTab === "persona" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. NAME */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Agent Persona Name
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editConfig.name}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Amara"
                    className="w-full h-8 px-2.5 text-xs font-semibold rounded-md border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#0d4a36]"
                  />
                ) : (
                  <>
                    <p className="font-semibold text-stone-900 text-sm">{currentDisplayConfig.name}</p>
                    <p className="text-[11px] text-stone-400">Autonomous Sales Executive</p>
                  </>
                )}
              </div>

              {/* 2. VOICE */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Neural Voice Synthesis
                </span>
                {isEditing ? (
                  <Select
                    value={editConfig.voice}
                    onValueChange={(val) =>
                      setEditConfig({
                        ...editConfig,
                        voice: val,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs border-stone-200 bg-white focus:ring-[#0d4a36]/20 focus:border-[#0d4a36]">
                      <SelectValue placeholder="Select neural voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_OPTIONS.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="text-xs">
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <p className="font-semibold text-stone-900 font-mono text-xs">
                      {VOICE_OPTIONS.find((v) => v.id === currentDisplayConfig.voice)?.label || currentDisplayConfig.voice}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {VOICE_OPTIONS.find((v) => v.id === currentDisplayConfig.voice)?.accent || "Natural Accent"}
                    </p>
                  </>
                )}
              </div>

              {/* 3. TONE */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Communication Tone
                </span>
                {isEditing ? (
                  <Select
                    value={editConfig.tone}
                    onValueChange={(val) =>
                      setEditConfig({
                        ...editConfig,
                        tone: val as AIAgentTone,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs border-stone-200 bg-white focus:ring-[#0d4a36]/20 focus:border-[#0d4a36]">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          {t.label} ({t.badge})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <p className="font-semibold text-stone-900 capitalize">
                      {TONE_OPTIONS.find((t) => t.id === currentDisplayConfig.tone)?.label || currentDisplayConfig.tone}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {TONE_OPTIONS.find((t) => t.id === currentDisplayConfig.tone)?.badge}
                    </p>
                  </>
                )}
              </div>

              {/* 4. LANGUAGE */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Primary Language
                </span>
                {isEditing ? (
                  <Select
                    value={editConfig.language}
                    onValueChange={(val) =>
                      setEditConfig({
                        ...editConfig,
                        language: val as AIAgentLanguage,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs border-stone-200 bg-white focus:ring-[#0d4a36]/20 focus:border-[#0d4a36]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((l) => (
                        <SelectItem key={l.id} value={l.id} className="text-xs">
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <p className="font-semibold text-stone-900 font-mono text-xs">
                      {LANGUAGE_OPTIONS.find((l) => l.id === currentDisplayConfig.language)?.label || currentDisplayConfig.language}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {LANGUAGE_OPTIONS.find((l) => l.id === currentDisplayConfig.language)?.dialect}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* 5. GREETING SCRIPT */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider block">
                  Opening Script &amp; Greeting Baseline
                </span>
                <span className="text-[11px] text-stone-500">Injected into conversation intake turns</span>
              </div>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={editConfig.greeting}
                  onChange={(e) =>
                    setEditConfig({
                      ...editConfig,
                      greeting: e.target.value,
                    })
                  }
                  className="w-full p-2.5 text-xs rounded-md border border-stone-300 bg-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0d4a36]"
                />
              ) : (
                <p className="text-xs text-stone-800 bg-white p-3 rounded-md border border-stone-200 leading-relaxed italic shadow-2xs">
                  &ldquo;{currentDisplayConfig.greeting}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: BUSINESS HOURS (6. Business hours) */}
        {/* ==================================================================== */}
        {activeTab === "hours" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Enabled Switch */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                    Operating Schedule Enforced
                  </span>
                  <p className="text-[11px] text-stone-400">
                    {currentDisplayConfig.businessHours.enabled
                      ? "After-hours inquiries receive scheduled notice"
                      : "24/7 continuous operation"}
                  </p>
                </div>
                {isEditing ? (
                  <Switch
                    checked={editConfig.businessHours.enabled}
                    onCheckedChange={(checked) =>
                      setEditConfig({
                        ...editConfig,
                        businessHours: {
                          ...editConfig.businessHours,
                          enabled: checked,
                        },
                      })
                    }
                  />
                ) : (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-semibold border",
                      currentDisplayConfig.businessHours.enabled
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-stone-100 text-stone-600 border-stone-200"
                    )}
                  >
                    {currentDisplayConfig.businessHours.enabled ? "Active" : "Disabled"}
                  </span>
                )}
              </div>

              {/* Start & End Times */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Active Hours Window (24h)
                </span>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editConfig.businessHours.start}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          businessHours: {
                            ...editConfig.businessHours,
                            start: e.target.value,
                          },
                        })
                      }
                      placeholder="08:00"
                      className="w-20 h-7.5 px-2 text-xs font-mono font-semibold rounded border border-stone-300 bg-white"
                    />
                    <span className="text-stone-400">to</span>
                    <input
                      type="text"
                      value={editConfig.businessHours.end}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          businessHours: {
                            ...editConfig.businessHours,
                            end: e.target.value,
                          },
                        })
                      }
                      placeholder="19:00"
                      className="w-20 h-7.5 px-2 text-xs font-mono font-semibold rounded border border-stone-300 bg-white"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-mono text-sm font-bold text-stone-900">
                      {currentDisplayConfig.businessHours.start} – {currentDisplayConfig.businessHours.end}
                    </p>
                    <p className="text-[11px] text-stone-400">Call &amp; chat active dispatch window</p>
                  </>
                )}
              </div>

              {/* Timezone */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Timezone Standard
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editConfig.businessHours.timezone}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        businessHours: {
                          ...editConfig.businessHours,
                          timezone: e.target.value,
                        },
                      })
                    }
                    placeholder="Africa/Lagos"
                    className="w-full h-7.5 px-2 text-xs font-mono rounded border border-stone-300 bg-white"
                  />
                ) : (
                  <>
                    <p className="font-mono text-sm font-semibold text-stone-900">
                      {currentDisplayConfig.businessHours.timezone}
                    </p>
                    <p className="text-[11px] text-stone-400">West Africa Time (WAT)</p>
                  </>
                )}
              </div>
            </div>

            {/* Active Days of Week */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/70 space-y-2">
              <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider block">
                Active Operating Days
              </span>
              <div className="flex flex-wrap gap-2 items-center">
                {WEEKDAYS.map((day) => {
                  const isActive = (currentDisplayConfig.businessHours.days || []).includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => handleToggleDay(day.key)}
                      className={cn(
                        "h-8 px-3 rounded-md text-xs font-medium transition-colors border select-none",
                        isActive
                          ? "bg-[#0d4a36] text-white border-[#0d4a36] font-semibold shadow-2xs"
                          : "bg-white text-stone-500 border-stone-200 hover:border-stone-300",
                        isEditing ? "cursor-pointer" : "cursor-default opacity-90"
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: ESCALATION RULES (7. Escalation rules) */}
        {/* ==================================================================== */}
        {activeTab === "escalation" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* High Budget Escalation Threshold */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Ultra-High Budget Threshold
                </span>
                {isEditing ? (
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-stone-500 font-mono text-xs">₦</span>
                    <input
                      type="number"
                      step="25000000"
                      value={editConfig.escalationRules.budgetThresholdNaira}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          escalationRules: {
                            ...editConfig.escalationRules,
                            budgetThresholdNaira: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full h-8 pl-7 pr-2.5 text-xs font-mono font-bold rounded-md border border-stone-300 bg-white"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-mono text-base font-bold text-stone-900">
                      ₦{Number(currentDisplayConfig.escalationRules.budgetThresholdNaira).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-stone-400">Triggers priority senior partner escalation</p>
                  </>
                )}
              </div>

              {/* Max Negative Sentiments */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Dispute / Friction Threshold
                </span>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editConfig.escalationRules.maxNegativeSentiments}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        escalationRules: {
                          ...editConfig.escalationRules,
                          maxNegativeSentiments: parseInt(e.target.value, 10) || 2,
                        },
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-md border border-stone-300 bg-white"
                  />
                ) : (
                  <>
                    <p className="font-mono text-base font-bold text-stone-900">
                      {currentDisplayConfig.escalationRules.maxNegativeSentiments} Turns
                    </p>
                    <p className="text-[11px] text-stone-400">Transfers immediately on objection loop</p>
                  </>
                )}
              </div>

              {/* Require Human For Contracts */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                    Contract Human Takeover
                  </span>
                  <p className="text-[11px] text-stone-400">Strict legal deed review</p>
                </div>
                {isEditing ? (
                  <Switch
                    checked={editConfig.escalationRules.requireHumanForContracts}
                    onCheckedChange={(checked) =>
                      setEditConfig({
                        ...editConfig,
                        escalationRules: {
                          ...editConfig.escalationRules,
                          requireHumanForContracts: checked,
                        },
                      })
                    }
                  />
                ) : (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-semibold border",
                      currentDisplayConfig.escalationRules.requireHumanForContracts
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-stone-100 text-stone-600 border-stone-200"
                    )}
                  >
                    {currentDisplayConfig.escalationRules.requireHumanForContracts ? "Mandatory" : "Optional"}
                  </span>
                )}
              </div>
            </div>

            {/* Keyword Chips */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider block">
                  Human Broker Takeover Keywords
                </span>
                {isEditing && <span className="text-[10px] text-stone-400">Click &times; to delete</span>}
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                {(currentDisplayConfig.escalationRules.humanTakeoverKeywords || []).map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium"
                  >
                    <span>&ldquo;{kw}&rdquo;</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(idx)}
                        className="text-amber-700 hover:text-rose-600 cursor-pointer p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {isEditing && (
                <div className="flex items-center gap-2 pt-1.5">
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
                    placeholder="e.g. speak to lawyer"
                    className="h-8 px-2.5 text-xs rounded-md border border-stone-300 bg-white w-64 focus:outline-none focus:ring-1 focus:ring-[#0d4a36]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddKeyword}
                    className="h-8 px-2.5 text-xs gap-1 bg-white hover:bg-stone-50 border-stone-200"
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
        {/* TAB 4: FOLLOW-UP RULES (8. Follow-up rules) */}
        {/* ==================================================================== */}
        {activeTab === "followup" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Max Attempts */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Max Follow-Up Sequences
                </span>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editConfig.followUpRules.maxAttempts}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        followUpRules: {
                          ...editConfig.followUpRules,
                          maxAttempts: parseInt(e.target.value, 10) || 3,
                        },
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-md border border-stone-300 bg-white"
                  />
                ) : (
                  <>
                    <p className="font-mono text-base font-bold text-stone-900">
                      {currentDisplayConfig.followUpRules.maxAttempts} Touches Max
                    </p>
                    <p className="text-[11px] text-stone-400">Protects prospects from spam fatigue</p>
                  </>
                )}
              </div>

              {/* Interval Hours */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Cadence Spacing (Hours)
                </span>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={editConfig.followUpRules.intervalHours}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        followUpRules: {
                          ...editConfig.followUpRules,
                          intervalHours: parseInt(e.target.value, 10) || 24,
                        },
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-md border border-stone-300 bg-white"
                  />
                ) : (
                  <>
                    <p className="font-mono text-base font-bold text-stone-900">
                      Every {currentDisplayConfig.followUpRules.intervalHours} Hours
                    </p>
                    <p className="text-[11px] text-stone-400">Automated queue dispatch interval</p>
                  </>
                )}
              </div>

              {/* Auto Archive Unresponsive */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Unresponsive Archive Window
                </span>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={editConfig.followUpRules.autoArchiveUnresponsiveDays}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        followUpRules: {
                          ...editConfig.followUpRules,
                          autoArchiveUnresponsiveDays: parseInt(e.target.value, 10) || 7,
                        },
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-md border border-stone-300 bg-white"
                  />
                ) : (
                  <>
                    <p className="font-mono text-base font-bold text-stone-900">
                      {currentDisplayConfig.followUpRules.autoArchiveUnresponsiveDays} Days
                    </p>
                    <p className="text-[11px] text-stone-400">Moves to long-term nurture pool</p>
                  </>
                )}
              </div>
            </div>

            {/* Channel Order */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/70 space-y-2">
              <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider block">
                Channel Dispatch Sequence
              </span>
              <div className="flex items-center gap-2">
                {(currentDisplayConfig.followUpRules.channelOrder || ["whatsapp", "sms", "voice"]).map(
                  (ch, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-stone-200 shadow-2xs font-mono text-xs font-medium"
                    >
                      <span className="text-emerald-700 font-bold">{idx + 1}.</span>
                      <span className="capitalize">{ch}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: BANT QUALIFICATION GATES */}
        {/* ==================================================================== */}
        {activeTab === "bant" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Minimum Budget Threshold */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Minimum BANT Budget Threshold
                </span>
                {isEditing ? (
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-stone-500 font-mono text-xs">₦</span>
                    <input
                      type="number"
                      step="5000000"
                      value={editConfig.qualificationGates?.minimumBudgetNaira || 85000000}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          qualificationGates: {
                            ...editConfig.qualificationGates!,
                            minimumBudgetNaira: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full h-8 pl-7 pr-2.5 text-xs font-mono font-bold rounded-md border border-stone-300 bg-white text-stone-900"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-mono text-base font-bold text-stone-900">
                      {currentDisplayConfig.qualificationGates?.formattedMinimumBudget || "₦85,000,000"}
                    </p>
                    <p className="text-[11px] text-stone-400">Below threshold routed to automated nurture</p>
                  </>
                )}
              </div>

              {/* Decision Horizon */}
              <div className="p-3 rounded-lg border border-stone-200/80 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium uppercase tracking-wider block">
                  Target Decision Horizon
                </span>
                {isEditing ? (
                  <input
                    type="number"
                    step="5"
                    min="7"
                    max="180"
                    value={editConfig.qualificationGates?.targetTimelineDays || 30}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        qualificationGates: {
                          ...editConfig.qualificationGates!,
                          targetTimelineDays: parseInt(e.target.value, 10) || 30,
                        },
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-md border border-stone-300 bg-white"
                  />
                ) : (
                  <>
                    <p className="font-mono text-base font-bold text-stone-900">
                      &lt; {currentDisplayConfig.qualificationGates?.targetTimelineDays || 30} Days
                    </p>
                    <p className="text-[11px] text-stone-400">Qualifies for immediate physical viewing slot</p>
                  </>
                )}
              </div>
            </div>

            {/* Approved Deeds */}
            <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider block">
                  Approved Property Title Deeds
                </span>
                {isEditing && <span className="text-[10px] text-stone-400">Click &times; to delete</span>}
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                {(currentDisplayConfig.qualificationGates?.requiredTitleDeeds || []).map((deed, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200 font-medium"
                  >
                    <span>{deed}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDeed(idx)}
                        className="text-stone-500 hover:text-rose-600 cursor-pointer p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {isEditing && (
                <div className="flex items-center gap-2 pt-1.5">
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
                    placeholder="e.g. Registered Survey"
                    className="h-8 px-2.5 text-xs rounded-md border border-stone-300 bg-white w-64 focus:outline-none focus:ring-1 focus:ring-[#0d4a36]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddDeed}
                    className="h-8 px-2.5 text-xs gap-1 bg-white hover:bg-stone-50 border-stone-200"
                  >
                    <Plus className="h-3.5 w-3.5 text-stone-500" />
                    <span>Add Deed</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
