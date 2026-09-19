"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { Conversation } from "../types";
import { ConversationStateBadge } from "./conversation-state-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BuyerIntentBadge, IntentConfidenceGauge } from "@/features/ai-agent";
import {
  MessageSquare,
  PhoneCall,
  Globe,
  Building2,
} from "lucide-react";

export interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationListItemProps) {
  const getInitials = (name?: string, fallback = "P") => {
    if (!name?.trim()) return fallback;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  const initials = getInitials(conversation.prospect?.name, "P");

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const date = new Date(isoString);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const getChannelIcon = () => {
    switch (conversation.channel) {
      case "whatsapp":
        return (
          <span title="WhatsApp Business">
            <MessageSquare className="h-3 w-3 text-emerald-600" />
          </span>
        );
      case "web_chat":
        return (
          <span title="Web Live Chat">
            <Globe className="h-3 w-3 text-sky-600" />
          </span>
        );
      case "voice_transcript":
        return (
          <span title="Voice Telephony Transcript">
            <PhoneCall className="h-3 w-3 text-amber-600" />
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelect(conversation)}
      className={cn(
        "group relative flex flex-col p-3.5 border-b border-stone-200/80 cursor-pointer transition-colors text-left",
        isSelected
          ? "bg-stone-50/90 border-l-3 border-l-[#0d4a36] shadow-2xs"
          : "hover:bg-stone-50/50 bg-white"
      )}
    >
      {/* Top Row: Prospect, Channel & Time */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-8 w-8 border border-stone-200 shrink-0">
            <AvatarFallback className="bg-stone-100 text-stone-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-stone-900 truncate">
                {conversation.prospect.name}
              </span>
              <span className="shrink-0">{getChannelIcon()}</span>
            </div>
            <p className="text-[11px] text-stone-500 font-mono truncate">
              {conversation.prospect.phone}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 gap-1">
          <span className="text-[10px] text-stone-400 font-mono">
            {formatRelativeTime(conversation.lastMessage.timestamp)}
          </span>
          {conversation.unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0d4a36] px-1 text-[9px] font-bold text-white shadow-2xs">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Target Property Chip */}
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1 text-stone-600 truncate min-w-0">
          <Building2 className="h-3 w-3 text-stone-400 shrink-0" />
          <span className="truncate font-medium">{conversation.targetProperty.title}</span>
        </div>
        <span className="font-mono text-[10px] font-semibold text-stone-900 tabular-nums shrink-0">
          {conversation.budget}
        </span>
      </div>

      {/* Message Preview */}
      <p className="mt-1.5 text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
        {conversation.lastMessage.sender === "ai_agent" && (
          <span className="font-semibold text-emerald-800">AI: </span>
        )}
        {conversation.lastMessage.sender === "human_broker" && (
          <span className="font-semibold text-amber-900">Broker: </span>
        )}
        {conversation.lastMessage.text}
      </p>

      {/* Bottom Metadata: Status, Intent & Confidence */}
      <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
        <ConversationStateBadge status={conversation.status} variant="badge" />

        <div className="flex items-center gap-2 shrink-0">
          <BuyerIntentBadge category={conversation.buyerIntent} className="text-[10px] px-1.5 py-0" />
          <IntentConfidenceGauge score={conversation.confidenceScore} size="sm" showBar={false} />
        </div>
      </div>
    </div>
  );
}
