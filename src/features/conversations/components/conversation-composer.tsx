"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, ShieldAlert, Paperclip, Loader2 } from "lucide-react";
import type { ConversationStatus } from "../types";

export interface ConversationComposerProps {
  conversationStatus: ConversationStatus;
  onSendMessage: (text: string) => Promise<void>;
  onTakeover?: () => Promise<void>;
  isSending?: boolean;
  className?: string;
}

const CANNED_RESPONSES = [
  "Confirm physical viewing slot with site security clearance.",
  "Dispatched title deed audit and Lagos Governor's Consent copy.",
  "Here is the developer payment milestone schedule.",
];

export function ConversationComposer({
  conversationStatus,
  onSendMessage,
  onTakeover,
  isSending = false,
  className,
}: ConversationComposerProps) {
  const [text, setText] = React.useState("");

  const isAIManaged = conversationStatus === "active_ai";
  const isHumanManaged = conversationStatus === "human_takeover";

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    const content = text.trim();
    setText("");
    await onSendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("border-t border-stone-200 bg-white p-3 sm:p-4 space-y-3", className)}>
      {/* AI Takeover Guidance Banner */}
      {isAIManaged && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50/80 border border-amber-200/80 px-3 py-2 text-xs text-amber-950">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-[11px] leading-tight">
              <strong>AI is actively qualifying.</strong> Sending a message will automatically execute <strong>Broker Takeover</strong>.
            </span>
          </div>
          {onTakeover && (
            <Button
              size="sm"
              variant="outline"
              onClick={onTakeover}
              className="h-6 text-[10px] font-medium border-amber-300 text-amber-900 bg-amber-100/60 hover:bg-amber-100 shrink-0 cursor-pointer"
            >
              Take Over First
            </Button>
          )}
        </div>
      )}

      {/* Canned Real Estate Action Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        <span className="text-[10px] text-stone-400 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-stone-400" />
          Quick insert:
        </span>
        {CANNED_RESPONSES.map((snippet, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setText(snippet)}
            className="text-[10px] bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-full px-2.5 py-0.5 text-stone-600 whitespace-nowrap transition-colors cursor-pointer"
          >
            {snippet.slice(0, 32)}...
          </button>
        ))}
      </div>

      {/* Input Box & Actions */}
      <div className="relative rounded-lg border border-stone-200 bg-white focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400 transition-all">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isAIManaged
              ? "Type broker reply to intervene in conversation..."
              : "Type broker message to prospect (Enter to send, Shift+Enter for newline)..."
          }
          rows={2}
          className="resize-none border-0 focus-visible:ring-0 text-xs text-stone-900 placeholder:text-stone-400 p-2.5 shadow-none"
        />

        <div className="flex items-center justify-between p-2 pt-0">
          <div className="flex items-center gap-1 text-[11px] text-stone-400">
            {isHumanManaged ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Broker direct active
              </span>
            ) : (
              <span>Autonomous AI monitored</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled
              title="Attach media or brochure"
              className="h-7 w-7 p-0 text-stone-400"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={!text.trim() || isSending}
              onClick={handleSend}
              className="h-7 px-3 text-xs gap-1.5 bg-[#0d4a36] text-white hover:bg-[#0a3829] cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Sending</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <Send className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
