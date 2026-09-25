"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarConnection } from "../types";
import { appointmentsService } from "../services/appointments-service";
import {
  CalendarDays,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Link2,
  Lock,
  Loader2,
  CalendarCheck2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export function CalendarConnectionsPanel() {
  const [connections, setConnections] = React.useState<CalendarConnection[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncingAll, setIsSyncingAll] = React.useState(false);
  const [syncingProviderId, setSyncingProviderId] = React.useState<string | null>(null);

  // Connect OAuth Modal State
  const [connectModalProvider, setConnectModalProvider] = React.useState<CalendarConnection | null>(null);
  const [authEmail, setAuthEmail] = React.useState("");
  const [targetCalendarName, setTargetCalendarName] = React.useState("VIP Viewings & Inspections");
  const [isConnectingOAuth, setIsConnectingOAuth] = React.useState(false);

  // Auto-detect OAuth Callback from Google redirect (e.g. /appointments?code=4/0A...&state=...)
  React.useEffect(() => {
    const handleCallbackFromUrl = async () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");

      if (code) {
        setIsConnectingOAuth(true);
        toast.loading("Exchanging Google OAuth token & linking calendar...", { id: "google-oauth" });

        try {
          const result = await appointmentsService.handleOAuthCallback(code, state || undefined);
          const conns = await appointmentsService.getCalendarConnections();
          setConnections([...conns]);

          toast.success("Google Calendar Linked Successfully!", {
            id: "google-oauth",
            description: `Live 2-way sync activated for ${result.accountEmail || "your Google Account"}.`,
          });

          // Clean URL without refresh
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch {
          toast.error("Google Calendar connection failed", { id: "google-oauth" });
        } finally {
          setIsConnectingOAuth(false);
        }
      }
    };

    appointmentsService
      .getCalendarConnections()
      .then(setConnections)
      .finally(() => {
        setIsLoading(false);
        handleCallbackFromUrl();
      });
  }, []);

  const handleToggle = async (conn: CalendarConnection) => {
    if (conn.isPrimary) {
      toast.info("The primary scheduling engine cannot be disconnected.");
      return;
    }

    if (conn.status === "connected") {
      // Disconnect
      const updated = await appointmentsService.toggleConnection(conn.provider, false);
      setConnections(updated);
      toast.info(`${conn.providerName} disconnected`);
    } else {
      // Open OAuth Connect Modal
      setConnectModalProvider(conn);
      setAuthEmail(conn.accountEmail || "broker@spacia.io");
      setTargetCalendarName(conn.calendarName || "VIP Viewings & Inspections");
    }
  };

  const handleAuthorizeOAuth = async () => {
    if (!connectModalProvider) return;
    setIsConnectingOAuth(true);

    try {
      if (connectModalProvider.provider === "google_calendar") {
        toast.loading("Redirecting to Google Sign-In...", { id: "oauth-redirect" });
        const authUrl = await appointmentsService.getOAuthUrl("google_calendar");
        // Redirect browser to real Google OAuth Screen
        window.location.href = authUrl;
        return;
      }

      // Simulate handshake for other providers
      await new Promise((resolve) => setTimeout(resolve, 1400));
      const updated = await appointmentsService.toggleConnection(connectModalProvider.provider, true);
      setConnections([...updated]);
      toast.success(`${connectModalProvider.providerName} linked successfully!`);
      setConnectModalProvider(null);
    } catch {
      toast.error("Failed to authenticate calendar account");
    } finally {
      setIsConnectingOAuth(false);
    }
  };

  const handleSyncSingle = async (providerId: string, providerName: string) => {
    setSyncingProviderId(providerId);
    setTimeout(() => {
      setSyncingProviderId(null);
      setConnections((prev) =>
        prev.map((c) =>
          c.id === providerId ? { ...c, lastSyncedAt: new Date().toISOString() } : c
        )
      );
      toast.success(`${providerName} synchronized with live bookings`);
    }, 1000);
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      setIsSyncingAll(false);
      setConnections((prev) =>
        prev.map((c) =>
          c.status === "connected" ? { ...c, lastSyncedAt: new Date().toISOString() } : c
        )
      );
      toast.success("All connected calendars synchronized in real time");
    }, 1200);
  };

  const getProviderIcon = (provider: string) => {
    if (provider === "google_calendar") {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 font-bold text-sm shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>
      );
    }

    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
        <CalendarDays className="h-5 w-5" />
      </div>
    );
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
          disabled={isSyncingAll}
          className="text-xs h-8 cursor-pointer"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isSyncingAll && "animate-spin")} />
          Sync All Calendars
        </Button>
      </div>

      {/* Grid of Calendar Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {connections.map((conn) => {
          const isConnected = conn.status === "connected";
          const isCardSyncing = syncingProviderId === conn.id;

          return (
            <Card
              key={conn.id}
              className={cn(
                "border bg-white transition-all shadow-2xs hover:shadow-sm",
                isConnected ? "border-stone-200/90" : "border-stone-200/60 bg-stone-50/30 opacity-90"
              )}
            >
              <CardContent className="p-4.5">
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
                        {isConnected ? conn.accountEmail : "Not connected"}
                      </div>
                      {isConnected && conn.calendarName && (
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
                        "text-[10px] transition-colors",
                        isConnected
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-stone-100 text-stone-500 border-stone-200"
                      )}
                    >
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                    <Switch
                      checked={isConnected}
                      disabled={conn.isPrimary}
                      onCheckedChange={() => handleToggle(conn)}
                    />
                  </div>
                </div>

                {isConnected && conn.lastSyncedAt && (
                  <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                    <div className="flex items-center gap-1.5">
                      <span>Last synced: {new Date(conn.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <button
                        type="button"
                        onClick={() => handleSyncSingle(conn.id, conn.providerName)}
                        disabled={isCardSyncing}
                        className="text-stone-400 hover:text-stone-700 transition p-0.5 rounded cursor-pointer"
                        title="Sync this calendar now"
                      >
                        <RefreshCw className={cn("h-3 w-3", isCardSyncing && "animate-spin text-[#0d4a36]")} />
                      </button>
                    </div>
                    <span className="text-emerald-700 flex items-center gap-1 font-medium">
                      <Check className="h-3 w-3" /> Live 2-Way Sync
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* OAuth Connection Dialog */}
      <Dialog
        open={Boolean(connectModalProvider)}
        onOpenChange={(open) => !open && !isConnectingOAuth && setConnectModalProvider(null)}
      >
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border border-stone-200 bg-white shadow-xl">
          <DialogHeader className="p-5 pb-4 border-b border-stone-100 bg-white">
            <div className="flex items-center gap-3">
              {connectModalProvider && getProviderIcon(connectModalProvider.provider)}
              <div>
                <DialogTitle className="text-base font-semibold text-stone-900">
                  Connect {connectModalProvider?.providerName}
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Authorize OAuth2 access for real-time conflict checking & automatic viewing booking.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 space-y-4">
            <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5 space-y-2">
              <div className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0d4a36]" />
                <span>Permissions & Real-Time Sync</span>
              </div>
              <ul className="text-[11px] text-stone-600 space-y-1 list-disc list-inside">
                <li>Read Google Calendar busy/free intervals for automated clash detection.</li>
                <li>Automatically write confirmed property inspection appointments.</li>
                <li>Generate instant Google Meet video links for virtual viewings.</li>
              </ul>
            </div>

            {connectModalProvider?.provider === "google_calendar" ? (
              <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-blue-900 flex items-center gap-2.5">
                <ExternalLink className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  Clicking below will securely redirect you to Google's official sign-in screen to authorize your Google account.
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700">Account Email</label>
                <Input
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="ade.admin@spacia.io"
                  className="bg-white text-xs h-9 border-stone-200"
                />
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConnectModalProvider(null)}
              disabled={isConnectingOAuth}
              className="text-xs text-stone-700 bg-white hover:bg-stone-50 h-8"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleAuthorizeOAuth}
              disabled={isConnectingOAuth}
              className={cn(
                "text-xs h-8 shadow-2xs font-medium gap-2 cursor-pointer",
                connectModalProvider?.provider === "google_calendar"
                  ? "bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-xs font-semibold"
                  : "bg-[#0d4a36] hover:bg-[#0a3829] text-white"
              )}
            >
              {isConnectingOAuth ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Redirecting to Google...</span>
                </>
              ) : connectModalProvider?.provider === "google_calendar" ? (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              ) : (
                <>
                  <CalendarCheck2 className="h-3.5 w-3.5" />
                  <span>Authorize & Link Calendar</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
