"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/config/site";
import { NAVIGATION_SECTIONS } from "@/lib/constants/navigation";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Search, Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CommandSearch } from "@/components/ui/command-search";
import { NotificationMenu } from "./notification-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

export type HeaderProps = React.HTMLAttributes<HTMLElement>;

export function Header({ className, ...props }: HeaderProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const currentTitle = React.useMemo(() => {
    for (const section of NAVIGATION_SECTIONS) {
      for (const item of section.items) {
        if (item.href === pathname) return item.title;
      }
    }
    if (pathname === "/") return "Overview";
    return "Dashboard";
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {/* Left: Sidebar trigger + breadcrumbs */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />

        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs">
          <span className="font-medium text-stone-500">
            {siteConfig.name}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          <span className="font-semibold text-stone-900">{currentTitle}</span>
        </nav>
      </div>

      {/* Right: Workspace Switcher, Operational Status, Search, Quick Info */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Active Multi-Tenant Workspace Selector */}
        <WorkspaceSwitcher />

        {/* Date Filter Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-md border border-border bg-stone-50 px-2.5 py-1 text-xs text-stone-600 font-medium">
          <Calendar className="h-3.5 w-3.5 text-stone-500" />
          <span>Today: Sep 9, 2026</span>
        </div>

        {/* Global Search Shortcut */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex h-8 gap-2 text-xs text-stone-500 px-2.5 border-border bg-stone-50/50 hover:bg-stone-100 cursor-pointer"
          onClick={() => setSearchOpen(true)}
          aria-label="Search leads, calls, properties"
        >
          <Search className="h-3.5 w-3.5 text-stone-400" />
          <span>Search command...</span>
          <kbd className="pointer-events-none rounded border border-stone-200 bg-white px-1 text-[10px] font-medium text-stone-500 shadow-2xs">
            ⌘K
          </kbd>
        </Button>

        {/* Global Command Palette Dialog */}
        <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Operational Notifications Menu */}
        <NotificationMenu />
      </div>
    </header>
  );
}
