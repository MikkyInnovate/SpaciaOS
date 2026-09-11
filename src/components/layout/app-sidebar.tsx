"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils/cn";
import { siteConfig } from "@/lib/config/site";
import { useWorkspace } from "@/lib/context/workspace-context";
import { useAuth } from "@/lib/context/auth-context";
import { NavIcon } from "./nav-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NAVIGATION_SECTIONS } from "@/lib/constants/navigation";
import {
  Building2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  Settings,
  Shield,
  LogOut,
} from "lucide-react";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const { user, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [showSignOutModal, setShowSignOutModal] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleSignOutConfirm = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    setShowSignOutModal(false);
    setIsUserMenuOpen(false);
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      {/* Sidebar Header: Brand & Workspace */}
      <SidebarHeader className="bg-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-1 py-1">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#0d4a36] text-white shadow-xs border border-[#093829]">
                <Sparkles className="h-4 w-4 text-emerald-200" aria-hidden="true" />
              </div>
              <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm text-stone-900 tracking-tight truncate">
                    {siteConfig.name}
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60">
                    OS
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-stone-500 truncate mt-0.5">
                  <Building2 className="h-3 w-3 shrink-0 text-stone-400" aria-hidden="true" />
                  <span className="truncate font-medium text-stone-600">
                    {currentWorkspace?.name || "Workspace"}
                  </span>
                </div>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Sidebar Content: Navigation Sections */}
      <SidebarContent className="bg-white">
        {NAVIGATION_SECTIONS.map((section, idx) => (
          <SidebarGroup key={section.label || idx}>
            {section.label && (
              <SidebarGroupLabel className="text-stone-400 font-medium text-[11px] tracking-wider uppercase">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isAvailable = item.isAvailable !== false;
                  const isActive =
                    isAvailable &&
                    (item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)));

                  if (!isAvailable) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <div
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-stone-400 select-none cursor-default"
                          title={`${item.title} (Coming Soon)`}
                        >
                          <NavIcon
                            name={item.iconName}
                            className="h-4 w-4 text-stone-300 shrink-0"
                          />
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-stone-500 border border-stone-200">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={
                          isActive
                            ? "bg-emerald-50/80 text-emerald-950 font-semibold border-l-2 border-[#0d4a36] rounded-l-none pl-2.5"
                            : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                        }
                      >
                        <Link href={item.href}>
                          <NavIcon
                            name={item.iconName}
                            className={isActive ? "text-[#0d4a36]" : "text-stone-400"}
                          />
                          <span className="truncate">{item.title}</span>
                          {isActive && (
                            <span
                              className="ml-auto h-1.5 w-1.5 rounded-full bg-[#0d4a36]"
                              aria-hidden="true"
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                      {item.badge && !isActive && (
                        <SidebarMenuBadge className="bg-stone-100 text-stone-600 border border-stone-200/80 text-[10px]">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Sidebar Footer: AI Engine Status & User Profile */}
      <SidebarFooter className="bg-white">
        {/* Live AI Engine Status Box (Calm & Restrained) */}
        <div className="rounded-md border border-stone-200 bg-stone-50/70 p-2.5 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span className="text-[11px] font-semibold text-stone-900">
                AI Sales Core
              </span>
            </div>
            <span className="rounded bg-stone-200/70 px-1.5 py-0.2 text-[10px] font-medium text-stone-700">
              Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-stone-500 leading-tight">
            Autonomous qualification running
          </p>
        </div>

        {/* User Account with Interactive Popover & Sign Out */}
        <div ref={userMenuRef} className="relative w-full">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
              "hover:bg-stone-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-stone-400",
              isUserMenuOpen ? "bg-stone-100" : "bg-transparent",
              "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1"
            )}
          >
            <Avatar className="h-8 w-8 shrink-0 border border-stone-200">
              {user?.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              )}
              <AvatarFallback className="bg-[#0d4a36]/10 text-[#0d4a36] font-semibold text-xs">
                {user?.name?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-semibold text-stone-900 truncate">
                {user?.name || "User"}
              </span>
              <span className="text-[11px] text-stone-500 truncate">
                {user?.email || ""}
              </span>
            </div>
            {isUserMenuOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-stone-500 shrink-0 group-data-[collapsible=icon]:hidden" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0 group-data-[collapsible=icon]:hidden" />
            )}
          </button>

          {/* User Profile Popover Dropdown */}
          {isUserMenuOpen && (
            <div
              role="menu"
              className={cn(
                "absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl transition-all",
                "animate-in fade-in zoom-in-95 duration-100",
                "group-data-[collapsible=icon]:left-12 group-data-[collapsible=icon]:bottom-0 group-data-[collapsible=icon]:mb-0"
              )}
            >
              {/* Profile Card Header */}
              <div className="flex items-center gap-2.5 rounded-lg bg-stone-50/80 p-2.5 border border-stone-100">
                <Avatar className="h-9 w-9 shrink-0 border border-stone-200">
                  {user?.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  )}
                  <AvatarFallback className="bg-[#0d4a36] text-white font-semibold text-xs">
                    {user?.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-stone-900 truncate">
                      {user?.name || "User"}
                    </span>
                    <span className="rounded bg-emerald-50 px-1 py-0.2 text-[9px] font-medium text-emerald-800 border border-emerald-200/60 uppercase">
                      {currentWorkspace?.role === "org:admin" ? "Admin" : "Member"}
                    </span>
                  </div>
                  {user?.email && (
                    <span className="text-[11px] text-stone-500 truncate">
                      {user.email}
                    </span>
                  )}
                  {currentWorkspace?.name && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-stone-400">
                      <Building2 className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{currentWorkspace.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Navigation Items */}
              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-stone-400" />
                  <span className="flex-1">Account & Profile</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-stone-400" />
                  <span className="flex-1">Workspace Settings</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5 text-stone-400" />
                  <span className="flex-1">Security & Permissions</span>
                </Link>
              </div>

              <div className="h-px bg-stone-100 my-1" />

              {/* Sign Out Trigger */}
              <button
                type="button"
                onClick={() => {
                  setShowSignOutModal(true);
                  setIsUserMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 hover:text-rose-800 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-600" />
                <span>Sign out of Spacia</span>
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-900">Sign out of {siteConfig.name}</h3>
                <p className="text-xs text-stone-500">
                  Are you sure you want to sign out of {currentWorkspace?.name || "your workspace"}?
                </p>
              </div>
            </div>

            <div className="rounded-md border border-stone-100 bg-stone-50 p-2.5 text-[11px] text-stone-600 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Account</span>
                <span className="font-medium text-stone-800">{user?.email || user?.name || "Active Account"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Workspace</span>
                <span className="font-medium text-stone-700">{currentWorkspace?.name || "Active Session"}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isSigningOut}
                onClick={() => setShowSignOutModal(false)}
                className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={handleSignOutConfirm}
                className="flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {isSigningOut ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-3 w-3" />
                    <span>Sign out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <SidebarRail />
    </Sidebar>
  );
}
