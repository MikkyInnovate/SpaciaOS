"use client";

import * as React from "react";
import type { LeadActivity, ActivityType } from "../types";
import {
  WorkflowStatusIndicator,
  AIActivityIndicator,
  HumanActivityIndicator,
  WorkflowRetryState,
} from "@/features/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LeadActivityTimelineProps {
  activities?: LeadActivity[];
  onAddNote?: (noteText: string, imageUrl?: string) => void;
  onRetryActivity?: (activityId: string) => Promise<void> | void;
  onInspectCall?: (callId?: string) => void;
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
  onRetryActivity,
  onInspectCall,
}: LeadActivityTimelineProps) {
  const [newNote, setNewNote] = React.useState("");
  const [attachedImage, setAttachedImage] = React.useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "calls" | "notes" | "system">("all");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredActivities = React.useMemo(() => {
    if (activeFilter === "all") return activities;
    if (activeFilter === "calls") {
      return activities.filter((a) => a.type === "ai_voice_call");
    }
    if (activeFilter === "notes") {
      return activities.filter((a) => a.type === "human_note" || a.meta?.imageUrl);
    }
    if (activeFilter === "system") {
      return activities.filter(
        (a) => a.type === "status_change" || a.type === "viewing_scheduled" || a.type === "inbound_capture"
      );
    }
    return activities;
  }, [activities, activeFilter]);

  const callsCount = React.useMemo(
    () => activities.filter((a) => a.type === "ai_voice_call").length,
    [activities]
  );
  const notesCount = React.useMemo(
    () => activities.filter((a) => a.type === "human_note" || a.meta?.imageUrl).length,
    [activities]
  );
  const systemCount = React.useMemo(
    () =>
      activities.filter(
        (a) =>
          a.type === "status_change" ||
          a.type === "viewing_scheduled" ||
          a.type === "inbound_capture"
      ).length,
    [activities]
  );

  const filterDisplayMap = {
    all: { label: "All Events", count: activities.length },
    calls: { label: "Voice Calls", count: callsCount },
    notes: { label: "Broker Notes", count: notesCount },
    system: { label: "System & Stage", count: systemCount },
  };

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
    <div className="rounded-xl border border-stone-200/70 bg-white p-4 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-100 text-stone-700">
            <History className="h-3.5 w-3.5 text-[#0d4a36]" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
              Interaction Timeline &amp; Audit Log
            </h4>
            <span className="text-[11px] text-stone-500">
              Omnichannel touchpoints, AI voice calls, and broker memos
            </span>
          </div>
        </div>

        {/* Dropdown Filter */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 select-none">
            Filter:
          </span>
          <Select
            value={activeFilter}
            onValueChange={(val) => setActiveFilter(val as "all" | "calls" | "notes" | "system")}
          >
            <SelectTrigger className="h-7 w-auto min-w-[145px] gap-2 px-2.5 py-0 text-xs bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 text-stone-800 font-medium cursor-pointer rounded-md focus:ring-1 focus:ring-stone-300 transition-colors">
              <div className="flex items-center gap-1.5 text-xs text-stone-800 font-medium truncate">
                <Filter className="h-3 w-3 text-stone-400 shrink-0" />
                <span>
                  {filterDisplayMap[activeFilter].label} ({filterDisplayMap[activeFilter].count})
                </span>
              </div>
            </SelectTrigger>
            <SelectContent
              align="end"
              sideOffset={4}
              collisionPadding={16}
              className="text-xs min-w-[185px] bg-white border border-stone-200 shadow-xl rounded-lg z-50 p-1"
            >
              <SelectItem value="all" className="text-xs py-1.5 cursor-pointer">
                <div className="flex items-center justify-between w-full gap-3">
                  <span className="font-medium text-stone-800">All Events</span>
                  <span className="font-mono text-[10px] text-stone-400">({activities.length})</span>
                </div>
              </SelectItem>
              <SelectItem value="calls" className="text-xs py-1.5 cursor-pointer">
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-medium text-stone-800">Voice Calls</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-700 font-semibold">({callsCount})</span>
                </div>
              </SelectItem>
              <SelectItem value="notes" className="text-xs py-1.5 cursor-pointer">
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                    <span className="font-medium text-stone-800">Broker Notes</span>
                  </div>
                  <span className="font-mono text-[10px] text-sky-700 font-semibold">({notesCount})</span>
                </div>
              </SelectItem>
              <SelectItem value="system" className="text-xs py-1.5 cursor-pointer">
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-medium text-stone-800">System &amp; Stage</span>
                  </div>
                  <span className="font-mono text-[10px] text-stone-400">({systemCount})</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
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
        {/* Timeline track line with continuous animated light beam */}
        <div className="absolute left-2.75 top-2 bottom-2 w-0.5 bg-stone-200/70 rounded-full overflow-hidden" aria-hidden="true">
          <div className="w-full h-32 bg-gradient-to-b from-transparent via-[#0d4a36] to-transparent animate-timeline-beam opacity-80" />
        </div>

        {filteredActivities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/50 p-6 text-center space-y-1.5 my-2">
            <History className="h-5 w-5 text-stone-400 mx-auto" />
            <p className="text-xs font-semibold text-stone-700">
              No matching activity events found
            </p>
            <p className="text-[11px] text-stone-500">
              {activeFilter === "all"
                ? "No previous interaction history recorded for this prospect."
                : `No events matching the "${activeFilter}" category for this lead.`}
            </p>
            {activeFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveFilter("all")}
                className="h-6 text-[10px] mt-1 bg-white text-stone-600 cursor-pointer"
              >
                Show All Touchpoints
              </Button>
            )}
          </div>
        ) : (
          filteredActivities.map((activity, idx) => {
            const isLatest = idx === 0;
            return (
              <div
                key={activity.id || idx}
                className="group relative flex items-start gap-3 text-xs transition-all duration-200"
              >
                {/* Timeline Icon Node with animated pulse and hover state */}
                <div className="absolute -left-6 top-0 flex items-center justify-center">
                  {isLatest && (
                    <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping opacity-60 pointer-events-none" />
                  )}
                  <div
                    className={cn(
                      "relative flex h-6 w-6 items-center justify-center rounded-full border shadow-2xs transition-all duration-300 group-hover:scale-115 group-hover:shadow-md group-hover:ring-2 group-hover:ring-stone-400/20",
                      getActivityDotBg(activity.type),
                      isLatest && "ring-2 ring-emerald-500/25 animate-dot-glow"
                    )}
                  >
                    <div className="transition-transform duration-200 group-hover:scale-110">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                </div>

              {/* Event Body */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-stone-900 leading-tight">
                      {activity.title}
                    </span>
                    {activity.status && (
                      <WorkflowStatusIndicator
                        status={activity.status}
                        retryAttempt={activity.retry?.currentAttempt}
                        maxRetries={activity.retry?.maxRetries}
                        variant="badge"
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 shrink-0 select-none">
                    {activity.timestamp}
                  </span>
                </div>

                <p className="text-stone-600 leading-relaxed text-[11px]">
                  {activity.description}
                </p>

                {/* Connected Call Quick Inspection Bar */}
                {activity.type === "ai_voice_call" && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                        <PhoneCall className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-emerald-950 text-xs">
                            Vapi Voice Recording &amp; Transcript
                          </span>
                          {activity.meta?.duration && (
                            <span className="text-[10px] font-mono font-medium text-emerald-800 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                              {activity.meta.duration}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-emerald-800/80">
                          Neural Executive audio mastered • Synchronized turn transcript
                        </p>
                      </div>
                    </div>

                    {onInspectCall && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onInspectCall(activity.id)}
                        className="h-7 text-xs px-2.5 bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-100/80 cursor-pointer shadow-2xs font-medium shrink-0"
                      >
                        <PhoneCall className="h-3 w-3 mr-1 text-emerald-700" />
                        <span>Inspect in Call Cockpit</span>
                      </Button>
                    )}
                  </div>
                )}

                {/* Workflow Failure / Retry Component */}
                {(activity.status === "retrying" ||
                  activity.status === "failed" ||
                  activity.retry ||
                  activity.failure) && (
                  <WorkflowRetryState
                    workflowId={activity.id}
                    retry={activity.retry}
                    failure={activity.failure}
                    onRetry={onRetryActivity}
                  />
                )}

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

                {/* Transcript snippet if present */}
                {activity.meta?.transcriptSnippet && (
                  <div className="rounded-lg bg-stone-50 p-2 border border-stone-200 text-[11px] font-mono text-stone-700 whitespace-pre-wrap leading-relaxed">
                    {activity.meta.transcriptSnippet}
                  </div>
                )}

                {/* Metadata & Actor Attribution badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 border-t border-stone-100 text-xs">
                  {/* Actor Attribution */}
                  <div className="flex items-center gap-1.5">
                    {activity.actor?.type === "ai_agent" && (
                      <AIActivityIndicator actor={activity.actor} variant="badge" />
                    )}
                    {activity.actor?.type === "human_broker" && (
                      <HumanActivityIndicator actor={activity.actor} variant="badge" />
                    )}
                  </div>

                  {/* Channel & Detail Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
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
            </div>
          );
        })
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
