"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { ConversationMessage } from "../types";
import { ConversationMessageItem } from "./conversation-message-item";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

export interface ConversationMessageTimelineProps {
  messages: ConversationMessage[];
  isLoading?: boolean;
  className?: string;
}

export function ConversationMessageTimeline({
  messages,
  isLoading = false,
  className,
}: ConversationMessageTimelineProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on messages change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (isLoading) {
    return (
      <div className={cn("p-6 space-y-6 flex-1 overflow-y-auto", className)}>
        <div className="flex gap-3 max-w-[70%]">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>

        <div className="flex gap-3 max-w-[70%]">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>

        <div className="flex gap-3 max-w-[70%]">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center flex-1", className)}>
        <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-2">
          <MessageSquare className="h-5 w-5" />
        </div>
        <p className="text-xs font-medium text-stone-700">No message history</p>
        <p className="text-[11px] text-stone-400 mt-0.5">This conversation has not recorded any messages yet.</p>
      </div>
    );
  }

  // Format date helper
  const formatDateHeader = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      if (isToday) return "Today";

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

      if (isYesterday) return "Yesterday";

      return date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Conversation Log";
    }
  };

  // Group messages by date
  const groupedMessages: Array<{ date: string; items: ConversationMessage[] }> = [];
  let currentDate = "";
  let currentGroup: ConversationMessage[] = [];

  messages.forEach((msg) => {
    const header = formatDateHeader(msg.timestamp);
    if (header !== currentDate) {
      if (currentGroup.length > 0) {
        groupedMessages.push({ date: currentDate, items: currentGroup });
      }
      currentDate = header;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  });

  if (currentGroup.length > 0) {
    groupedMessages.push({ date: currentDate, items: currentGroup });
  }

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth",
        className
      )}
    >
      {groupedMessages.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-4">
          {/* Date Separator */}
          <div className="flex items-center justify-center">
            <span className="rounded-full bg-stone-100/90 border border-stone-200/70 px-3 py-0.5 text-[10px] font-medium text-stone-500 uppercase tracking-wider select-none">
              {group.date}
            </span>
          </div>

          {/* Message Stream */}
          <div className="space-y-4">
            {group.items.map((message) => (
              <ConversationMessageItem key={message.id} message={message} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
