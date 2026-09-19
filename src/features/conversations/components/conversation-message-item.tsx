"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { ConversationMessage } from "../types";
import { ConversationArtifactCard } from "./conversation-artifact-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  ShieldCheck,
  CheckCheck,
  Zap,
} from "lucide-react";

export interface ConversationMessageItemProps {
  message: ConversationMessage;
  className?: string;
}

export function ConversationMessageItem({
  message,
  className,
}: ConversationMessageItemProps) {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // 1. System Events
  if (message.sender === "system") {
    return (
      <div className={cn("flex justify-center my-3 select-none", className)}>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200/80 text-[11px] text-stone-600 shadow-2xs">
          <ShieldCheck className="h-3.5 w-3.5 text-stone-500 shrink-0" />
          <span>{message.content}</span>
          <span className="text-stone-400 font-mono text-[10px] ml-1">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // 2. AI Autonomous Agent Messages
  if (message.sender === "ai_agent") {
    return (
      <div className={cn("flex gap-3 max-w-[85%] sm:max-w-[78%] group", className)}>
        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#0d4a36] border border-emerald-200 shrink-0 mt-0.5 shadow-2xs">
          <Bot className="h-4 w-4" />
        </div>

        {/* Message Bubble */}
        <div className="space-y-1.5 flex-1 min-w-0">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-stone-900">
              {message.senderName || "Spacia AI"}
            </span>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-[#0d4a36] border-emerald-200 text-[10px] py-0 h-4 px-1.5 font-medium"
            >
              AI Autonomous
            </Badge>
            {message.aiMetadata?.latencyMs && (
              <span className="flex items-center gap-0.5 text-[10px] text-stone-400 font-mono">
                <Zap className="h-2.5 w-2.5 text-emerald-600" />
                {message.aiMetadata.latencyMs}ms
              </span>
            )}
            <span className="text-[10px] text-stone-400 ml-auto font-mono">
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Content Card */}
          <div className="rounded-xl rounded-tl-xs border border-emerald-200/80 bg-emerald-50/40 p-3.5 text-stone-900 shadow-2xs text-xs leading-relaxed">
            <p className="whitespace-pre-wrap">{message.content}</p>

            {message.artifact && (
              <ConversationArtifactCard artifact={message.artifact} />
            )}
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name?: string, fallback = "P") => {
    if (!name?.trim()) return fallback;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  // 3. Human Broker Messages (Sent after takeover)
  if (message.sender === "human_broker") {
    const initials = getInitials(message.senderName, "B");

    return (
      <div className={cn("flex gap-3 max-w-[85%] sm:max-w-[78%] ml-auto flex-row-reverse group", className)}>
        {/* Avatar */}
        <Avatar className="h-8 w-8 border border-stone-300 mt-0.5 shrink-0">
          <AvatarFallback className="bg-stone-800 text-white font-semibold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Message Bubble */}
        <div className="space-y-1.5 flex-1 min-w-0 text-right">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs">
            <span className="text-[10px] text-stone-400 mr-auto font-mono">
              {formatTime(message.timestamp)}
            </span>
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-900 border-amber-200 text-[10px] py-0 h-4 px-1.5 font-medium"
            >
              Broker Direct
            </Badge>
            <span className="font-semibold text-stone-900">
              {message.senderName || "Sales Broker"}
            </span>
          </div>

          {/* Content Card */}
          <div className="rounded-xl rounded-tr-xs border border-stone-200 bg-white p-3.5 text-stone-900 text-left shadow-2xs text-xs leading-relaxed">
            <p className="whitespace-pre-wrap">{message.content}</p>

            {message.artifact && (
              <ConversationArtifactCard artifact={message.artifact} />
            )}

            <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-stone-400">
              <span>Delivered</span>
              <CheckCheck className="h-3 w-3 text-stone-500" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Prospect Messages
  const initials = getInitials(message.senderName, "P");

  return (
    <div className={cn("flex gap-3 max-w-[85%] sm:max-w-[78%] group", className)}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 border border-stone-200 mt-0.5 shrink-0">
        <AvatarFallback className="bg-stone-100 text-stone-700 font-semibold text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Message Bubble */}
      <div className="space-y-1.5 flex-1 min-w-0">
        {/* Header Metadata */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-stone-900 truncate">
            {message.senderName}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Content Card */}
        <div className="rounded-xl rounded-tl-xs border border-stone-200/90 bg-white p-3.5 text-stone-900 shadow-2xs text-xs leading-relaxed">
          <p className="whitespace-pre-wrap">{message.content}</p>

          {message.artifact && (
            <ConversationArtifactCard artifact={message.artifact} />
          )}
        </div>
      </div>
    </div>
  );
}
