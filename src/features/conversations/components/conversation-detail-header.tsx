"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { Conversation } from "../types";
import { ConversationStateBadge } from "./conversation-state-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Building2,
  UserCheck,
  ShieldAlert,
  PanelRight,
  MessageSquare,
  Globe,
  PhoneCall,
} from "lucide-react";
import { toast } from "sonner";

export interface ConversationDetailHeaderProps {
  conversation: Conversation;
  onTakeover: () => Promise<void>;
  isTakeoverActive: boolean;
  onToggleContextPanel: () => void;
  isContextPanelOpen: boolean;
  className?: string;
}

export function ConversationDetailHeader({
  conversation,
  onTakeover,
  isTakeoverActive,
  onToggleContextPanel,
  isContextPanelOpen,
  className,
}: ConversationDetailHeaderProps) {
  const isHumanManaged = conversation.status === "human_takeover";

  const getChannelBadge = () => {
    switch (conversation.channel) {
      case "whatsapp":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] gap-1 py-0 h-5">
            <MessageSquare className="h-2.5 w-2.5 text-emerald-600" />
            <span>WhatsApp</span>
          </Badge>
        );
      case "web_chat":
        return (
          <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 text-[10px] gap-1 py-0 h-5">
            <Globe className="h-2.5 w-2.5 text-sky-600" />
            <span>Web Chat</span>
          </Badge>
        );
      case "voice_transcript":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] gap-1 py-0 h-5">
            <PhoneCall className="h-2.5 w-2.5 text-amber-600" />
            <span>Voice Call</span>
          </Badge>
        );
    }
  };

  return (
    <div className={cn("flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-200 bg-white shadow-2xs", className)}>
      {/* Prospect & Channel Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-stone-900 truncate">
              {conversation.prospect.name}
            </h2>
            {getChannelBadge()}
            <ConversationStateBadge status={conversation.status} variant="badge" />
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
            <span className="font-mono text-[11px]">{conversation.prospect.phone}</span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center gap-1 text-stone-600 truncate">
              <Building2 className="h-3 w-3 text-stone-400 shrink-0" />
              <strong className="font-medium text-stone-800 truncate">{conversation.targetProperty.title}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Actions: Takeover, Call, Toggle Dossier */}
      <div className="flex items-center gap-2 shrink-0">
        {isHumanManaged ? (
          <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 text-xs px-2.5 py-1 gap-1.5 font-medium">
            <UserCheck className="h-3.5 w-3.5 text-amber-700" />
            <span>Broker Managed</span>
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={isTakeoverActive}
            onClick={onTakeover}
            className="h-8 text-xs gap-1.5 bg-amber-50/60 hover:bg-amber-100 text-amber-950 border-amber-300 shadow-2xs font-medium cursor-pointer"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
            <span>{isTakeoverActive ? "Taking Over..." : "Take Over"}</span>
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(conversation.prospect.phone);
            toast.success("Phone Number Copied", {
              description: conversation.prospect.phone,
            });
          }}
          className="h-8 w-8 p-0 text-stone-600 border-stone-200 hover:bg-stone-50 cursor-pointer"
          title="Copy Phone Number"
        >
          <Phone className="h-3.5 w-3.5 text-stone-500" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleContextPanel}
          className={cn(
            "h-8 px-2.5 text-xs gap-1.5 border border-stone-200 cursor-pointer transition-colors",
            isContextPanelOpen
              ? "bg-[#0d4a36] text-white hover:bg-[#0a3829] border-[#0d4a36]"
              : "text-stone-700 hover:bg-stone-50 bg-white"
          )}
          title="Toggle Prospect Dossier"
        >
          <PanelRight className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dossier</span>
        </Button>
      </div>
    </div>
  );
}
