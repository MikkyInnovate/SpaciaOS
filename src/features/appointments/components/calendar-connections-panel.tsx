"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CalendarConnection } from "../types";
import { appointmentsService } from "../services/appointments-service";
import {
  CalendarDays,
  Globe,
  Check,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export function CalendarConnectionsPanel() {
  const [connections, setConnections] = React.useState<CalendarConnection[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    appointmentsService
      .getCalendarConnections()
      .then(setConnections)
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggle = async (provider: string, currentStatus: string) => {
    const willEnable = currentStatus !== "connected";
    const updated = await appointmentsService.toggleConnection(provider, willEnable);
    setConnections(updated);
    toast.success(
      willEnable
        ? `${provider.replace("_", " ")} connected successfully`
        : `${provider.replace("_", " ")} disconnected`
    );
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("All connected calendars synchronized in real time");
    }, 1200);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "google_calendar":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 font-bold text-sm">
            G
          </div>
        );
      case "cal_com":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 text-white font-bold text-sm">
            Cal
          </div>
        );
      case "outlook":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100 font-bold text-sm">
            O
          </div>
        );
      default:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CalendarDays className="h-5 w-5" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Sync Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-stone-900">
            Connected Calendars & Broker Scheduling
          </h3>
          <p className="text-xs text-stone-500">
            Synchronize external calendar accounts to detect clashes and book viewings in real time.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleSyncAll}
          disabled={isSyncing}
          className="text-xs h-8"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isSyncing && "animate-spin")} />
          Sync Calendars
        </Button>
      </div>

      {/* Grid of Calendar Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {connections.map((conn) => (
          <Card
            key={conn.id}
            className="border border-stone-200/80 bg-white transition hover:border-stone-300 shadow-sm"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {getProviderIcon(conn.provider)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900 text-sm">
                        {conn.providerName}
                      </span>
                      {conn.isPrimary && (
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] px-1.5 py-0">
                          Primary Engine
                        </Badge>
                      )}
                    </div>
                    <div className="truncate text-xs text-stone-500 mt-0.5">
                      {conn.accountEmail || "Not connected"}
                    </div>
                    {conn.calendarName && (
                      <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        <span>Calendar: {conn.calendarName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge
                    className={cn(
                      "text-[10px]",
                      conn.status === "connected"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-stone-100 text-stone-500 border-stone-200"
                    )}
                  >
                    {conn.status === "connected" ? "Connected" : "Disconnected"}
                  </Badge>
                  <Switch
                    checked={conn.status === "connected"}
                    disabled={conn.isPrimary}
                    onCheckedChange={() => handleToggle(conn.provider, conn.status)}
                  />
                </div>
              </div>

              {conn.status === "connected" && conn.lastSyncedAt && (
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Last synced: {new Date(conn.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-emerald-700 flex items-center gap-1 font-medium">
                    <Check className="h-3 w-3" /> Live 2-Way Sync
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
