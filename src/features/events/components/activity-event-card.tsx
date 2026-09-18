import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { WorkflowActivityEvent, EventCategory } from "../types";
import { WorkflowStatusIndicator } from "./workflow-status-indicator";
import { AIActivityIndicator } from "./ai-activity-indicator";
import { HumanActivityIndicator } from "./human-activity-indicator";
import { WorkflowRetryState } from "./workflow-retry-state";
import { Badge } from "@/components/ui/badge";
import {
  PhoneCall,
  MessageSquare,
  CalendarCheck,
  FileText,
  Globe,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCode,
  Image as ImageIcon,
  CheckCheck,
  Sparkles,
} from "lucide-react";

export interface ActivityEventCardProps {
  event: WorkflowActivityEvent;
  onRetry?: (workflowId: string) => Promise<void> | void;
  onEscalate?: (workflowId: string) => Promise<void> | void;
  className?: string;
  defaultExpanded?: boolean;
}

function getCategoryIcon(category: EventCategory) {
  switch (category) {
    case "voice_call":
      return <PhoneCall className="h-3.5 w-3.5 text-emerald-700" />;
    case "whatsapp":
      return <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />;
    case "calendar":
      return <CalendarCheck className="h-3.5 w-3.5 text-indigo-700" />;
    case "broker_note":
      return <FileText className="h-3.5 w-3.5 text-stone-700" />;
    case "status_transition":
      return <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />;
    case "system_webhook":
    default:
      return <Globe className="h-3.5 w-3.5 text-stone-600" />;
  }
}

function getCategoryDotBg(category: EventCategory) {
  switch (category) {
    case "voice_call":
    case "whatsapp":
      return "bg-emerald-50 border-emerald-200";
    case "calendar":
      return "bg-indigo-50 border-indigo-200";
    case "status_transition":
      return "bg-amber-50 border-amber-200";
    case "broker_note":
    case "system_webhook":
    default:
      return "bg-stone-100 border-stone-200";
  }
}

export function ActivityEventCard({
  event,
  onRetry,
  onEscalate,
  className,
  defaultExpanded = false,
}: ActivityEventCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const isFailedOrRetrying =
    event.status === "failed" || event.status === "retrying";

  const hasPayloadDetails =
    Boolean(event.payload?.transcriptSnippet) ||
    Boolean(event.payload?.attachments?.length) ||
    Boolean(event.payload?.rawPayloadJson);

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-white p-3.5 space-y-3 transition-all duration-150 hover:shadow-2xs",
        isFailedOrRetrying
          ? "border-amber-300/80 bg-amber-50/10"
          : "border-stone-200",
        className
      )}
    >
      {/* Card Header: Category Icon, Title, Status & Timestamp */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
              getCategoryDotBg(event.category)
            )}
          >
            {getCategoryIcon(event.category)}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-xs text-stone-900 leading-tight truncate">
                {event.title}
              </h4>
              <WorkflowStatusIndicator
                status={event.status}
                retryAttempt={event.retry?.currentAttempt}
                maxRetries={event.retry?.maxRetries}
                variant="badge"
              />
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {event.description}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-stone-400 shrink-0 select-none">
          {event.timestamp}
        </span>
      </div>

      {/* Embedded Retry/Failure Banner if applicable */}
      {isFailedOrRetrying && (
        <WorkflowRetryState
          workflowId={event.workflowId}
          retry={event.retry}
          failure={event.failure}
          onRetry={onRetry}
          onEscalate={onEscalate}
        />
      )}

      {/* Actor & Metadata Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
        {/* Actor attribution badge */}
        <div className="flex items-center gap-2">
          {event.actor.type === "ai_agent" && (
            <AIActivityIndicator actor={event.actor} variant="badge" />
          )}

          {event.actor.type === "human_broker" && (
            <HumanActivityIndicator actor={event.actor} variant="badge" />
          )}

          {event.actor.type === "system" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-stone-200 bg-stone-50 text-[11px] font-medium text-stone-600">
              <Globe className="h-3 w-3 text-stone-400" />
              <span>{event.actor.name}</span>
            </span>
          )}
        </div>

        {/* Channel & Metric Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {event.channel && (
            <Badge
              variant="outline"
              className="text-[9px] py-0 px-1.5 bg-stone-50 text-stone-500 border-stone-200"
            >
              {event.channel}
            </Badge>
          )}

          {event.payload?.duration && (
            <span className="text-[10px] font-mono text-stone-500 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-100">
              Duration: {event.payload.duration}
            </span>
          )}

          {event.payload?.outcome && (
            <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {event.payload.outcome}
            </span>
          )}

          {event.payload?.deliveryStatus === "read" && (
            <span className="flex items-center gap-1 text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-medium">
              <CheckCheck className="h-3 w-3 text-sky-600" />
              Read
            </span>
          )}

          {event.payload?.viewingSlot && (
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              Slot: {event.payload.viewingSlot}
            </span>
          )}

          {/* Transcript / Payload Inspector Toggle */}
          {hasPayloadDetails && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex items-center gap-1 text-[10px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-1.5 py-0.5 rounded border border-stone-200 transition-colors cursor-pointer"
            >
              <FileCode className="h-3 w-3 text-stone-500" />
              <span>{isExpanded ? "Hide Details" : "Inspect Payload"}</span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Payload & Transcript Inspector */}
      {isExpanded && hasPayloadDetails && (
        <div className="pt-2 border-t border-stone-100 space-y-2.5 animate-in fade-in duration-150">
          {/* Transcript Snippet */}
          {event.payload?.transcriptSnippet && (
            <div className="rounded-lg bg-stone-50/80 p-2.5 border border-stone-200 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-[#0d4a36]" />
                <span>Interaction Transcript Snippet</span>
              </div>
              <p className="text-xs font-mono text-stone-700 whitespace-pre-wrap leading-relaxed">
                {event.payload.transcriptSnippet}
              </p>
            </div>
          )}

          {/* Attachments */}
          {event.payload?.attachments && event.payload.attachments.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                Attached Documents &amp; Media
              </span>
              <div className="flex flex-wrap gap-2">
                {event.payload.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-stone-700 bg-stone-50 hover:bg-stone-100 px-2 py-1 rounded-md border border-stone-200 transition-colors"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-stone-400" />
                    <span className="truncate max-w-[200px]">{att.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
