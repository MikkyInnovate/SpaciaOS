"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { Conversation } from "../types";
import {
  IntentConfidenceGauge,
  BuyerIntentBadge,
  IntentSignalPill,
} from "@/features/ai-agent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export interface ConversationContextPanelProps {
  conversation: Conversation;
  className?: string;
}

export function ConversationContextPanel({
  conversation,
  className,
}: ConversationContextPanelProps) {
  const { bantSummary } = conversation;

  const handleExportTranscript = () => {
    toast.success("Transcript Exported", {
      description: `Exported full transcript for ${conversation.prospect.name}.`,
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-stone-50/50 border-l border-stone-200 overflow-y-auto p-4 space-y-4 text-xs",
        className
      )}
    >
      {/* 1. AI Confidence & Intent Overview */}
      <Card className="border-stone-200 shadow-2xs bg-white">
        <CardHeader className="p-3.5 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0d4a36]" />
              <span>AI Qualification Telemetry</span>
            </CardTitle>
            <span className="font-mono text-[10px] text-stone-400">Score: {conversation.qualificationScore}/100</span>
          </div>
        </CardHeader>
        <CardContent className="p-3.5 pt-0 space-y-3">
          {/* Confidence Gauge */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-500 font-medium">Confidence Level</span>
              <span className="font-mono font-bold text-stone-900">{conversation.confidenceScore}%</span>
            </div>
            <IntentConfidenceGauge score={conversation.confidenceScore} />
          </div>

          {/* Buyer Intent Tier */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-500">Extracted Intent:</span>
            <BuyerIntentBadge category={conversation.buyerIntent} className="text-[10px]" />
          </div>

          {/* Conversational Signals */}
          {conversation.intentSignals.length > 0 && (
            <div className="pt-2 border-t border-stone-100 space-y-1.5">
              <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                Key Conversational Signals
              </span>
              <div className="flex flex-wrap gap-1">
                {conversation.intentSignals.map((sig) => (
                  <IntentSignalPill
                    key={sig.id}
                    signal={sig}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Target Property & Commercial Valuation */}
      <Card className="border-stone-200 shadow-2xs bg-white">
        <CardHeader className="p-3.5 pb-2">
          <CardTitle className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-stone-500" />
            <span>Target Acquisition Context</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 pt-0 space-y-2.5">
          <div>
            <h4 className="font-semibold text-stone-900 text-xs line-clamp-1">
              {conversation.targetProperty.title}
            </h4>
            <p className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
              <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
              <span className="truncate">{conversation.targetProperty.location}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-[11px]">
            <div className="bg-stone-50 p-2 rounded-md border border-stone-200/70">
              <span className="text-stone-400 text-[10px] block">Declared Budget</span>
              <span className="font-mono font-semibold text-stone-900 tabular-nums">
                {conversation.budget}
              </span>
            </div>

            <div className="bg-stone-50 p-2 rounded-md border border-stone-200/70">
              <span className="text-stone-400 text-[10px] block">Asking Price</span>
              <span className="font-mono font-semibold text-stone-900 tabular-nums">
                {conversation.targetProperty.price}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-stone-500">Closing Window:</span>
            <span className="font-medium text-stone-800">{conversation.timeline}</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. 5-Point BANT Qualification Gates */}
      <Card className="border-stone-200 shadow-2xs bg-white">
        <CardHeader className="p-3.5 pb-2">
          <CardTitle className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>5-Point BANT Underwriting</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 pt-0 space-y-2.5">
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Budget (Liquidity)</span>
              {bantSummary.budgetVerified ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-stone-400">
                  <XCircle className="h-3.5 w-3.5" /> Pending
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-600">Authority (Decision Maker)</span>
              {bantSummary.authorityVerified ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-stone-400">
                  <XCircle className="h-3.5 w-3.5" /> Pending
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-600">Need (Property Criteria)</span>
              {bantSummary.needVerified ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-stone-400">
                  <XCircle className="h-3.5 w-3.5" /> Pending
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-600">Timeline (Acquisition)</span>
              {bantSummary.timelineVerified ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-stone-400">
                  <XCircle className="h-3.5 w-3.5" /> Pending
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-600">Property Fit</span>
              {bantSummary.propertyFitVerified ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-stone-400">
                  <XCircle className="h-3.5 w-3.5" /> Pending
                </span>
              )}
            </div>
          </div>

          {bantSummary.notes && (
            <div className="pt-2 border-t border-stone-100">
              <p className="text-[10px] text-stone-400 uppercase font-semibold">AI Underwriting Memo</p>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed bg-stone-50 p-2 rounded border border-stone-200/60">
                {bantSummary.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Assigned Broker & Routing */}
      {conversation.assignedBroker && (
        <div className="rounded-lg border border-stone-200 bg-white p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-stone-400">Assigned Broker</span>
            <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
              Connected
            </Badge>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="h-7 w-7 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold text-xs">
              {(conversation.assignedBroker.name || "B").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-900">{conversation.assignedBroker.name}</p>
              <p className="text-[10px] text-stone-500">{conversation.assignedBroker.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Deep Link to Lead Dossier & Transcript */}
      <div className="pt-1 space-y-2">
        <Link href={`/leads`} className="block">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8 gap-1.5 text-stone-700 bg-white hover:bg-stone-50 border-stone-200 cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 text-stone-500" />
            <span>Open Full Lead Dossier</span>
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportTranscript}
          className="w-full text-[11px] h-7 gap-1.5 text-stone-500 hover:text-stone-700 cursor-pointer"
        >
          <Download className="h-3 w-3" />
          <span>Export Conversation Transcript</span>
        </Button>
      </div>
    </div>
  );
}
