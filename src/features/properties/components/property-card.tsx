"use client";

import * as React from "react";
import type { Property } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Tag,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { PropertyAvailabilityBadge } from "./property-availability-badge";
import { PropertyVerificationBadge } from "./property-verification-badge";
import { cn } from "@/lib/utils/cn";

export interface PropertyCardProps {
  property: Property;
  declaredBudget?: string;
  intent?: "Purchase" | "Rental" | "Investment";
  budgetMatch?: "Within Budget" | "Budget Stretch" | "Sub-Budget";
  onInspectFullSpecs?: (property: Property) => void;
  className?: string;
}

export function PropertyCard({
  property,
  declaredBudget,
  intent,
  budgetMatch = "Within Budget",
  onInspectFullSpecs,
  className,
}: PropertyCardProps) {
  const allImages = property.images && property.images.length > 0
    ? property.images
    : property.featuredImage
    ? [property.featuredImage]
    : [];

  const [activeImageIdx, setActiveImageIdx] = React.useState(0);

  const budgetMatchStyles = {
    "Within Budget": "bg-emerald-50 text-emerald-800 border-emerald-200",
    "Budget Stretch": "bg-amber-50 text-amber-800 border-amber-200",
    "Sub-Budget": "bg-indigo-50 text-indigo-800 border-indigo-200",
  }[budgetMatch];

  return (
    <div className={cn("rounded-xl border border-stone-200 bg-white p-4 space-y-3.5", className)}>
      {/* Section Header: Title & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-[#0d4a36]" />
            Target Property Intelligence
          </h4>
          {intent && (
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-semibold tracking-wider text-stone-600 bg-stone-50 border-stone-200"
            >
              {intent} Intent
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <PropertyAvailabilityBadge availability={property.availability} size="xs" />
          <PropertyVerificationBadge verification={property.verification} size="xs" />
        </div>
      </div>

      {/* Property Visual Showcase */}
      {allImages.length > 0 && (
        <div className="relative group overflow-hidden rounded-lg border border-stone-200 bg-stone-100 aspect-[16/8] sm:aspect-[21/9]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={allImages[activeImageIdx]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Development Stage Badge */}
          {property.developmentStage && (
            <div className="absolute top-2.5 left-2.5">
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white border border-white/10">
                {property.developmentStage}
              </span>
            </div>
          )}

          {/* Photo Counter */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white border border-white/10">
              {activeImageIdx + 1} / {allImages.length} Photos
            </span>
          </div>

          {/* Carousel Arrows */}
          {allImages.length > 1 && (
            <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIdx((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                }}
                className="pointer-events-auto h-6 w-6 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Previous photo"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIdx((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
                }}
                className="pointer-events-auto h-6 w-6 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Next photo"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Property Title & Location */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-stone-900 leading-snug">
          {property.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
          <span>{property.location}</span>
          {property.estateName && (
            <>
              <span className="text-stone-300">•</span>
              <span className="text-stone-600 font-medium">{property.estateName}</span>
            </>
          )}
        </div>
      </div>

      {/* Property Specifications Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
        <div className="p-2 rounded-lg bg-stone-50/70 border border-stone-100 text-xs">
          <span className="text-[10px] text-stone-400 uppercase font-medium">Type</span>
          <p className="font-medium text-stone-800 truncate mt-0.5">
            {property.propertyType}
          </p>
        </div>

        {property.bedrooms !== undefined && (
          <div className="p-2 rounded-lg bg-stone-50/70 border border-stone-100 text-xs">
            <span className="text-[10px] text-stone-400 uppercase font-medium flex items-center gap-1">
              <Bed className="h-3 w-3" /> Bedrooms
            </span>
            <p className="font-semibold text-stone-800 mt-0.5">
              {property.bedrooms} Beds
            </p>
          </div>
        )}

        {property.bathrooms !== undefined && (
          <div className="p-2 rounded-lg bg-stone-50/70 border border-stone-100 text-xs">
            <span className="text-[10px] text-stone-400 uppercase font-medium flex items-center gap-1">
              <Bath className="h-3 w-3" /> Bathrooms
            </span>
            <p className="font-semibold text-stone-800 mt-0.5">
              {property.bathrooms} Baths
            </p>
          </div>
        )}

        {property.squareMeters !== undefined && (
          <div className="p-2 rounded-lg bg-stone-50/70 border border-stone-100 text-xs">
            <span className="text-[10px] text-stone-400 uppercase font-medium flex items-center gap-1">
              <Maximize2 className="h-3 w-3" /> Floor Area
            </span>
            <p className="font-semibold text-stone-800 font-mono mt-0.5">
              {property.squareMeters} m²
            </p>
          </div>
        )}
      </div>

      {/* Property Features / Verified Amenities Chips */}
      {property.features && property.features.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Verified Amenities &amp; Features
          </span>
          <div className="flex flex-wrap gap-1.5">
            {property.features.map((feature, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md bg-stone-50 border border-stone-200/90 px-2 py-0.5 text-[11px] font-medium text-stone-700"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                <span>{feature}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Commercial & Valuation Alignment */}
      <div className="rounded-lg border border-stone-100 bg-[#fbfbfa] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[11px] text-stone-500 flex items-center gap-1">
            <Tag className="h-3 w-3 text-stone-400" />
            Asking / Target Price
          </span>
          <p className="font-mono text-base font-bold text-stone-900 tabular-nums mt-0.5">
            {property.formattedPrice}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:text-right">
          {declaredBudget && (
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-stone-400 uppercase font-medium">Declared Budget</span>
              <p className="font-mono text-xs font-semibold text-stone-700 tabular-nums">
                {declaredBudget}
              </p>
            </div>
          )}
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold", budgetMatchStyles)}
          >
            {budgetMatch}
          </Badge>
        </div>
      </div>

      {/* Interactive Deep-Dive Presentation Trigger */}
      {onInspectFullSpecs && (
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onInspectFullSpecs(property)}
            className="w-full h-8 text-xs font-medium border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-stone-800 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Building className="h-3.5 w-3.5 text-[#0d4a36]" />
            <span>Inspect Full Property Specifications &amp; Title Deeds</span>
            <ExternalLink className="h-3 w-3 ml-0.5 text-stone-400" />
          </Button>
        </div>
      )}
    </div>
  );
}
