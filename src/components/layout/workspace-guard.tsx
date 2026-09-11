"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/lib/context/workspace-context";
import { AppShell } from "./app-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { hasWorkspace, isLoading } = useWorkspace();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa]">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-[#0d4a36]" />
          <span>Verifying workspace authorization...</span>
        </div>
      </div>
    );
  }

  // If already on the explicit /unauthorized page, render it directly
  if (pathname === "/unauthorized") {
    return <>{children}</>;
  }

  // If authenticated but no active workspace/organization exists
  if (!hasWorkspace) {
    return <UnauthorizedState />;
  }

  return <AppShell>{children}</AppShell>;
}
