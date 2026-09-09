"use client";

import * as React from "react";

import {
  Bell,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "takeover" | "viewing" | "qualified";
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_1",
    title: "Urgent Human Takeover Recommended",
    description: "Michael Adeleke (₦85M budget) requested a live agent to finalize Thursday viewing.",
    time: "4m ago",
    type: "takeover",
    read: false,
  },
  {
    id: "notif_2",
    title: "Viewing Confirmed via AI Voice",
    description: "Sarah Jenkins booked Waterfront Penthouse inspection with Marcus Vance for Friday.",
    time: "32m ago",
    type: "viewing",
    read: false,
  },
  {
    id: "notif_3",
    title: "Autonomous Lead Qualification",
    description: "Dr. Babatunde O. verified commercial fit for 4-Bed Detached Villa.",
    time: "1h ago",
    type: "qualified",
    read: true,
  },
];

export function NotificationMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 ring-2 ring-white" />
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-80 sm:w-96 rounded-xl border border-stone-200 bg-white shadow-xl animate-in fade-in-50 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-3.5 px-4 bg-stone-50/70">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-stone-900">
                Operational Alerts
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold px-2 py-0.2">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 px-4 transition-colors ${
                  item.read ? "bg-white" : "bg-stone-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {item.type === "takeover" && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                        <AlertCircle className="h-3.5 w-3.5" />
                      </div>
                    )}
                    {item.type === "viewing" && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                        <CalendarCheck className="h-3.5 w-3.5" />
                      </div>
                    )}
                    {item.type === "qualified" && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-semibold truncate ${item.read ? "text-stone-700" : "text-stone-900"}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-mono text-stone-400 shrink-0">
                        {item.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-2.5 px-4 bg-stone-50/50 flex items-center justify-between text-xs">
            <span className="text-[11px] text-stone-500">
              Autonomous sales event dispatch
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-stone-600 hover:text-stone-900 font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}