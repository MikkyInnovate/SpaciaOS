"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { Conversation, ConversationChannel } from "../types";
import { ConversationListItem } from "./conversation-list-item";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare } from "lucide-react";

export interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  channelFilter: ConversationChannel | "ALL";
  onChannelFilterChange: (channel: ConversationChannel | "ALL") => void;
  className?: string;
}

const TABS = [
  { id: "ALL", label: "All" },
  { id: "active_ai", label: "AI Active" },
  { id: "qualified", label: "Qualified" },
  { id: "needs_action", label: "Takeover" },
];

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  channelFilter,
  onChannelFilterChange,
  className,
}: ConversationListProps) {
  // Filter logic
  const filteredConversations = React.useMemo(() => {
    return conversations.filter((conv) => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesProspect = conv.prospect.name.toLowerCase().includes(q);
        const matchesPhone = conv.prospect.phone.toLowerCase().includes(q);
        const matchesProperty = conv.targetProperty.title.toLowerCase().includes(q);
        const matchesMessage = conv.lastMessage.text.toLowerCase().includes(q);
        if (!matchesProspect && !matchesPhone && !matchesProperty && !matchesMessage) {
          return false;
        }
      }

      // 2. Status / Segment Tab
      if (statusFilter === "active_ai" && conv.status !== "active_ai") return false;
      if (statusFilter === "qualified" && conv.status !== "qualified" && conv.status !== "viewing_booked") return false;
      if (statusFilter === "needs_action" && conv.status !== "human_takeover" && conv.status !== "escalated") return false;

      // 3. Channel Filter
      if (channelFilter !== "ALL" && conv.channel !== channelFilter) return false;

      return true;
    });
  }, [conversations, search, statusFilter, channelFilter]);

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-stone-200 overflow-hidden", className)}>
      {/* Search & Channel Header */}
      <div className="p-3 border-b border-stone-200/90 space-y-2.5 bg-stone-50/40">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-stone-900 tracking-tight flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[#0d4a36]" />
            <span>Active Conversations</span>
          </h3>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-white border-stone-200">
            {filteredConversations.length}
          </Badge>
        </div>

        {/* Search Box */}
        <SearchInput
          placeholder="Search prospect, phone, property..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange("")}
          className="h-8 text-xs bg-white"
        />

        {/* Channels & Filters Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Segment Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onStatusFilterChange(tab.id)}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer select-none",
                    active
                      ? "bg-[#0d4a36] text-white shadow-2xs"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Channel Dropdown */}
          <Select
            value={channelFilter}
            onValueChange={(val) => onChannelFilterChange(val as ConversationChannel | "ALL")}
          >
            <SelectTrigger className="h-6 w-28 text-[10px] bg-white border-stone-200 px-2 shadow-none shrink-0 cursor-pointer">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="ALL">All Channels</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="web_chat">Web Chat</SelectItem>
              <SelectItem value="voice_transcript">Voice Calls</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversation Thread Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs font-medium text-stone-700">No matching conversations</p>
            <p className="text-[11px] text-stone-400">
              Try adjusting your search terms or filter segments.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSearchChange("");
                onStatusFilterChange("ALL");
                onChannelFilterChange("ALL");
              }}
              className="mt-2 h-7 text-[11px] text-stone-600 bg-white"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationListItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
