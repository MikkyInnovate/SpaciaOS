"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  Bell,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  Clock,
  X,
  CheckCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  notificationsService,
  resolveNotificationTarget,
} from "@/features/notifications/services/notifications-service";
import type {
  AppNotification,
  NotificationFilter,
} from "@/features/notifications/types";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

export function NotificationMenu() {
  let router: any = null;
  try {
    router = useRouter();
  } catch {
    // Outside Next.js App Router context (e.g. static server markup/test harness)
  }
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [filter, setFilter] = React.useState<NotificationFilter>("all");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState<string>("");

  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Load notifications from service
  const loadNotifications = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await notificationsService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load notifications";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and periodic refresh
  React.useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Screen reader announcements
  const announce = React.useCallback((message: string) => {
    setAnnouncement(message);
    const timer = setTimeout(() => setAnnouncement(""), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Filtered list
  const displayedNotifications = React.useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  // Mark single notification as read
  const handleMarkAsRead = async (item: AppNotification, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (item.isRead) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    announce(`Marked alert "${item.title}" as read`);

    await notificationsService.markAsRead(item.id);
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    announce("All notifications marked as read");

    await notificationsService.markAllAsRead();
  };

  // Click on a notification row
  const handleNotificationClick = async (item: AppNotification) => {
    await handleMarkAsRead(item);
    const targetUrl = resolveNotificationTarget(item);
    if (targetUrl) {
      setIsOpen(false);
      if (router?.push) {
        router.push(targetUrl);
      } else if (typeof window !== "undefined") {
        window.location.href = targetUrl;
      }
    }
  };

  return (
    <>
      {/* Live Region for Screen-Reader Announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        {/* Accessible Bell Trigger */}
        <DialogPrimitive.Trigger asChild>
          <button
            ref={triggerRef}
            id="notification-bell-trigger"
            type="button"
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 transition-colors cursor-pointer",
              "hover:text-stone-900 hover:bg-stone-100",
              "focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-none focus-visible:ring-offset-2",
              isOpen && "bg-stone-100 text-stone-900"
            )}
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 ring-2 ring-white" />
              </span>
            )}
          </button>
        </DialogPrimitive.Trigger>

        {/* Modal Portal with Backdrop */}
        <DialogPrimitive.Portal>
          {/* Backdrop overlay */}
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-200",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            )}
          />

          {/* Responsive Dialog Content:
              - Mobile (<640px): Bottom-sheet drawer with slide-up animation.
              - Desktop (>=640px): Anchored floating modal from top-right. */}
          <DialogPrimitive.Content
            className={cn(
              "fixed z-50 flex flex-col bg-white border border-stone-200 shadow-2xl focus:outline-none",
              // Mobile layout (< 640px): bottom drawer
              "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-250",
              // Desktop layout (>= 640px): top-right floating command modal
              "sm:inset-auto sm:top-16 sm:right-6 sm:w-[420px] sm:max-w-md sm:rounded-xl sm:border",
              "sm:data-[state=closed]:slide-out-to-top-2 sm:data-[state=open]:slide-in-from-top-2 sm:data-[state=open]:zoom-in-98"
            )}
            aria-labelledby="notification-modal-title"
            aria-describedby="notification-modal-desc"
          >
            {/* Mobile Grab Bar */}
            <div className="sm:hidden mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-stone-300 shrink-0" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200/80 p-4 pb-3 bg-stone-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <DialogPrimitive.Title
                    id="notification-modal-title"
                    className="font-display font-bold text-sm text-stone-900"
                  >
                    Operational Alerts
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description
                    id="notification-modal-desc"
                    className="text-[11px] text-stone-500"
                  >
                    Real-time sales autonomy & dispatch telemetry
                  </DialogPrimitive.Description>
                </div>
              </div>

              {/* Close Button */}
              <DialogPrimitive.Close
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer",
                  "focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-none"
                )}
                aria-label="Close notifications modal"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {/* Filter Tabs & Quick Actions Bar */}
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2 bg-white shrink-0">
              {/* Filter Tabs */}
              <div role="tablist" aria-label="Notification filter" className="flex items-center gap-1">
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === "all"}
                  onClick={() => setFilter("all")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                    "focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-none",
                    filter === "all"
                      ? "bg-stone-100 text-stone-900 font-semibold"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                  )}
                >
                  <span>All</span>
                  <span className="rounded-full bg-stone-200 text-stone-700 text-[10px] px-1.5 py-0.2 font-mono">
                    {notifications.length}
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === "unread"}
                  onClick={() => setFilter("unread")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                    "focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-none",
                    filter === "unread"
                      ? "bg-rose-50 text-rose-800 font-semibold border border-rose-200/60"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                  )}
                >
                  <span>Unread</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-600 text-white text-[10px] px-1.5 py-0.2 font-mono font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Mark All Read Action */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className={cn(
                    "flex items-center gap-1 text-xs text-stone-600 hover:text-emerald-800 font-medium transition-colors cursor-pointer py-1 px-1.5 rounded",
                    "focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-none"
                  )}
                  aria-label="Mark all notifications as read"
                >
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Scrollable Notification List Body */}
            <div
              tabIndex={0}
              className={cn(
                "flex-1 overflow-y-auto min-h-[220px] max-h-[380px] sm:max-h-[360px] divide-y divide-stone-100",
                "focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-none focus-visible:ring-inset"
              )}
              aria-label="Notification list"
            >
              {/* 1. Loading State */}
              {isLoading && (
                <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading notifications">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="h-7 w-7 rounded-full bg-stone-200 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-stone-200 rounded w-3/4" />
                        <div className="h-3 bg-stone-100 rounded w-full" />
                        <div className="h-2.5 bg-stone-100 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Error State */}
              {!isLoading && errorMessage && (
                <div className="p-4">
                  <ErrorState
                    size="compact"
                    title="Unable to load notifications"
                    description={errorMessage}
                    onRetry={loadNotifications}
                    resetText="Retry Loading"
                  />
                </div>
              )}

              {/* 3. Empty State */}
              {!isLoading && !errorMessage && displayedNotifications.length === 0 && (
                <div className="p-6">
                  <EmptyState
                    preset="no-notifications"
                    size="compact"
                    title={filter === "unread" ? "No Unread Alerts" : "All Caught Up"}
                    description={
                      filter === "unread"
                        ? "You have resolved all high-priority operational items."
                        : "No operational alerts recorded in this workspace."
                    }
                    actionLabel="Refresh"
                    onActionClick={loadNotifications}
                  />
                </div>
              )}

              {/* 4. Populated Notification Rows */}
              {!isLoading && !errorMessage && displayedNotifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    "w-full text-left p-3.5 px-4 transition-colors cursor-pointer block",
                    "focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-none focus-visible:ring-inset",
                    item.isRead
                      ? "bg-white hover:bg-stone-50/70"
                      : "bg-emerald-50/20 hover:bg-emerald-50/40"
                  )}
                  aria-label={`${item.title}. ${item.message}. ${item.timeAgo || ""}. ${item.isRead ? "Read" : "Unread"}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon by Type */}
                    <div className="mt-0.5 shrink-0">
                      {item.type === "takeover" && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                      )}
                      {item.type === "viewing" && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                          <CalendarCheck className="h-4 w-4" />
                        </div>
                      )}
                      {item.type === "qualified" && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                      {item.type === "reminder" && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="h-4 w-4" />
                        </div>
                      )}
                      {item.type === "system" && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                          <Bell className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {!item.isRead && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0"
                              title="Unread"
                              aria-hidden="true"
                            />
                          )}
                          <h4
                            className={cn(
                              "text-xs truncate",
                              item.isRead
                                ? "font-medium text-stone-700"
                                : "font-bold text-stone-900"
                            )}
                          >
                            {item.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-stone-400 shrink-0">
                          {item.timeAgo}
                        </span>
                      </div>

                      <p className="mt-0.5 text-xs text-stone-500 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      {/* Footer Metadata & Action Hint */}
                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="text-emerald-700 font-medium flex items-center gap-1 group-hover:underline">
                          <span>View record</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </span>

                        {!item.isRead && (
                          <span
                            onClick={(e) => handleMarkAsRead(item, e)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleMarkAsRead(item);
                              }
                            }}
                            className={cn(
                              "text-stone-400 hover:text-stone-700 transition-colors p-0.5 rounded",
                              "focus-visible:ring-1 focus-visible:ring-emerald-700 focus-visible:outline-none"
                            )}
                            title="Mark as read"
                            aria-label={`Mark "${item.title}" as read`}
                          >
                            Mark read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-stone-200/80 p-2.5 px-4 bg-stone-50/70 flex items-center justify-between text-xs shrink-0">
              <button
                type="button"
                onClick={loadNotifications}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 transition-colors cursor-pointer py-1 px-1.5 rounded",
                  "focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-none"
                )}
                aria-label="Refresh notification list"
              >
                <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                <span>Refresh alerts</span>
              </button>

              <DialogPrimitive.Close
                className={cn(
                  "text-stone-600 hover:text-stone-900 font-semibold text-xs cursor-pointer py-1 px-2 rounded",
                  "focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-none"
                )}
              >
                Close
              </DialogPrimitive.Close>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}