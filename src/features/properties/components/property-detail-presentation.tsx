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
  Mail,
  Download,
  Loader2,
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
  leadPhone?: string;
  leadEmail?: string;
}

export function PropertyDetailPresentation({
  property,
  open,
  onOpenChange,
  leadName,
  leadPhone,
  leadEmail,
}: PropertyDetailPresentationProps) {
  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);
  const [prevPropertyId, setPrevPropertyId] = React.useState(property?.id);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

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

  const handleShareEmail = () => {
    const greetingName = leadName || "Valued Prospect";
    const featuresSummary = property.features.slice(0, 4).join(", ");
    const specsSummary = [
      property.bedrooms ? `${property.bedrooms} Beds` : "",
      property.bathrooms ? `${property.bathrooms} Baths` : "",
      property.squareMeters ? `${property.squareMeters} m²` : "",
    ].filter(Boolean).join(" • ");

    const pitchText = `Hello ${greetingName},

Here is the exclusive portfolio dossier for ${property.title}:

📍 Location: ${property.location}${property.estateName ? ` (${property.estateName})` : ""}
💰 Asking Valuation: ${property.formattedPrice}
📐 Layout: ${specsSummary}
🏛️ Legal Title: ${property.verification.titleDeedType || "Verified Title Deed"}
✨ Highlights: ${featuresSummary}

Would you like to schedule a private physical inspection this week?

— Spacia Real-Estate Sales Command`;

    // Copy to clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pitchText);
    }

    const subject = `Executive Portfolio Dossier: ${property.title}`;
    const mailtoUrl = `mailto:${leadEmail || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(pitchText)}`;

    window.open(mailtoUrl, "_blank");

    toast.success("Email Pitch Dossier Prepared", {
      description: leadEmail
        ? `Opened email client for ${leadEmail} and copied pitch to clipboard.`
        : "Brochure pitch copied to clipboard and email client opened.",
    });
  };

  const handleDownloadBrochure = async () => {
    try {
      setIsGeneratingPdf(true);
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // 1. Luxury Header Banner (Pacia Green #0d4a36)
      doc.setFillColor(13, 74, 54);
      doc.rect(0, 0, 210, 32, "F");

      // Brand Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("SPACIA", 15, 16);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("PREMIER REAL-ESTATE ASSET DOSSIER", 15, 23);

      const todayStr = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      doc.text(`DATE: ${todayStr}`, 195, 20, { align: "right" });

      // 2. Property Title & Location
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(property.title, 15, 45);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110, 110, 110);
      const locStr = `${property.estateName ? property.estateName + " • " : ""}${property.location}`;
      doc.text(locStr, 15, 52);

      // 3. Valuation & Status Box
      doc.setFillColor(248, 248, 246);
      doc.setDrawColor(220, 220, 218);
      doc.roundedRect(15, 58, 180, 20, 2, 2, "FD");

      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL ASKING VALUATION", 20, 66);

      doc.setTextColor(13, 74, 54);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text(property.formattedPrice, 20, 74);

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Availability: ${property.availability}  •  Title: ${property.verification.titleDeedType || "Verified"}`,
        190,
        70,
        { align: "right" }
      );

      // 4. Specifications Section
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Spatial & Architectural Specifications", 15, 88);

      doc.setDrawColor(225, 225, 225);
      doc.line(15, 91, 195, 91);

      const specs = [
        ["Property Category", property.propertyType],
        ["Bedrooms", property.bedrooms ? `${property.bedrooms} Ensuite Beds` : "N/A"],
        ["Bathrooms", property.bathrooms ? `${property.bathrooms} Bathrooms` : "N/A"],
        ["Floor Area", property.squareMeters ? `${property.squareMeters} m²` : "N/A"],
        ["Parking Bays", property.parkingSpaces ? `${property.parkingSpaces} Dedicated Bays` : "Gated Driveway"],
        ["Development Stage", property.developmentStage || "Ready for Occupancy"],
      ];

      let currentY = 99;
      specs.forEach(([label, value], i) => {
        const x = i % 2 === 0 ? 15 : 110;
        doc.setFontSize(8.5);
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "normal");
        doc.text(label, x, currentY);

        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.text(String(value), x, currentY + 5.5);

        if (i % 2 === 1) currentY += 13.5;
      });

      // 5. Legal Underwriting & Title Verification Box
      currentY += 6;
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Legal Underwriting & Title Verification", 15, currentY);

      doc.setDrawColor(225, 225, 225);
      doc.line(15, currentY + 3, 195, currentY + 3);

      currentY += 10;
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(15, currentY, 180, 26, 2, 2, "FD");

      doc.setTextColor(22, 101, 52);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`TITLE STATUS: ${property.verification.titleDeedType || "Government Consent"}`, 20, currentY + 7);

      doc.setTextColor(70, 70, 70);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Registry Ref: ${property.verification.registryNumber || "Verified Cadastral Index"}`, 20, currentY + 13.5);

      if (property.verification.notes) {
        doc.setFontSize(8);
        const splitNotes = doc.splitTextToSize(`Audit Notes: ${property.verification.notes}`, 168);
        doc.text(splitNotes, 20, currentY + 19);
      }

      // 6. Verified Amenities
      currentY += 34;
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Verified Amenities & Infrastructure", 15, currentY);

      doc.setDrawColor(225, 225, 225);
      doc.line(15, currentY + 3, 195, currentY + 3);

      currentY += 9;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);

      const features = property.features || [];
      features.forEach((feat, idx) => {
        const col = idx % 2 === 0 ? 15 : 110;
        const row = currentY + Math.floor(idx / 2) * 6;
        doc.text(`• ${feat}`, col, row);
      });

      // 7. Commercial Terms (if present)
      if (property.commercialTerms) {
        const featRows = Math.ceil(features.length / 2);
        const termsY = currentY + featRows * 6 + 6;
        doc.setTextColor(20, 20, 20);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Commercial Terms & Payment Milestones", 15, termsY);
        doc.line(15, termsY + 3, 195, termsY + 3);

        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        let ty = termsY + 9;
        if (property.commercialTerms.serviceCharge) {
          doc.text(`Service Charge: ${property.commercialTerms.serviceCharge}`, 15, ty);
          ty += 5.5;
        }
        if (property.commercialTerms.minimumDeposit) {
          doc.text(`Initial Deposit: ${property.commercialTerms.minimumDeposit}`, 15, ty);
          ty += 5.5;
        }
      }

      // 8. Footer
      doc.setFillColor(245, 245, 244);
      doc.rect(0, 282, 210, 15, "F");
      doc.setTextColor(140, 140, 140);
      doc.setFontSize(8);
      doc.text("Spacia Real-Estate Sales OS • Confidential Investment Factsheet", 105, 290, { align: "center" });

      // Save PDF file
      const fileName = `${property.slug || property.id}-brochure.pdf`;
      doc.save(fileName);

      toast.success("Architectural Brochure Downloaded", {
        description: `Saved ${fileName} to your downloads folder.`,
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF", {
        description: "Please retry.",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
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
                onClick={handleShareEmail}
                className="h-8 text-xs bg-white border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer"
              >
                <Mail className="h-3 w-3 mr-1.5 text-stone-600" />
                Email Pitch Dossier
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadBrochure}
                disabled={isGeneratingPdf}
                className="h-8 text-xs bg-white border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin text-stone-500" />
                ) : (
                  <Download className="h-3 w-3 mr-1.5 text-stone-500" />
                )}
                <span>{isGeneratingPdf ? "Generating PDF..." : "Brochure PDF"}</span>
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
