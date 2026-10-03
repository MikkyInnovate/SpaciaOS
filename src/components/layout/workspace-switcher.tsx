"use client";

import * as React from "react";
import { useWorkspace } from "@/lib/context/workspace-context";
import { Building2, Check, ChevronsUpDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function WorkspaceSwitcher({ fullWidth = false }: { fullWidth?: boolean }) {
  const { currentWorkspace, workspaces, switchWorkspace, isLoading } = useWorkspace();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState<string | null>(null);
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

  const handleSelectWorkspace = async (workspaceId: string) => {
    if (workspaceId === currentWorkspace?.id) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(workspaceId);
    try {
      await switchWorkspace(workspaceId);
    } finally {
      setIsSwitching(null);
      setIsOpen(false);
    }
  };

  const displayName = currentWorkspace?.name || "No Active Workspace";

  return (
    <div ref={containerRef} className={cn("relative text-left", fullWidth ? "block w-full" : "inline-block")}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={isLoading || workspaces.length === 0}
        className={cn(
          "flex h-9 items-center gap-2 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-700 transition-colors",
          "hover:border-[#15803d]/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#15803d]/40 disabled:opacity-60",
          fullWidth && "w-full",
          isOpen && "border-[#15803d]/50"
        )}
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
        <span className={cn("truncate font-medium text-zinc-900", fullWidth ? "flex-1 text-left" : "max-w-[140px] sm:max-w-[180px]")}>
          {displayName}
        </span>
        {workspaces.length > 1 && (
          <ChevronsUpDown className="h-3 w-3 text-stone-400 shrink-0 ml-0.5" aria-hidden="true" />
        )}
      </button>

      {isOpen && workspaces.length > 0 && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-1.5 rounded-[6px] border border-zinc-200 bg-white p-1.5 shadow-[0_16px_40px_-16px_rgba(6,20,15,0.3)] animate-in fade-in zoom-in-95 duration-100",
            fullWidth ? "left-0 right-0" : "right-0 w-64 sm:left-0"
          )}
        >
          <div className="flex items-center justify-between px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
            <span>Workspaces</span>
            <span>{workspaces.length}</span>
          </div>

          <div className="space-y-1">
            {workspaces.map((ws) => {
              const isSelected = ws.id === currentWorkspace?.id;
              const isTargetSwitching = isSwitching === ws.id;

              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => handleSelectWorkspace(ws.id)}
                  disabled={Boolean(isSwitching)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                    isSelected
                      ? "bg-[#15803d]/[0.07] font-medium text-zinc-950"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
                    isTargetSwitching && "opacity-50"
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate text-xs">{ws.name}</span>
                    <span className="flex items-center gap-1 truncate text-[10px] font-normal text-zinc-400">
                      <ShieldCheck className="h-2.5 w-2.5 text-[#15803d]" />
                      {ws.role === "org:admin" ? "Admin" : "Member"}
                    </span>
                  </div>

                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#15803d]" aria-hidden="true" />
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
