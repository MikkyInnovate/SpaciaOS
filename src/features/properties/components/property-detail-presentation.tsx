"use client";

import * as React from "react";
import type { Property } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  FileText,
  Car,
  Sparkles,
} from "lucide-react";
import { PropertyAvailabilityBadge } from "./property-availability-badge";
import { PropertyVerificationBadge } from "./property-verification-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export interface PropertyDetailPresentationProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName?: string;
}

export function PropertyDetailPresentation({
  property,
  open,
  onOpenChange,
  leadName,
}: PropertyDetailPresentationProps) {
  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);
  const [prevPropertyId, setPrevPropertyId] = React.useState(property?.id);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  // Cleanly reset photo index when inspecting a different property
  if (property?.id !== prevPropertyId) {
    setPrevPropertyId(property?.id);
    setActivePhotoIdx(0);
  }

  if (!property) return null;

  const allImages = property.images && property.images.length > 0
    ? property.images
    : property.featuredImage
    ? [property.featuredImage]
    : [];

  const handleShareWhatsApp = () => {
    toast.success("Listing Brochure Dispatched", {
      description: `Dispatched ${property.title} overview to ${leadName || "prospect"} via WhatsApp Business API.`,
    });
  };

  const handleDownloadBrochure = () => {
    toast.info("Preparing Architectural Brochure", {
      description: `Generating high-res specification PDF for ${property.title}.`,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          overlayClassName="z-[60] bg-black/60 backdrop-blur-xs"
          className="z-[60] max-w-3xl max-h-[88vh] overflow-hidden flex flex-col p-0 gap-0 border-stone-200 shadow-2xl rounded-2xl bg-white"
        >
          {/* Header */}
          <DialogHeader className="p-4 sm:p-5 border-b border-stone-100 flex-shrink-0 bg-stone-50/50">
            <div className="flex items-start justify-between gap-3 pr-6">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0d4a36] text-white shadow-2xs mt-0.5">
                  <Building className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-base sm:text-lg font-semibold text-stone-900 truncate">
                      {property.title}
                    </DialogTitle>
                    <PropertyAvailabilityBadge availability={property.availability} size="xs" />
                  </div>
                  <DialogDescription className="text-xs text-stone-500 mt-1 flex items-center gap-1.5 flex-wrap">
                    <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                    <span>{property.location}</span>
                    {property.estateName && (
                      <>
                        <span className="text-stone-300">•</span>
                        <span className="font-medium text-stone-700">{property.estateName}</span>
                      </>
                    )}
                    <span className="text-stone-300">•</span>
                    <span className="font-mono text-stone-400">Ref: {property.id}</span>
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* 1. Hero Architectural Photo Showcase */}
            {allImages.length > 0 && (
              <div className="space-y-2">
                <div className="relative group overflow-hidden rounded-xl border border-stone-200 bg-stone-100 aspect-[16/9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={allImages[activePhotoIdx]}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-101 cursor-pointer"
                    onClick={() => setLightboxOpen(true)}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Top Badge Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white border border-white/10">
                      {property.propertyType}
                    </span>
                    {property.developmentStage && (
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[#0d4a36]/80 backdrop-blur-xs text-white border border-white/10">
                        {property.developmentStage}
                      </span>
                    )}
                  </div>

                  {/* Photo Counter & Enlarge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white border border-white/10">
                      {activePhotoIdx + 1} / {allImages.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="h-6 w-6 rounded bg-black/60 backdrop-blur-xs text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer border border-white/10"
                      title="Enlarge photo"
                    >
                      <Expand className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Carousel Arrows */}
                  {allImages.length > 1 && (
                    <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIdx((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                        }}
                        className="pointer-events-auto h-7 w-7 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Previous photo"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIdx((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
                        }}
                        className="pointer-events-auto h-7 w-7 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Next photo"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnails Strip */}
                {allImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActivePhotoIdx(i)}
                        className={cn(
                          "relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all cursor-pointer",
                          i === activePhotoIdx
                            ? "border-[#0d4a36] ring-1 ring-[#0d4a36]"
                            : "border-stone-200 opacity-60 hover:opacity-100"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={`Photo thumbnail ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. Commercial Pricing & Key Specifications Bar */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-200/60 pb-3">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
                    Listing Valuation
                  </span>
                  <span className="font-mono text-2xl font-bold text-stone-900 tabular-nums">
                    {property.formattedPrice}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <PropertyAvailabilityBadge availability={property.availability} size="sm" />
                  <PropertyVerificationBadge verification={property.verification} size="sm" />
                </div>
              </div>

              {/* Metric Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                  <span className="text-[10px] text-stone-400 uppercase font-medium flex items-center gap-1">
                    <Bed className="h-3 w-3 text-stone-500" /> Bedrooms
                  </span>
                  <p className="font-semibold text-stone-900 mt-0.5">
                    {property.bedrooms ? `${property.bedrooms} Beds` : "N/A"}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                  <span className="text-[10px] text-stone-400 uppercase font-medium flex items-center gap-1">
                    <Bath className="h-3 w-3 text-stone-500" /> Bathrooms
                  </span>
                  <p className="font-semibold text-stone-900 mt-0.5">
                    {property.bathrooms ? `${property.bathrooms} Baths` : "N/A"}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                  <span className="text-[10px] text-stone-400 uppercase font-medium flex items-center gap-1">
                    <Maximize2 className="h-3 w-3 text-stone-500" /> Floor Area
                  </span>
                  <p className="font-mono font-semibold text-stone-900 mt-0.5">
                    {property.squareMeters ? `${property.squareMeters} m²` : "N/A"}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                  <span className="text-[10px] text-stone-400 uppercase font-medium flex items-center gap-1">
                    <Car className="h-3 w-3 text-stone-500" /> Parking
                  </span>
                  <p className="font-semibold text-stone-900 mt-0.5">
                    {property.parkingSpaces ? `${property.parkingSpaces} Bays` : "Gated"}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Title Deed & Legal Underwriting Section */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  Legal Underwriting &amp; Title Verification
                </h4>
                <PropertyVerificationBadge verification={property.verification} size="xs" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-stone-50/70 border border-stone-100 space-y-1">
                  <span className="text-[10px] text-stone-400 uppercase font-medium block">
                    Title Deed Document
                  </span>
                  <p className="font-semibold text-stone-800">
                    {property.verification.titleDeedType || "Under Audit"}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50/70 border border-stone-100 space-y-1">
                  <span className="text-[10px] text-stone-400 uppercase font-medium block">
                    Land Registry Number
                  </span>
                  <p className="font-mono font-semibold text-stone-800">
                    {property.verification.registryNumber || "Pending Issuance"}
                  </p>
                </div>
              </div>

              {property.verification.notes && (
                <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-900 space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 block">
                    Underwriting Clearance Note:
                  </span>
                  <p className="text-[11px] leading-relaxed text-emerald-800">
                    {property.verification.notes}
                  </p>
                  {property.verification.verifiedBy && (
                    <span className="text-[10px] text-emerald-600 block pt-1 font-mono">
                      Signed by: {property.verification.verifiedBy} ({property.verification.verifiedAt})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 4. Verified Features & Amenities */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 border-b border-stone-100 pb-2">
                <Sparkles className="h-3.5 w-3.5 text-[#0d4a36]" />
                Verified Features &amp; Infrastructure
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {property.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-100"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium text-stone-800">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Commercial Terms & Payment Milestones */}
            {property.commercialTerms && (
              <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 border-b border-stone-100 pb-2">
                  <Tag className="h-3.5 w-3.5 text-stone-600" />
                  Commercial Terms &amp; Payment Options
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {property.commercialTerms.serviceCharge && (
                    <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                      <span className="text-[10px] text-stone-400 uppercase font-medium block">
                        Service Charge
                      </span>
                      <p className="font-mono font-semibold text-stone-800 mt-0.5">
                        {property.commercialTerms.serviceCharge}
                      </p>
                    </div>
                  )}

                  {property.commercialTerms.minimumDeposit && (
                    <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                      <span className="text-[10px] text-stone-400 uppercase font-medium block">
                        Minimum Deposit
                      </span>
                      <p className="font-mono font-semibold text-stone-800 mt-0.5">
                        {property.commercialTerms.minimumDeposit}
                      </p>
                    </div>
                  )}
                </div>

                {property.commercialTerms.paymentPlanOptions && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-stone-400 uppercase font-medium block">
                      Supported Payment Structures:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {property.commercialTerms.paymentPlanOptions.map((opt, i) => (
                        <Badge key={i} variant="outline" className="text-[11px] bg-stone-50 border-stone-200 text-stone-700">
                          {opt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. Architectural Description */}
            <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 border-b border-stone-100 pb-2">
                <FileText className="h-3.5 w-3.5 text-stone-600" />
                Architectural Overview
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {property.description}
              </p>
              {property.developerOrOwner && (
                <span className="text-[10px] text-stone-400 block pt-1 font-mono">
                  Developer / Holding: {property.developerOrOwner}
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-3 sm:p-4 border-t border-stone-100 bg-stone-50/50 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShareWhatsApp}
                className="h-8 text-xs bg-white border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer"
              >
                <Share2 className="h-3 w-3 mr-1.5 text-emerald-600" />
                Share with Lead
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadBrochure}
                className="h-8 text-xs bg-white border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer"
              >
                <Download className="h-3 w-3 mr-1.5 text-stone-500" />
                Brochure PDF
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs bg-white cursor-pointer"
            >
              Close Dossier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 shadow-2xl p-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={allImages[activePhotoIdx]}
              alt={property.title}
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
    </>
  );
}
