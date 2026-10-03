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

export type HeaderProps = React.HTMLAttributes<HTMLElement>;

/* Real "today" for the date chip: client-only, ticks over at midnight, no hydration mismatch */
function subscribeDay(cb: () => void) {
  const id = window.setInterval(cb, 60_000);
  return () => window.clearInterval(id);
}
const getDay = () => new Date().toDateString();
const getServerDay = () => null;

function TodayChip() {
  const day = React.useSyncExternalStore(subscribeDay, getDay, getServerDay);
  if (!day) return null;
  const label = new Date(day).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return (
    <div className="hidden h-8 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[12px] text-zinc-600 lg:flex">
      <Calendar className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Header({ className, ...props }: HeaderProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const currentTitle = React.useMemo(() => {
    if (pathname === "/ops") return "Operations";
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
        "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {/* Left: Sidebar trigger + breadcrumbs */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />

        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-[13px]">
          <span className="text-zinc-500">{siteConfig.name}</span>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
          <span className="font-medium text-zinc-950">{currentTitle}</span>
        </nav>
      </div>

      {/* Right: date, search, notifications (workspace switcher lives in the sidebar) */}
      <div className="flex items-center gap-2">
        <TodayChip />

        {/* Global Search Shortcut */}
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 cursor-pointer gap-2 rounded-[6px] border-zinc-200 bg-white px-2.5 text-[12px] font-normal text-zinc-500 shadow-none hover:border-[#15803d]/40 hover:bg-white hover:text-zinc-900 sm:flex"
          onClick={() => setSearchOpen(true)}
          aria-label="Search leads, calls, properties"
        >
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <span className="pr-6">Search leads, calls…</span>
          <kbd className="pointer-events-none rounded-[4px] border border-zinc-200 bg-zinc-50 px-1 font-mono text-[10px] text-zinc-500">
            ⌘K
          </kbd>
        </Button>

        {/* Mobile Search Trigger Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-8 w-8 text-stone-500 cursor-pointer"
          onClick={() => setSearchOpen(true)}
          aria-label="Search leads and modules"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Global Command Palette Dialog */}
        <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Operational Notifications Menu */}
        <NotificationMenu />
      </div>
    </header>
  );
}
