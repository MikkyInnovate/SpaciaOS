"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Header } from "./header";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-[#fafaf9]">
        <Header />
        <div className="flex-1 pb-16 pt-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
