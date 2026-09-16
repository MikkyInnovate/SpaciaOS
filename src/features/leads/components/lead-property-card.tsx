"use client";

import * as React from "react";
import type { PropertyDetails } from "../types";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Tag,
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LeadPropertyCardProps {
  property?: PropertyDetails;
  fallbackTitle: string;
  fallbackLocation: string;
  declaredBudget: string;
  intent: "Purchase" | "Rental" | "Investment";
}

export function LeadPropertyCard({
  property,
  fallbackTitle,
  fallbackLocation,
  declaredBudget,
  intent,
}: LeadPropertyCardProps) {
  const title = property?.propertyTitle || fallbackTitle;
  const location = property?.location || fallbackLocation;
  const targetPrice = property?.targetPrice || declaredBudget;
  const budgetMatch = property?.budgetMatch || "Within Budget";

  const allImages = React.useMemo(() => {
    if (property?.images && property.images.length > 0) {
      return property.images;
    }
    if (property?.featuredImage) {
      return [property.featuredImage];
    }
    return [];
  }, [property]);

  const [activeImageIdx, setActiveImageIdx] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  const budgetMatchStyles = {
    "Within Budget": "bg-emerald-50 text-emerald-800 border-emerald-200",
    "Budget Stretch": "bg-amber-50 text-amber-800 border-amber-200",
    "Sub-Budget": "bg-indigo-50 text-indigo-800 border-indigo-200",
  }[budgetMatch];

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5 text-[#0d4a36]" />
          Target Property Information
        </h4>
        <Badge
          variant="outline"
          className="text-[10px] uppercase font-semibold tracking-wider text-stone-600 bg-stone-50 border-stone-200"
        >
          {intent} Intent
        </Badge>
      </div>

      {/* Property Visual Showcase */}
      {allImages.length > 0 && (
        <div className="relative group overflow-hidden rounded-lg border border-stone-200 bg-stone-100 aspect-[16/8] sm:aspect-[21/9]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={allImages[activeImageIdx]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102 cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          />

          {/* Image Overlay Header & Controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Development Stage Tag */}
          {property?.developmentStage && (
            <div className="absolute top-2.5 left-2.5">
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white border border-white/10">
                {property.developmentStage}
              </span>
            </div>
          )}

          {/* Photo Counter & Enlarge Button */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white border border-white/10">
              {activeImageIdx + 1} / {allImages.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="h-6 w-6 rounded bg-black/60 backdrop-blur-xs text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer border border-white/10"
              title="Inspect high-res property photo"
            >
              <Expand className="h-3 w-3" />
            </button>
          </div>

          {/* Carousel Arrows if multiple images */}
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
          {title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
          <span>{location}</span>
          {property?.estateName && (
            <>
              <span className="text-stone-300">•</span>
              <span className="text-stone-600 font-medium">{property.estateName}</span>
            </>
          )}
        </div>
      </div>

      {/* Property Specifications Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="p-2 rounded-lg bg-stone-50/70 border border-stone-100 text-xs">
          <span className="text-[10px] text-stone-400 uppercase font-medium">Type</span>
          <p className="font-medium text-stone-800 truncate mt-0.5">
            {property?.propertyType || "Residential"}
          </p>
        </div>

        {property?.bedrooms !== undefined && (
          <div className="p-2 rounded-lg bg-stone-50/70 border border-stone-100 text-xs">
            <span className="text-[10px] text-stone-400 uppercase font-medium flex items-center gap-1">
              <Bed className="h-3 w-3" /> Beds
            </span>
            <p className="font-semibold text-stone-800 mt-0.5">
              {property.bedrooms} Bedrooms
            </p>
          </div>
        )}

        {property?.bathrooms !== undefined && (
          <div className="p-2 rounded-lg bg-stone-50/70 border border-stone-100 text-xs">
            <span className="text-[10px] text-stone-400 uppercase font-medium flex items-center gap-1">
              <Bath className="h-3 w-3" /> Baths
            </span>
            <p className="font-semibold text-stone-800 mt-0.5">
              {property.bathrooms} Baths
            </p>
          </div>
        )}

        {property?.squareMeters !== undefined && (
          <div className="p-2 rounded-lg bg-stone-50/70 border border-stone-100 text-xs">
            <span className="text-[10px] text-stone-400 uppercase font-medium flex items-center gap-1">
              <Maximize2 className="h-3 w-3" /> Size
            </span>
            <p className="font-semibold text-stone-800 font-mono mt-0.5">
              {property.squareMeters} m²
            </p>
          </div>
        )}
      </div>

      {/* Commercial & Valuation Alignment */}
      <div className="rounded-lg border border-stone-100 bg-[#fbfbfa] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[11px] text-stone-500 flex items-center gap-1">
            <Tag className="h-3 w-3 text-stone-400" />
            Asking / Target Price
          </span>
          <p className="font-mono text-base font-bold text-stone-900 tabular-nums mt-0.5">
            {targetPrice}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:text-right">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-stone-400 uppercase font-medium">Declared Budget</span>
            <p className="font-mono text-xs font-semibold text-stone-700 tabular-nums">
              {declaredBudget}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold", budgetMatchStyles)}
          >
            {budgetMatch}
          </Badge>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 shadow-2xl p-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={allImages[activeImageIdx]}
              alt={title}
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
              title="Close image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
