"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { conversationsService } from "../services/conversations-service";
import { ConversationList } from "./conversation-list";
import { ConversationDetailHeader } from "./conversation-detail-header";
import { ConversationMessageTimeline } from "./conversation-message-timeline";
import { ConversationComposer } from "./conversation-composer";
import { ConversationContextPanel } from "./conversation-context-panel";
import type {
  Conversation,
  ConversationMessage,
  ConversationChannel,
} from "../types";
import { MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

/**
 * Complete 3-Pane Conversation Command Center.
 * Preserved for Post-Launch Phase 2 (WhatsApp Business API & Omnichannel Messaging).
 */
export function ConversationsCommandCenter() {
  // Master conversations state
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<ConversationMessage[]>([]);

  // Loading & Action states
  const [isLoadingList, setIsLoadingList] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isTakeoverActive, setIsTakeoverActive] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  // Filters
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [channelFilter, setChannelFilter] = React.useState<ConversationChannel | "ALL">("ALL");

  // Layout state
  const [isContextPanelOpen, setIsContextPanelOpen] = React.useState(true);
  const [isMobileListOpen, setIsMobileListOpen] = React.useState(true);

  // Refresh handler (triggered by button click)
  const handleRefresh = React.useCallback(async () => {
    setIsLoadingList(true);
    try {
      const response = await conversationsService.getConversations();
      setConversations(response.conversations);
      setSelectedConversation((prev) => prev ?? (response.conversations[0] || null));
    } catch {
      toast.error("Failed to load conversations");
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // Initial load effect (asynchronous, without synchronous setState in effect body)
  React.useEffect(() => {
    let isCancelled = false;

    const fetchInitialConversations = async () => {
      try {
        const response = await conversationsService.getConversations();
        if (!isCancelled) {
          setConversations(response.conversations);
          if (response.conversations.length > 0) {
            setSelectedConversation((prev) => prev ?? response.conversations[0]);
          }
          setIsLoadingList(false);
        }
      } catch {
        if (!isCancelled) {
          setIsLoadingList(false);
        }
      }
    };

    fetchInitialConversations();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Selected conversation ID for message loading
  const activeConversationId = selectedConversation?.id;

  // Load Messages when active conversation changes
  React.useEffect(() => {
    if (!activeConversationId) return;

    let isCurrent = true;

    conversationsService
      .getMessages(activeConversationId)
      .then((msgs) => {
        if (isCurrent) {
          setMessages(msgs);
          setIsLoadingMessages(false);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsLoadingMessages(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [activeConversationId]);

  // Select a conversation (user-driven)
  const handleSelectConversation = React.useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
    setIsLoadingMessages(true);
    setIsMobileListOpen(false); // On mobile, close list when selected
  }, []);

  // Broker Takeover handler
  const handleTakeover = React.useCallback(async () => {
    if (!selectedConversation) return;

    setIsTakeoverActive(true);
    try {
      const updatedConv = await conversationsService.executeTakeover(
        selectedConversation.id,
        "Marcus Vance"
      );
      setSelectedConversation(updatedConv);

      // Refresh messages to show system takeover message
      const updatedMsgs = await conversationsService.getMessages(selectedConversation.id);
      setMessages(updatedMsgs);

      // Refresh master list
      setConversations((prev) =>
        prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
      );

      toast.success("Broker Takeover Executed", {
        description: `You have taken over conversation with ${selectedConversation.prospect.name}. Autonomous AI replies are paused.`,
      });
    } catch {
      toast.error("Failed to execute broker takeover");
    } finally {
      setIsTakeoverActive(false);
    }
  }, [selectedConversation]);

  // Send Message handler
  const handleSendMessage = React.useCallback(
    async (text: string) => {
      if (!selectedConversation) return;

      setIsSending(true);
      try {
        const newMsg = await conversationsService.sendMessage(
          selectedConversation.id,
          text,
          "Marcus Vance"
        );

        setMessages((prev) => [...prev, newMsg]);

        // Update selected conversation status to human_takeover if not already
        const updated = await conversationsService.getConversationById(selectedConversation.id);
        if (updated) {
          setSelectedConversation(updated);
          setConversations((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        }

        toast.success("Message Dispatched", {
          description: `Direct message delivered to ${selectedConversation.prospect.name}.`,
        });
      } catch {
        toast.error("Failed to dispatch message");
      } finally {
        setIsSending(false);
      }
    },
    [selectedConversation]
  );

  return (
    <Container size="full" className="h-[calc(100vh-3.5rem)] flex flex-col p-0 overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-[#0d4a36] border border-emerald-200">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-stone-900 leading-tight">
                Conversation Command Center
              </h1>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Multi-channel buyer communication, AI autonomous qualification, and broker takeover.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 h-7 rounded-md border border-stone-200 bg-stone-50 px-2 text-[11px] font-medium text-stone-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>AI Stream: Active</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingList}
            className="h-7 text-xs gap-1.5 bg-white border-stone-200 hover:bg-stone-50 cursor-pointer"
          >
            <RefreshCw className={cn("h-3 w-3 text-stone-500", isLoadingList && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* 3-Pane Responsive Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Pane 1: Conversation List (Left) */}
        <div
          className={cn(
            "w-full md:w-[320px] lg:w-[360px] shrink-0 h-full z-10 md:static absolute inset-0 bg-white transition-transform duration-200",
            !isMobileListOpen && "hidden md:block"
          )}
        >
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id || null}
            onSelect={handleSelectConversation}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            channelFilter={channelFilter}
            onChannelFilterChange={setChannelFilter}
          />
        </div>

        {/* Pane 2: Conversation Detail & Timeline (Center) */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col h-full bg-[#fbfbf9] overflow-hidden min-w-0">
            {/* Mobile Back Button to list */}
            <div className="md:hidden flex items-center p-2 bg-stone-100 border-b border-stone-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileListOpen(true)}
                className="text-xs h-7 gap-1"
              >
                ← Back to Conversations
              </Button>
            </div>

            {/* Conversation Header */}
            <ConversationDetailHeader
              conversation={selectedConversation}
              onTakeover={handleTakeover}
              isTakeoverActive={isTakeoverActive}
              onToggleContextPanel={() => setIsContextPanelOpen((prev) => !prev)}
              isContextPanelOpen={isContextPanelOpen}
            />

            {/* Message Timeline */}
            <ConversationMessageTimeline
              messages={messages}
              isLoading={isLoadingMessages}
            />

            {/* Message Composer */}
            <ConversationComposer
              conversationStatus={selectedConversation.status}
              onSendMessage={handleSendMessage}
              onTakeover={handleTakeover}
              isSending={isSending}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#fbfbf9]">
            <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900">No conversation selected</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">
              Select an inbound prospect conversation from the left to review the AI qualification stream and engage.
            </p>
          </div>
        )}

        {/* Pane 3: Prospect Context & AI Confidence Dossier (Right) */}
        {selectedConversation && isContextPanelOpen && (
          <div className="w-[320px] lg:w-[350px] shrink-0 h-full hidden xl:block">
            <ConversationContextPanel conversation={selectedConversation} />
          </div>
        )}
      </div>
    </Container>
  );
}
