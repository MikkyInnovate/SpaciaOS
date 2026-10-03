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
import { WorkspaceSwitcher } from "./workspace-switcher";
import { SpaciaLogo, SpaciaMark } from "@/components/brand/spacia-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { NAVIGATION_SECTIONS } from "@/lib/constants/navigation";
import {
  Building2,
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
      <SidebarHeader className="gap-3 border-b border-zinc-100 bg-white px-3 pb-3 pt-4">
        <Link href="/dashboard" aria-label={`${siteConfig.name} home`} className="flex h-8 items-center px-1">
          <SpaciaLogo className="text-[18px] group-data-[collapsible=icon]:hidden" />
          <SpaciaMark className="hidden h-5 w-5 text-zinc-950 group-data-[collapsible=icon]:block" />
        </Link>
        {/* the one workspace control in the app */}
        <div className="group-data-[collapsible=icon]:hidden">
          <WorkspaceSwitcher fullWidth />
        </div>
      </SidebarHeader>

      {/* Sidebar Content: Navigation Sections */}
      <SidebarContent className="bg-white scrollbar-none">
        {NAVIGATION_SECTIONS.map((section, idx) => (
          <SidebarGroup key={section.label || idx}>
            {section.label && (
              <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isAvailable = item.isAvailable !== false;
                  const isActive =
                    isAvailable &&
                    Boolean(
                      pathname &&
                        (item.href === "/"
                          ? pathname === "/"
                          : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))
                    );

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
                        className={cn(
                          "relative h-8 rounded-[6px] text-[13px] transition-colors",
                          isActive
                            ? "bg-[#15803d]/[0.07] font-medium text-zinc-950 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-[#15803d] hover:bg-[#15803d]/[0.1]"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                        )}
                      >
                        <Link href={item.href} prefetch={false}>
                          <NavIcon
                            name={item.iconName}
                            className={cn("h-4 w-4", isActive ? "text-[#15803d]" : "text-zinc-400")}
                          />
                          <span className="truncate">{item.title}</span>
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
        <div className="rounded-[6px] border border-zinc-200 bg-[#f7f7f5] p-2.5 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#15803d]" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-950">AI agent · On</span>
          </div>
          <p className="mt-1 text-[11px] leading-tight text-zinc-500">Calling and qualifying new leads</p>
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
      <Dialog open={showSignOutModal} onOpenChange={setShowSignOutModal}>
        <DialogContent className="max-w-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-stone-900">
                Sign out of {siteConfig.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Are you sure you want to sign out of {currentWorkspace?.name || "your workspace"}?
              </DialogDescription>
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
              className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSigningOut}
              onClick={handleSignOutConfirm}
              className="flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
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
        </DialogContent>
      </Dialog>

      <SidebarRail />
    </Sidebar>
  );
}
