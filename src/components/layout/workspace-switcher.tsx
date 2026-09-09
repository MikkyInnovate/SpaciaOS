"use client";

import * as React from "react";
import { useWorkspace } from "@/lib/context/workspace-context";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "flex items-center gap-2 h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-2xs transition-colors",
          "hover:bg-stone-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-stone-400",
          isOpen && "bg-stone-100 border-stone-300"
        )}
      >
        <Building2 className="h-3.5 w-3.5 text-stone-400 shrink-0" aria-hidden="true" />
        <span className="truncate max-w-[140px] sm:max-w-[180px] font-semibold text-stone-800">
          {currentWorkspace.name}
        </span>
        <ChevronsUpDown className="h-3 w-3 text-stone-400 shrink-0 ml-0.5" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 sm:left-0 z-50 mt-1.5 w-64 rounded-lg border border-stone-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Workspaces & Branches
          </div>
          <div className="space-y-1">
            {workspaces.map((ws) => {
              const isSelected = ws.id === currentWorkspace.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                    isSelected
                      ? "bg-stone-100 font-semibold text-stone-900"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate text-xs">{ws.name}</span>
                    <span className="text-[10px] text-stone-400 font-normal truncate">
                      {ws.primaryMarket}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[#0d4a36] shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
