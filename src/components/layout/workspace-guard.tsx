"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/lib/context/workspace-context";
import { AppShell } from "./app-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { WorkspaceLoading } from "./workspace-loading";

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { hasWorkspace, isLoading } = useWorkspace();
  const pathname = usePathname();

  if (isLoading) {
    return <WorkspaceLoading />;
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
