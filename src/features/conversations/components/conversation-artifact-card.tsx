"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { MessageArtifact } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  CheckCircle2,
  FileText,
  ExternalLink,
  MapPin,
  Bed,
  Bath,
  Clock,
  User,
} from "lucide-react";
import { toast } from "sonner";

export interface ConversationArtifactCardProps {
  artifact: MessageArtifact;
  className?: string;
}

export function ConversationArtifactCard({
  artifact,
  className,
}: ConversationArtifactCardProps) {
  if (artifact.type === "property_card") {
    return (
      <div
        className={cn(
          "mt-2.5 overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-2xs transition-all hover:border-stone-300",
          className
        )}
      >
        {artifact.propertyImage && (
          <div className="relative h-32 w-full bg-stone-100">
            <Image
              src={artifact.propertyImage}
              alt={artifact.propertyTitle || "Property"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2.5 right-2.5 flex items-baseline justify-between text-white">
              <span className="font-mono text-sm font-semibold tabular-nums text-white drop-shadow-xs">
                {artifact.propertyPrice}
              </span>
              <Badge className="bg-emerald-600/90 text-[10px] text-white backdrop-blur-xs border-0">
                Verified Listing
              </Badge>
            </div>
          </div>
        )}

        <div className="p-3 space-y-2">
          <div>
            <h4 className="text-xs font-semibold text-stone-900 line-clamp-1">
              {artifact.propertyTitle}
            </h4>
            <p className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5 line-clamp-1">
              <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
              <span>{artifact.propertyLocation}</span>
            </p>
          </div>

          {(artifact.bedrooms || artifact.bathrooms || artifact.squareMeters) && (
            <div className="flex items-center gap-3 text-[11px] text-stone-600 pt-1 border-t border-stone-100">
              {artifact.bedrooms && (
                <span className="flex items-center gap-1">
                  <Bed className="h-3 w-3 text-stone-400" />
                  {artifact.bedrooms} Beds
                </span>
              )}
              {artifact.bathrooms && (
                <span className="flex items-center gap-1">
                  <Bath className="h-3 w-3 text-stone-400" />
                  {artifact.bathrooms} Baths
                </span>
              )}
              {artifact.squareMeters && (
                <span className="font-mono text-stone-500">
                  {artifact.squareMeters} m²
                </span>
              )}
            </div>
          )}

          <div className="pt-1 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info("Opening Property Specifications", {
                  description: `${artifact.propertyTitle} title deeds and brochure.`,
                });
              }}
              className="h-7 text-[11px] gap-1 px-2.5 text-stone-700 bg-stone-50 hover:bg-stone-100 border-stone-200"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Inspect Specs</span>
            </Button>
            <span className="text-[10px] text-stone-400">Attached by AI</span>
          </div>
        </div>
      </div>
    );
  }

  if (artifact.type === "viewing_invite") {
    return (
      <div
        className={cn(
          "mt-2.5 rounded-lg border border-purple-200/90 bg-purple-50/40 p-3 space-y-2 text-xs",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-purple-950">
            <CalendarCheck className="h-4 w-4 text-purple-700" />
            <span>VIP Physical Inspection Confirmed</span>
          </div>
          <Badge variant="outline" className="bg-purple-100/80 text-purple-800 border-purple-200 text-[10px]">
            {artifact.viewingStatus?.toUpperCase() || "CONFIRMED"}
          </Badge>
        </div>

        <div className="space-y-1 text-stone-700 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            <span className="font-medium text-stone-900">{artifact.viewingDate}</span>
            <span className="text-stone-500">• {artifact.viewingTime}</span>
          </div>
          {artifact.viewingLocation && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-purple-600 shrink-0" />
              <span className="text-stone-600 truncate">{artifact.viewingLocation}</span>
            </div>
          )}
          {artifact.viewingBroker && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-purple-600 shrink-0" />
              <span className="text-stone-600">Assigned Broker: <strong>{artifact.viewingBroker}</strong></span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (artifact.type === "bant_milestone") {
    return (
      <div
        className={cn(
          "mt-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 space-y-1.5 text-xs",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-[#0d4a36]">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{artifact.milestoneTitle || "BANT Qualification Gate Passed"}</span>
          </div>
          {artifact.milestoneScore && (
            <span className="font-mono text-xs font-bold text-[#0d4a36] bg-emerald-100/80 px-1.5 py-0.5 rounded">
              {artifact.milestoneScore}/100
            </span>
          )}
        </div>
        {artifact.milestoneDetails && (
          <p className="text-[11px] text-stone-600 leading-relaxed">
            {artifact.milestoneDetails}
          </p>
        )}
      </div>
    );
  }

  if (artifact.type === "document") {
    return (
      <div
        className={cn(
          "mt-2.5 flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50/80 p-2.5 text-xs hover:bg-stone-100 transition-colors cursor-pointer",
          className
        )}
        onClick={() => {
          toast.success("Downloading Document", {
            description: artifact.documentName,
          });
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-stone-500 shrink-0" />
          <div className="min-w-0 truncate">
            <p className="font-medium text-stone-800 text-[11px] truncate">
              {artifact.documentName || "Title Deed Memorandum.pdf"}
            </p>
            <p className="text-[10px] text-stone-400">
              {artifact.documentSize || "2.4 MB"} • PDF Document
            </p>
          </div>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-stone-400 shrink-0 ml-2" />
      </div>
    );
  }

  return null;
}
