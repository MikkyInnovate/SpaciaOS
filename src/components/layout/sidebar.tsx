"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION_SECTIONS } from "@/lib/constants/navigation";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";
import { NavIcon } from "./nav-icon";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Sparkles } from "lucide-react";

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  onItemClick?: () => void;
}

export function Sidebar({ className, onItemClick, ...props }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card text-card-foreground",
        className
      )}
      {...props}
    >
      {/* Workspace & Brand Header */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-foreground truncate">
              {siteConfig.name}
            </span>
            <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
              OS
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
            <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{siteConfig.defaultWorkspace.name}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav
        aria-label="Main Navigation"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-4"
      >
        {NAVIGATION_SECTIONS.map((section, idx) => (
          <div key={section.label || idx} className="space-y-1">
            {section.label && (
              <h2 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </h2>
            )}
            <ul className="space-y-0.5" role="list">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.isAvailable ? item.href : "#"}
                      onClick={() => {
                        if (item.isAvailable && onItemClick) {
                          onItemClick();
                        }
                      }}
                      aria-current={isActive ? "page" : undefined}
                      aria-disabled={!item.isAvailable}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors select-none",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : item.isAvailable
                          ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                          : "cursor-not-allowed opacity-50 text-muted-foreground"
                      )}
                    >
                      <NavIcon
                        name={item.iconName}
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="flex-1 truncate">{item.title}</span>
                      {!item.isAvailable && item.badge && (
                        <span className="rounded bg-stone-100 border border-stone-200 px-1.5 py-0.5 text-[9px] font-medium text-stone-500 ml-auto">
                          {item.badge}
                        </span>
                      )}
                      {item.badge && item.isAvailable && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[10px] px-1.5 py-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / System Status & User Profile */}
      <div className="shrink-0 border-t border-border p-3 space-y-3">
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
              aria-hidden="true"
            />
            <span className="text-muted-foreground font-medium">AI Sales Core</span>
          </div>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            Online
          </span>
        </div>

        <div className="flex items-center gap-3 px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              SO
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-foreground truncate">
              {siteConfig.defaultWorkspace.role}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              {siteConfig.description}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
