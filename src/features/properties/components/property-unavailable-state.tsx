"use client";

import * as React from "react";
import type { Property } from "../types";
import { AlertTriangle, Building, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyAvailabilityBadge } from "./property-availability-badge";

export interface PropertyUnavailableStateProps {
  property: Property;
  onSelectAlternative?: (propertyId: string) => void;
  onViewSpecs?: () => void;
}

export function PropertyUnavailableState({
  property,
  onSelectAlternative,
  onViewSpecs,
}: PropertyUnavailableStateProps) {
  return (
    <div className="rounded-xl border border-amber-200/90 bg-amber-50/40 p-4 space-y-3.5">
      {/* Alert Header */}
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-amber-900">
              Listing Off-Market / Unavailable
            </h4>
            <span className="text-[10px] text-amber-700">
              This property is currently {property.availability.toLowerCase()} and cannot proceed to viewing.
            </span>
          </div>
        </div>

        <PropertyAvailabilityBadge availability={property.availability} size="xs" />
      </div>

      {/* Property Summary */}
      <div className="rounded-lg bg-white border border-amber-100 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <h5 className="font-semibold text-stone-900">{property.title}</h5>
          <p className="text-stone-500 text-[11px]">{property.location}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-stone-400 uppercase font-medium block">
              Asking Price
            </span>
            <span className="font-mono font-bold text-stone-800 tabular-nums">
              {property.formattedPrice}
            </span>
          </div>

          {onViewSpecs && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onViewSpecs}
              className="h-7 px-2 text-xs bg-white border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer"
            >
              <Building className="h-3 w-3 mr-1 text-stone-500" />
              Specs
            </Button>
          )}
        </div>
      </div>

      {/* Alternative Recommendations Prompt */}
      {onSelectAlternative && (
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] text-amber-800">
            Recommend alternative verified active listings in {property.city}:
          </span>
          <Button
            type="button"
            size="sm"
            onClick={() => onSelectAlternative("prop_lekki_01")}
            className="h-7 px-2.5 text-xs bg-amber-800 hover:bg-amber-900 text-white cursor-pointer shrink-0"
          >
            <span>Switch to Active Listing</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
