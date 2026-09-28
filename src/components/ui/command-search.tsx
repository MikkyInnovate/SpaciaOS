"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  MapPin,
  ArrowRight,
  ExternalLink,
  Bot,
  Loader2,
  Phone,
} from "lucide-react";
import { leadsService } from "@/features/leads/services/leads-service";
import type { Lead } from "@/features/leads";
import { MOCK_DASHBOARD_LEADS } from "@/features/dashboard/data/mock-data";
import { NAVIGATION_SECTIONS } from "@/lib/constants/navigation";
import { useWorkspace } from "@/lib/context/workspace-context";

export interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DisplayLead {
  id: string;
  name: string;
  score: number;
  scoreCategory: "HOT" | "WARM" | "COLD";
  propertyTitle: string;
  budget: string;
  location?: string;
  phone?: string;
  status: string;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const [query, setQuery] = React.useState("");
  const [liveLeads, setLiveLeads] = React.useState<Lead[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Keyboard shortcut (⌘K / Ctrl+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
    onOpenChange(nextOpen);
  };

  // Fetch live leads from backend whenever modal opens or query changes (debounced)
  React.useEffect(() => {
    if (!open) return;

    let isMounted = true;
    const fetchTimer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await leadsService.getLeads(
          query.trim() ? { search: query.trim() } : undefined
        );
        if (isMounted) {
          if (response && Array.isArray(response.leads)) {
            setLiveLeads(response.leads);
          } else {
            setLiveLeads([]);
          }
        }
      } catch (err) {
        console.warn("CommandSearch: error fetching live leads:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, query ? 200 : 0);

    return () => {
      isMounted = false;
      clearTimeout(fetchTimer);
    };
  }, [open, query, currentWorkspace?.id]);

  // Transform leads for display (real live leads preferred, graceful fallback)
  const displayLeads: DisplayLead[] = React.useMemo(() => {
    if (liveLeads.length > 0) {
      return liveLeads.slice(0, 6).map((lead) => ({
        id: lead.id,
        name: lead.name,
        score: lead.score ?? 0,
        scoreCategory: lead.scoreCategory || "COLD",
        propertyTitle:
          lead.propertyTitle ||
          lead.property?.title ||
          lead.location ||
          "Luxury Residential Inquiry",
        budget:
          lead.budget ||
          (lead.property ? lead.property.formattedPrice : undefined) ||
          "₦0",
        location: lead.location || lead.property?.location,
        phone: lead.phone,
        status: lead.status || "New",
      }));
    }

    // Graceful fallback to mock dashboard leads if live leads returned 0 and not actively searching
    if (!query.trim()) {
      return MOCK_DASHBOARD_LEADS.slice(0, 4).map((l) => ({
        id: l.id,
        name: l.name,
        score: l.score,
        scoreCategory: l.scoreCategory,
        propertyTitle: l.propertyTitle,
        budget: l.budget,
        location: l.location,
        status: l.status,
      }));
    }

    // If searched and liveLeads is empty, check mock leads as offline/test fallback
    const q = query.toLowerCase().trim();
    const fallbackMatches = MOCK_DASHBOARD_LEADS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.propertyTitle.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
    );

    return fallbackMatches.map((l) => ({
      id: l.id,
      name: l.name,
      score: l.score,
      scoreCategory: l.scoreCategory,
      propertyTitle: l.propertyTitle,
      budget: l.budget,
      location: l.location,
      status: l.status,
    }));
  }, [liveLeads, query]);

  // Filter navigation links
  const filteredNavigation = React.useMemo(() => {
    const allItems = NAVIGATION_SECTIONS.flatMap((s) => s.items).filter(
      (item) => item.isAvailable !== false
    );
    if (!query.trim()) return allItems.slice(0, 4);
    const q = query.toLowerCase().trim();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q)
    );
  }, [query]);

  // Reset selected index when query or results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query, displayLeads.length, filteredNavigation.length]);

  const totalItems = displayLeads.length + filteredNavigation.length;

  const handleSelectLead = (leadId: string) => {
    handleOpenChange(false);
    router.push(`/leads?selected=${encodeURIComponent(leadId)}`);
  };

  const handleNavigate = (href: string) => {
    handleOpenChange(false);
    router.push(href);
  };

  // Keyboard navigation within results list (ArrowDown, ArrowUp, Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (totalItems === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex < displayLeads.length) {
        handleSelectLead(displayLeads[selectedIndex].id);
      } else {
        const navIdx = selectedIndex - displayLeads.length;
        if (filteredNavigation[navIdx]) {
          handleNavigate(filteredNavigation[navIdx].href);
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName="bg-black/25 backdrop-blur-none"
        className="p-0 overflow-hidden max-w-xl sm:max-w-2xl border-stone-200 shadow-2xl"
      >
        <DialogTitle className="sr-only">Command Search</DialogTitle>

        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border px-4 bg-white">
          <Search className="h-4 w-4 shrink-0 text-stone-400 mr-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a prospect name, phone, property, or jump to page..."
            className="h-12 w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
            autoFocus
          />
          {isLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 text-[#0d4a36] animate-spin ml-2" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs text-stone-400 hover:text-stone-700 px-1 ml-2 cursor-pointer"
            >
              Clear
            </button>
          ) : null}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-4">
          {/* Prospects Section */}
          <div>
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Prospects & Inquiries
              </span>
              {liveLeads.length > 0 && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                  Live DB ({liveLeads.length})
                </span>
              )}
            </div>

            {displayLeads.length > 0 ? (
              <div className="space-y-1">
                {displayLeads.map((lead, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => handleSelectLead(lead.id)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left group cursor-pointer ${
                        isSelected
                          ? "bg-stone-100 ring-1 ring-stone-200/80 shadow-2xs"
                          : "hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-md border ${
                            isSelected
                              ? "bg-white text-stone-900 border-stone-300 shadow-2xs"
                              : "bg-stone-100 text-stone-600 border-stone-200/60 group-hover:bg-white group-hover:text-stone-900"
                          }`}
                        >
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-stone-900">
                              {lead.name}
                            </span>
                            <Badge
                              variant={
                                lead.scoreCategory === "HOT"
                                  ? "hot"
                                  : lead.scoreCategory === "WARM"
                                  ? "warm"
                                  : "cold"
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              {lead.score} {lead.scoreCategory}
                            </Badge>
                            {lead.status && (
                              <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded font-medium">
                                {lead.status}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                            <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {lead.propertyTitle}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-stone-700 tabular-nums">
                              {lead.budget}
                            </span>
                            {lead.phone && (
                              <>
                                <span>•</span>
                                <span className="text-stone-400 tabular-nums flex items-center gap-0.5">
                                  <Phone className="h-2.5 w-2.5 inline" />
                                  {lead.phone}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <ArrowRight
                        className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                          isSelected
                            ? "opacity-100 text-stone-900"
                            : "opacity-0 group-hover:opacity-100 text-stone-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-2 py-2 text-xs text-stone-500">
                {isLoading
                  ? "Searching active leads..."
                  : `No prospects found for "${query}"`}
              </p>
            )}
          </div>

          {/* Quick Actions & Navigation */}
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Navigation & Modules
            </div>
            <div className="space-y-1">
              {filteredNavigation.map((item, nIdx) => {
                const globalIdx = displayLeads.length + nIdx;
                const isSelected = selectedIndex === globalIdx;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleNavigate(item.href)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left group cursor-pointer ${
                      isSelected
                        ? "bg-stone-100 ring-1 ring-stone-200/80 shadow-2xs"
                        : "hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-md border ${
                          isSelected
                            ? "bg-white text-stone-900 border-stone-300"
                            : "bg-stone-100 text-stone-600 border-stone-200/60"
                        }`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-stone-900">
                          {item.title}
                        </span>
                        <p className="text-[11px] text-stone-500">
                          Jump to {item.href}
                        </p>
                      </div>
                    </div>
                    <kbd className="text-[10px] text-stone-400 font-mono bg-stone-100 border border-stone-200 px-1 rounded">
                      Jump
                    </kbd>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Command Footer */}
        <div className="border-t border-border p-2.5 px-4 bg-stone-50/60 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 text-[#0d4a36]" />
            <span className="font-medium text-stone-700">
              Spacia Command Intelligence
            </span>
            {currentWorkspace && (
              <span className="text-stone-400 hidden sm:inline">
                • {currentWorkspace.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>↑↓ to navigate</span>
            <span>•</span>
            <span>↵ to select</span>
            <span>•</span>
            <span>ESC to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}