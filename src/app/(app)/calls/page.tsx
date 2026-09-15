"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  MOCK_AI_OPERATIONS,
  MOCK_DASHBOARD_LEADS,
} from "@/features/dashboard/data/mock-data";
import { LeadDossierPanel } from "@/features/dashboard/components/lead-dossier-panel";
import type { DashboardAICallEvent, DashboardLead } from "@/features/dashboard/types";
import { useWorkspace } from "@/lib/context/workspace-context";
import { cn } from "@/lib/utils/cn";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  Call02Icon,
  CalendarCheck01Icon,
  AiVoice01Icon,
} from "@hugeicons/core-free-icons";
import {
  Play,
  Pause,
  Clock,
  Search,
  X,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

export default function CallsPage() {
  const { currentWorkspace } = useWorkspace();
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const [selectedCall, setSelectedCall] = React.useState<DashboardAICallEvent | null>(
    MOCK_AI_OPERATIONS[0]
  );
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Filter calls by search and outcome
  const filteredCalls = React.useMemo(() => {
    return MOCK_AI_OPERATIONS.filter((call) => {
      const matchesSearch =
        !searchTerm.trim() ||
        call.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.summary.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || call.outcome === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  // Derive full lead dossier object for selected call
  const activeLead: DashboardLead | null = React.useMemo(() => {
    if (!selectedCall) return null;

    const matchedLead = MOCK_DASHBOARD_LEADS.find(
      (l) => l.name.toLowerCase() === selectedCall.leadName.toLowerCase()
    );

    if (matchedLead) {
      return matchedLead;
    }

    return {
      id: selectedCall.id,
      name: selectedCall.leadName,
      phone: selectedCall.phone || "+234 800 000 0000",
      email: selectedCall.email || "client@direct.ng",
      propertyTitle: selectedCall.propertyTitle,
      location: selectedCall.location || "Lagos",
      budget: selectedCall.budget || "₦85,000,000",
      score: selectedCall.score || 85,
      scoreCategory: selectedCall.scoreCategory || "HOT",
      status: (selectedCall.outcome === "Viewing Requested"
        ? "Viewing Booked"
        : selectedCall.outcome) as DashboardLead["status"],
      intent: "Purchase",
      timeline: "< 30 days",
      nextAction: "AI Voice Qualification Triggered",
      createdAt: selectedCall.timestamp,
      aiNotes: selectedCall.summary,
    };
  }, [selectedCall]);

  const handleSelectCall = (call: DashboardAICallEvent) => {
    setSelectedCall(call);
    // On small mobile viewports, also pop the drawer for direct transcriber access
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileDrawerOpen(true);
    }
  };

  const handleTogglePlay = (e: React.MouseEvent, callId: string) => {
    e.stopPropagation();
    setPlayingId((prev) => (prev === callId ? null : callId));
  };

  return (
    <Container size="lg" className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Calls"
        description={`Autonomous voice interactions, audio recordings, and qualification logs for ${currentWorkspace?.name || "your workspace"}.`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-2xs whitespace-nowrap">
              <HugeiconsIcon icon={AiVoice01Icon} size={14} className="text-stone-700 shrink-0" strokeWidth={1.8} />
              <span>Autonomous Voice Engine: Active</span>
            </div>
          </div>
        }
      />

      {/* Voice Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 border-border bg-white shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
            <HugeiconsIcon icon={Clock01Icon} size={15} className="text-stone-500 shrink-0" strokeWidth={1.8} />
            <span>Avg. Call Duration</span>
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums">2</span>
            <span className="text-xs font-medium text-stone-500 font-sans ml-0.5 mr-1.5">m</span>
            <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums">45</span>
            <span className="text-xs font-medium text-stone-500 font-sans ml-0.5">s</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">88% qualification rate</p>
        </Card>

        <Card className="p-3.5 border-border bg-white shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
            <HugeiconsIcon icon={Call02Icon} size={15} className="text-stone-500 shrink-0" strokeWidth={1.8} />
            <span>Calls Placed Today</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums">42</span>
            <span className="text-xs font-medium text-stone-500 font-sans">Outbound</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Sub-5s response to inquiries</p>
        </Card>

        <Card className="p-3.5 border-border bg-white shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
            <HugeiconsIcon icon={CalendarCheck01Icon} size={15} className="text-stone-500 shrink-0" strokeWidth={1.8} />
            <span>Viewings Booked via Voice</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums">11</span>
            <span className="text-xs font-medium text-stone-500 font-sans">Confirmed</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Auto-synced to Google Calendar</p>
        </Card>
      </div>

      {/* Inspection Header Banner when inspecting a call */}
      {selectedCall && (
        <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs text-stone-700 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2 truncate">
            <span className="h-2 w-2 rounded-full bg-stone-800 shrink-0" />
            <span className="font-medium text-stone-600">Inspecting Audio Call:</span>
            <strong className="font-semibold text-stone-900 truncate">
              {selectedCall.leadName}
            </strong>
            <span className="text-stone-400 hidden sm:inline">•</span>
            <span className="text-stone-500 hidden sm:inline">
              Interactive Transcriber & Qualification Dossier
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCall(null)}
            className="h-6 text-xs text-stone-600 hover:text-stone-900 gap-1 px-2"
          >
            <X className="h-3.5 w-3.5" />
            <span>Close Dossier</span>
          </Button>
        </div>
      )}

      {/* Main Content Area: Split View or Full Width */}
      <div className={cn("grid gap-4 items-start", selectedCall ? "lg:grid-cols-12" : "grid-cols-1")}>
        {/* Left Side: Recent Voice Calls Table */}
        <div className={cn(selectedCall ? "lg:col-span-7" : "w-full", "space-y-3")}>
          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 rounded-lg border border-stone-200 bg-white p-2.5 shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <Input
                placeholder="Search calls by prospect, property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-stone-50 border-stone-200"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="w-36">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs bg-stone-50 border-stone-200">
                    <SelectValue placeholder="Outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Outcomes</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Viewing Requested">Viewing Booked</SelectItem>
                    <SelectItem value="In Conversation">In Conversation</SelectItem>
                    <SelectItem value="Contacting">Contacting</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(searchTerm || statusFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                  }}
                  className="h-8 text-xs text-stone-500 hover:text-stone-900 px-2"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Voice Calls Table Card */}
          <Card className="overflow-hidden border-border bg-white shadow-2xs">
            <CardHeader className="p-3.5 border-b border-stone-100 bg-stone-50/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-stone-900">
                    Recent AI Voice Interactions
                  </CardTitle>
                  <CardDescription className="text-xs text-stone-500 mt-0.5">
                    Click any call to open its full conversation transcript and qualification dossier.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-stone-600 bg-white text-[11px]">
                  {filteredCalls.length} interactions
                </Badge>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50/70 hover:bg-stone-50/70 border-b border-stone-200">
                    <TableHead className="text-xs font-semibold text-stone-700 py-2.5">
                      Prospect & Property
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700 py-2.5">
                      Lead Score
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700 py-2.5">
                      Outcome
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700 py-2.5">
                      Duration
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700 py-2.5">
                      Structured Summary
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-700 py-2.5 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredCalls.map((call) => {
                    const isSelected = selectedCall?.id === call.id;
                    const isPlaying = playingId === call.id;

                    return (
                      <TableRow
                        key={call.id}
                        onClick={() => handleSelectCall(call)}
                        className={cn(
                          "cursor-pointer transition-colors text-xs border-b border-stone-100",
                          isSelected
                            ? "bg-stone-100/70 hover:bg-stone-100/90 font-medium border-l-3 border-l-stone-900"
                            : "hover:bg-stone-50/80"
                        )}
                      >
                        {/* Prospect & Property */}
                        <TableCell className="py-2.5">
                          <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                            <span>{call.leadName}</span>
                            {call.isEscalated && (
                              <span
                                title="Recommended human takeover"
                                className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500"
                              />
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 truncate max-w-[200px]">
                            {call.propertyTitle}
                          </div>
                        </TableCell>

                        {/* Explainable Lead Score */}
                        <TableCell className="py-2.5 whitespace-nowrap">
                          {call.score && (
                            <ScoreIndicator score={call.score} category={call.scoreCategory} variant="badge" />
                          )}
                        </TableCell>

                        {/* Outcome Badge */}
                        <TableCell className="py-2.5 whitespace-nowrap">
                          <StatusBadge status={call.outcome} withDot />
                        </TableCell>

                        {/* Duration */}
                        <TableCell className="py-2.5 text-stone-600 font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-stone-400" />
                            <span>{call.duration}</span>
                          </div>
                        </TableCell>

                        {/* Structured Summary (Clean single-line teaser) */}
                        <TableCell className="py-2.5 max-w-[200px] lg:max-w-[280px]">
                          <p
                            className="truncate text-xs text-stone-500 font-normal"
                            title={call.summary}
                          >
                            {call.summary}
                          </p>
                        </TableCell>

                        {/* Action Buttons */}
                        <TableCell className="py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Audio Playback Toggle */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleTogglePlay(e, call.id)}
                              className={cn(
                                "h-7 gap-1 text-xs transition-colors",
                                isPlaying
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : "text-stone-700 hover:text-stone-900 bg-white"
                              )}
                            >
                              {isPlaying ? (
                                <>
                                  <Pause className="h-3 w-3 fill-emerald-700" />
                                  <span>Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3 fill-stone-700" />
                                  <span>Play</span>
                                </>
                              )}
                            </Button>

                            {/* View Transcript Action */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-7 text-xs gap-1 px-2",
                                isSelected ? "text-stone-900 font-semibold" : "text-stone-500 hover:text-stone-900"
                              )}
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span className="hidden sm:inline">Transcript</span>
                              <ChevronRight className="h-3 w-3 ml-0.5 opacity-60" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Right Side: Transcriber Continuation (LeadDossierPanel) */}
        {selectedCall && activeLead && (
          <div className="hidden lg:block lg:col-span-5 h-full">
            <div className="sticky top-4">
              <LeadDossierPanel
                lead={activeLead}
                callEvent={selectedCall}
                onClose={() => setSelectedCall(null)}
                onTakeover={(lead) => {
                  alert(`Human takeover initiated for ${lead.name}. AI communication paused.`);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Slide-over Drawer for smaller screens */}
      {selectedCall && activeLead && (
        <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="p-3 border-b border-stone-100 flex items-center justify-between">
              <DrawerTitle className="text-sm font-semibold text-stone-900">
                Call Transcriber: {selectedCall.leadName}
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-stone-400">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <div className="p-3 overflow-y-auto">
              <LeadDossierPanel
                lead={activeLead}
                callEvent={selectedCall}
                onClose={() => setIsMobileDrawerOpen(false)}
                onTakeover={(lead) => {
                  alert(`Human takeover initiated for ${lead.name}.`);
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </Container>
  );
}
