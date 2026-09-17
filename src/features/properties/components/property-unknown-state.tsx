"use client";

import * as React from "react";
import { HelpCircle, Sparkles, MapPin, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface PropertyUnknownStateProps {
  prospectPreference?: {
    location?: string;
    declaredBudget?: string;
    intent?: "Purchase" | "Rental" | "Investment";
    notes?: string;
  };
  onMatchProperty?: () => void;
}

export function PropertyUnknownState({
  prospectPreference,
  onMatchProperty,
}: PropertyUnknownStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-4 space-y-3.5">
      <div className="flex items-center justify-between border-b border-stone-200/70 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-200 text-stone-600">
            <HelpCircle className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-stone-800">
              No Target Property Linked
            </h4>
            <span className="text-[10px] text-stone-500">
              Inbound inquiry was captured with general criteria.
            </span>
          </div>
        </div>

        {prospectPreference?.intent && (
          <Badge
            variant="outline"
            className="text-[10px] uppercase font-semibold text-stone-600 bg-white border-stone-200"
          >
            {prospectPreference.intent} Inquiry
          </Badge>
        )}
      </div>

      {/* Prospect Criteria Context */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {prospectPreference?.location && (
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-stone-200/80">
            <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-stone-400 uppercase font-medium block">
                Target Zone
              </span>
              <span className="font-medium text-stone-800 truncate">
                {prospectPreference.location}
              </span>
            </div>
          </div>
        )}

        {prospectPreference?.declaredBudget && (
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-stone-200/80">
            <Tag className="h-3.5 w-3.5 text-stone-400 shrink-0" />
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-medium block">
                Declared Budget
              </span>
              <span className="font-mono font-semibold text-stone-800 tabular-nums">
                {prospectPreference.declaredBudget}
              </span>
            </div>
          </div>
        )}
      </div>

      {prospectPreference?.notes && (
        <p className="text-[11px] text-stone-500 italic bg-white/60 p-2 rounded-lg border border-stone-100">
          “{prospectPreference.notes}”
        </p>
      )}

      {/* Action to match property */}
      {onMatchProperty && (
        <div className="pt-1 flex items-center justify-between gap-2">
          <span className="text-[11px] text-stone-500">
            Assign a matching verified listing from inventory:
          </span>
          <Button
            type="button"
            size="sm"
            onClick={onMatchProperty}
            className="h-7 px-2.5 text-xs bg-[#0d4a36] hover:bg-[#093829] text-white cursor-pointer shrink-0"
          >
            <Sparkles className="h-3 w-3 mr-1.5 text-emerald-300" />
            <span>Match Listing</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
