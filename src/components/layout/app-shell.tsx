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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-stone-50 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:text-sm font-medium transition-transform duration-200"
      >
        Skip to main content
      </a>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-[#fafaf9]">
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 pb-16 pt-6 outline-none">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
