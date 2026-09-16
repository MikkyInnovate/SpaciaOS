"use client";

import * as React from "react";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import type { Lead } from "../types";
import {
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LeadDetailShellProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailShell({
  lead,
  open,
  onOpenChange,
}: LeadDetailShellProps) {
  if (!lead) return null;

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2.5">
          <span className="truncate">{lead.name}</span>
          <StatusBadge status={lead.status} withDot size="xs" />
        </div>
      }
      description={
        <span>
          Lead ID: <strong className="font-mono text-stone-900">{lead.id}</strong> • Ingested {lead.createdAt}
        </span>
      }
      icon={<User className="h-4 w-4" />}
      badge={
        <ScoreIndicator
          score={lead.score}
          category={lead.scoreCategory}
          variant="badge"
          size="sm"
        />
      }
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-stone-500">
            Assigned workspace lead record
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close Dossier
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. Prospect Bio & Direct Contact */}
        <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#0d4a36]" />
              Prospect Profile
            </h4>
            <span className="text-[11px] font-mono text-stone-400">Verified Contact</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="space-y-1">
              <span className="text-stone-500 text-[11px]">Primary Phone</span>
              <div className="flex items-center gap-2">
                <a
                  href={"tel:" + lead.phone}
                  className="font-mono font-medium text-stone-900 hover:text-[#0d4a36] hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3.5 w-3.5 text-stone-400" />
                  {lead.phone}
                </a>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-stone-500 text-[11px]">Email Address</span>
              <div className="flex items-center gap-2">
                <a
                  href={"mailto:" + lead.email}
                  className="font-mono font-medium text-stone-900 hover:text-[#0d4a36] hover:underline truncate flex items-center gap-1"
                >
                  <Mail className="h-3.5 w-3.5 text-stone-400" />
                  {lead.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Commercial Context & Score */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Budget & Intent */}
          <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-2.5 shadow-2xs">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Commercial Context
            </h4>
            <div className="space-y-2 pt-1">
              <div>
                <span className="text-[11px] text-stone-500">Declared Budget</span>
                <p className="font-mono text-base font-bold text-stone-900 tabular-nums">
                  {lead.budget}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-stone-100 pt-2">
                <span className="text-stone-500">Transaction Intent:</span>
                <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-[11px]">
                  {lead.intent}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Decision Timeline:</span>
                <span className="font-medium text-stone-900 font-mono text-[11px]">
                  {lead.timeline}
                </span>
              </div>
            </div>
          </div>

          {/* Autonomous BANT Score Gauge */}
          <div className="rounded-lg border border-stone-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Score Assessment
              </h4>
              <div className="mt-3">
                <ScoreIndicator
                  score={lead.score}
                  category={lead.scoreCategory}
                  variant="gauge"
                />
              </div>
            </div>
            <div className="border-t border-stone-100 pt-2.5 mt-3 flex items-center justify-between text-xs">
              <span className="text-stone-500">Tier Designation:</span>
              <span className="font-semibold uppercase tracking-wider text-[#0d4a36] font-mono text-[11px]">
                {lead.scoreCategory} PRIORITY
              </span>
            </div>
          </div>
        </div>

        {/* 3. Property Interest */}
        <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-[#0d4a36]" />
              Target Property Interest
            </h4>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div>
              <span className="text-stone-500 text-[11px]">Property Title</span>
              <p className="font-medium text-stone-900 text-sm mt-0.5">
                {lead.propertyTitle}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-stone-600">
              <MapPin className="h-3.5 w-3.5 text-stone-400" />
              <span>{lead.location}</span>
            </div>
          </div>
        </div>

        {/* 4. Supported Qualification Notes */}
        {lead.aiNotes && (
          <div className="rounded-lg border border-stone-200 bg-[#fbfbfa] p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0d4a36]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Autonomous Qualification Context</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed font-sans">
              &ldquo;{lead.aiNotes}&rdquo;
            </p>
          </div>
        )}

        {/* 5. Operational Activity & Next Action */}
        <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#0d4a36]" />
              Operational Journey
            </h4>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 text-xs">
              <div className="h-2 w-2 rounded-full bg-[#0d4a36] mt-1.5 shrink-0" />
              <div className="space-y-0.5 flex-1">
                <span className="font-semibold text-stone-900">Next Action Required</span>
                <p className="text-stone-600">{lead.nextAction}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs opacity-75">
              <div className="h-2 w-2 rounded-full bg-stone-300 mt-1.5 shrink-0" />
              <div className="space-y-0.5 flex-1">
                <span className="font-medium text-stone-700">Lead Ingestion Completed</span>
                <p className="text-stone-500 text-[11px]">Record logged into PaciaOS domain database</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DetailDrawer>
  );
}
