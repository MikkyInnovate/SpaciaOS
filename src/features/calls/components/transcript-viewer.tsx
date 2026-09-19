"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { CallTranscriptTurn } from "../types";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  User,
  Copy,
  Check,
  Smile,
  Meh,
  Frown,
  Play,
  BookmarkCheck,
} from "lucide-react";
import { toast } from "sonner";

export interface TranscriptViewerProps {
  transcript: CallTranscriptTurn[];
  activeTimestampSeconds?: number;
  onSeekToTimestamp?: (seconds: number) => void;
  className?: string;
}

const BANT_BADGE_META: Record<
  string,
  { label: string; className: string }
> = {
  budget: {
    label: "Budget",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  authority: {
    label: "Authority",
    className: "bg-purple-50 text-purple-800 border-purple-200",
  },
  need: {
    label: "Need",
    className: "bg-blue-50 text-blue-800 border-blue-200",
  },
  timeline: {
    label: "Timeline",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  property_fit: {
    label: "Property Fit",
    className: "bg-teal-50 text-teal-800 border-teal-200",
  },
};

export function TranscriptViewer({
  transcript,
  activeTimestampSeconds = 0,
  onSeekToTimestamp,
  className,
}: TranscriptViewerProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [hasCopied, setHasCopied] = React.useState(false);

  // Filter dialogue turns by search query
  const filteredTranscript = React.useMemo(() => {
    if (!searchTerm.trim()) return transcript;
    const q = searchTerm.toLowerCase();
    return transcript.filter(
      (turn) =>
        turn.message.toLowerCase().includes(q) ||
        turn.speakerName.toLowerCase().includes(q) ||
        turn.bantTags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [transcript, searchTerm]);

  const handleCopyTranscript = () => {
    const fullText = transcript
      .map((t) => `[${t.timestamp}] ${t.speakerName}: ${t.message}`)
      .join("\n\n");

    navigator.clipboard.writeText(fullText);
    setHasCopied(true);
    toast.success("Transcript Copied", {
      description: "Full call dialogue copied to clipboard.",
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Search and Action Toolbar */}
      <div className="p-3 border-b border-stone-100 bg-stone-50/60 flex items-center justify-between gap-2.5">
        <div className="flex-1 max-w-sm">
          <SearchInput
            placeholder="Search dialogue or BANT tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">
            {filteredTranscript.length} / {transcript.length} turns
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTranscript}
            className="h-8 text-xs gap-1.5 bg-white text-stone-700 hover:text-stone-900 shadow-2xs"
          >
            {hasCopied ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-stone-500" />
                <span>Copy Transcript</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Transcript Turns Stream */}
      <div className="p-3.5 space-y-3 max-h-[500px] overflow-y-auto">
        {filteredTranscript.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            No dialogue matching &ldquo;{searchTerm}&rdquo;.
          </div>
        ) : (
          filteredTranscript.map((turn) => {
            const isAgent = turn.speaker === "agent";
            const isActive =
              Math.abs(activeTimestampSeconds - turn.timestampSeconds) < 4;

            return (
              <div
                key={turn.id}
                onClick={() => onSeekToTimestamp?.(turn.timestampSeconds)}
                className={cn(
                  "group relative rounded-xl p-3 text-xs transition-all border cursor-pointer select-text",
                  isAgent
                    ? "bg-stone-50/80 border-stone-200/80 text-stone-700 ml-0 mr-6"
                    : "bg-white border-stone-200 text-stone-900 ml-6 mr-0 shadow-2xs",
                  isActive && "ring-2 ring-emerald-600/60 border-emerald-300",
                  turn.keyQuote && !isAgent && "border-l-3 border-l-emerald-600"
                )}
              >
                {/* Speaker Header */}
                <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-stone-100/70 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isAgent ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#0d4a36] text-white">
                        <Sparkles className="h-3 w-3 text-emerald-300" />
                      </div>
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                        <User className="h-3 w-3" />
                      </div>
                    )}

                    <span className="font-semibold text-[11px] text-stone-900">
                      {turn.speakerName}
                    </span>

                    {turn.keyQuote && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                        <BookmarkCheck className="h-2.5 w-2.5" />
                        Key Signal
                      </span>
                    )}
                  </div>

                  {/* Timestamp with Click-to-Seek action */}
                  <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400 group-hover:text-emerald-700 transition-colors">
                    <Play className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity fill-emerald-700 text-emerald-700" />
                    <span>{turn.timestamp}</span>
                  </div>
                </div>

                {/* Message Body */}
                <p className="leading-relaxed text-stone-800 text-xs">
                  &ldquo;{turn.message}&rdquo;
                </p>

                {/* Turn Metadata Tags: Sentiment & BANT tags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-stone-100/60">
                  {turn.sentiment && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium",
                        turn.sentiment === "positive"
                          ? "text-emerald-700 bg-emerald-50"
                          : turn.sentiment === "hesitant"
                            ? "text-amber-700 bg-amber-50"
                            : "text-stone-600 bg-stone-100"
                      )}
                      title={`Sentiment: ${turn.sentiment}`}
                    >
                      {turn.sentiment === "positive" ? (
                        <Smile className="h-2.5 w-2.5" />
                      ) : turn.sentiment === "hesitant" ? (
                        <Frown className="h-2.5 w-2.5" />
                      ) : (
                        <Meh className="h-2.5 w-2.5" />
                      )}
                      <span className="capitalize">{turn.sentiment}</span>
                    </span>
                  )}

                  {turn.bantTags &&
                    turn.bantTags.map((tag) => {
                      const meta = BANT_BADGE_META[tag] || {
                        label: tag,
                        className: "bg-stone-100 text-stone-700 border-stone-200",
                      };
                      return (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={cn("text-[9px] px-1.5 py-0 uppercase font-semibold", meta.className)}
                        >
                          {meta.label}
                        </Badge>
                      );
                    })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
