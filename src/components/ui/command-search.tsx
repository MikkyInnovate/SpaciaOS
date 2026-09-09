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
} from "lucide-react";
import { MOCK_DASHBOARD_LEADS } from "@/features/dashboard/data/mock-data";
import { NAVIGATION_SECTIONS } from "@/lib/constants/navigation";

export interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

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
    if (!nextOpen) setQuery("");
    onOpenChange(nextOpen);
  };

  // Filter leads based on query
  const filteredLeads = React.useMemo(() => {
    if (!query.trim()) return MOCK_DASHBOARD_LEADS.slice(0, 4);
    const q = query.toLowerCase();
    return MOCK_DASHBOARD_LEADS.filter(
      (lead) =>
        lead.name.toLowerCase().includes(q) ||
        lead.propertyTitle.toLowerCase().includes(q) ||
        lead.location.toLowerCase().includes(q) ||
        lead.status.toLowerCase().includes(q)
    );
  }, [query]);

  // Filter navigation links
  const filteredNavigation = React.useMemo(() => {
    const allItems = NAVIGATION_SECTIONS.flatMap((s) => s.items).filter(
      (item) => item.isAvailable !== false
    );
    if (!query.trim()) return allItems.slice(0, 4);
    const q = query.toLowerCase();
    return allItems.filter((item) => item.title.toLowerCase().includes(q));
  }, [query]);

  const handleSelectLead = () => {
    handleOpenChange(false);
    router.push("/dashboard");
  };

  const handleNavigate = (href: string) => {
    handleOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-xl sm:max-w-2xl border-stone-200 shadow-2xl">
        <DialogTitle className="sr-only">Command Search</DialogTitle>
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border px-4 bg-white">
          <Search className="h-4 w-4 shrink-0 text-stone-400 mr-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a prospect name, property, or jump to page..."
            className="h-12 w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs text-stone-400 hover:text-stone-700 px-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-4">
          {/* Prospects Section */}
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Prospects & Inquiries
            </div>
            {filteredLeads.length > 0 ? (
              <div className="space-y-1">
                {filteredLeads.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={handleSelectLead}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-stone-100/80 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-stone-600 group-hover:bg-white group-hover:text-stone-900 border border-stone-200/60">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-stone-900">
                            {lead.name}
                          </span>
                          <Badge
                            variant={lead.scoreCategory === "HOT" ? "hot" : "warm"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {lead.score} {lead.scoreCategory}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                          <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                          <span className="truncate">{lead.propertyTitle}</span>
                          <span>•</span>
                          <span className="font-semibold text-stone-700 tabular-nums">
                            {lead.budget}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-900 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-2 py-2 text-xs text-stone-500">
                No prospects found for &ldquo;{query}&rdquo;
              </p>
            )}
          </div>

          {/* Quick Actions & Navigation */}
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Navigation & Modules
            </div>
            <div className="space-y-1">
              {filteredNavigation.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNavigate(item.href)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-stone-100/80 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-stone-600 border border-stone-200/60">
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
              ))}
            </div>
          </div>
        </div>

        {/* Command Footer */}
        <div className="border-t border-border p-2.5 px-4 bg-stone-50/60 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 text-[#0d4a36]" />
            <span>Spacia Command Intelligence</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Navigate with ↑↓</span>
            <span>•</span>
            <span>ESC to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}