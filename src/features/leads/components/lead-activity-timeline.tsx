"use client";

import * as React from "react";
import type { LeadActivity, ActivityType } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  History,
  PhoneCall,
  MessageSquare,
  CalendarCheck,
  Globe,
  FileText,
  ShieldCheck,
  Send,
  Image as ImageIcon,
  X,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LeadActivityTimelineProps {
  activities?: LeadActivity[];
  onAddNote?: (noteText: string, imageUrl?: string) => void;
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "ai_voice_call":
      return <PhoneCall className="h-3.5 w-3.5 text-emerald-700" />;
    case "whatsapp_message":
      return <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />;
    case "viewing_scheduled":
      return <CalendarCheck className="h-3.5 w-3.5 text-indigo-700" />;
    case "status_change":
      return <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />;
    case "human_note":
      return <FileText className="h-3.5 w-3.5 text-stone-700" />;
    case "inbound_capture":
    default:
      return <Globe className="h-3.5 w-3.5 text-stone-600" />;
  }
}

function getActivityDotBg(type: ActivityType) {
  switch (type) {
    case "ai_voice_call":
    case "whatsapp_message":
      return "bg-emerald-50 border-emerald-200";
    case "viewing_scheduled":
      return "bg-indigo-50 border-indigo-200";
    case "status_change":
      return "bg-amber-50 border-amber-200";
    case "human_note":
      return "bg-stone-100 border-stone-200";
    case "inbound_capture":
    default:
      return "bg-stone-100 border-stone-200";
  }
}

export function LeadActivityTimeline({
  activities = [],
  onAddNote,
}: LeadActivityTimelineProps) {
  const [newNote, setNewNote] = React.useState("");
  const [attachedImage, setAttachedImage] = React.useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setAttachedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveAttachment = () => {
    setAttachedImage(null);
    setAttachedImageName(null);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newNote.trim() && !attachedImage) || !onAddNote) return;

    setIsSubmitting(true);
    onAddNote(newNote.trim() || "Image attachment appended by broker", attachedImage || undefined);
    setNewNote("");
    setAttachedImage(null);
    setAttachedImageName(null);
    setIsSubmitting(false);
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-[#0d4a36]" />
          Interaction History &amp; Activity Log
        </h4>
        <span className="text-[11px] font-mono text-stone-400">
          {activities.length} Recorded Events
        </span>
      </div>

      {/* Quick Broker Note Ingestion with Image Attachment */}
      {onAddNote && (
        <div className="space-y-2">
          {/* Pending Attachment Chip */}
          {attachedImage && (
            <div className="flex items-center gap-2 p-1.5 px-2 bg-stone-50 border border-stone-200 rounded-lg text-xs w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachedImage}
                alt="Attachment preview"
                className="h-7 w-7 rounded object-cover border border-stone-200"
              />
              <span className="text-[11px] font-medium text-stone-700 truncate max-w-[200px]">
                {attachedImageName || "Attached photo"}
              </span>
              <button
                type="button"
                onClick={handleRemoveAttachment}
                className="text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer"
                title="Remove attachment"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <form onSubmit={handleAddNoteSubmit} className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <Input
              placeholder="Add broker operational note or call memo..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="h-8 text-xs bg-stone-50/70 border-stone-200 focus:bg-white flex-1"
            />

            {/* Image Attachment Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0 border-stone-200 bg-white text-stone-500 hover:text-stone-900 hover:bg-stone-50 cursor-pointer shrink-0"
              title="Attach site photo or inspection image"
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={(!newNote.trim() && !attachedImage) || isSubmitting}
              className="h-8 px-2.5 bg-[#0d4a36] hover:bg-[#093829] text-white text-xs cursor-pointer shrink-0"
            >
              <Send className="h-3 w-3 mr-1" />
              <span>Add</span>
            </Button>
          </form>
        </div>
      )}

      {/* Vertical Timeline */}
      <div className="relative pl-6 space-y-4 pt-1">
        {/* Timeline track line */}
        <div className="absolute left-2.75 top-2 bottom-2 w-px bg-stone-200" aria-hidden="true" />

        {activities.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-2">
            No previous interaction history recorded for this lead.
          </p>
        ) : (
          activities.map((activity, idx) => (
            <div key={activity.id || idx} className="relative flex items-start gap-3 text-xs">
              {/* Timeline Icon Node */}
              <div
                className={cn(
                  "absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full border",
                  getActivityDotBg(activity.type)
                )}
              >
                {getActivityIcon(activity.type)}
              </div>

              {/* Event Body */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-stone-900 leading-tight">
                    {activity.title}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 shrink-0">
                    {activity.timestamp}
                  </span>
                </div>

                <p className="text-stone-600 leading-relaxed text-[11px]">
                  {activity.description}
                </p>

                {/* Attached Image Thumbnail */}
                {activity.meta?.imageUrl && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(activity.meta?.imageUrl || null)}
                      className="group relative block overflow-hidden rounded-lg border border-stone-200 bg-stone-50 cursor-pointer transition-all hover:border-stone-400"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activity.meta.imageUrl}
                        alt={activity.meta.imageCaption || "Timeline photo"}
                        className="h-28 w-44 rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1 font-medium shadow-sm">
                          <ZoomIn className="h-3 w-3" />
                          Inspect Photo
                        </span>
                      </div>
                    </button>
                    {activity.meta.imageCaption && (
                      <span className="text-[10px] text-stone-400 italic block mt-1">
                        {activity.meta.imageCaption}
                      </span>
                    )}
                  </div>
                )}

                {/* Metadata badges (duration, outcome, broker, channel) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {activity.channel && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 bg-stone-50 text-stone-500 border-stone-200">
                      {activity.channel}
                    </Badge>
                  )}
                  {activity.meta?.duration && (
                    <span className="text-[10px] font-mono text-stone-500">
                      Duration: {activity.meta.duration}
                    </span>
                  )}
                  {activity.meta?.outcome && (
                    <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      {activity.meta.outcome}
                    </span>
                  )}
                  {activity.meta?.viewingDate && (
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                      Slot: {activity.meta.viewingDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 shadow-2xl p-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Attachment inspection view"
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
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
