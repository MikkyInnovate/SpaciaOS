"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Lock,
  MoreVertical,
  Plug,
  Power,
  RefreshCw,
  Settings,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IntegrationItem, IntegrationStatus, IntegrationHealthStatus } from "../types";

interface IntegrationCardProps {
  integration: IntegrationItem;
  onTest: (id: string) => Promise<void>;
  onReconnect: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
  onConfigure: (integration: IntegrationItem) => void;
  onConnectGoogle?: () => void;
  isTesting?: boolean;
  isReconnecting?: boolean;
  isConnectingGoogle?: boolean;
}

function GoogleGIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
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
  );
}

/**
 * Official Brand SVG Icons for Connected Services
 */
function renderCompanyBrandIcon(type: string) {
  switch (type) {
    case "google_calendar":
      return (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-stone-200/90 shadow-2xs shrink-0">
          <svg className="w-6 h-6" viewBox="0 0 24 24">
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

    case "crm":
      return (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF1ED] border border-[#FFD9CF] shrink-0 shadow-2xs">
          {/* Official HubSpot Sprocket Logo */}
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FF7A59">
            <path d="M18.88 7.8a2.93 2.93 0 0 0-2.48-1.57V4.05a1.86 1.86 0 1 0-1.84 0v2.18a2.93 2.93 0 0 0-2.48 1.57 2.92 2.92 0 0 0 .54 3.55l-4.14 4.14a2.93 2.93 0 1 0 1.3 1.3l4.14-4.14a2.91 2.91 0 0 0 3.55.54 2.94 2.94 0 0 0 1.41-2.45v-.04a2.94 2.94 0 0 0 0-.91zm-3.39 2.08a1.32 1.32 0 1 1 0-1.86 1.32 1.32 0 0 1 0 1.86z"/>
          </svg>
        </div>
      );

    case "webhook":
      return (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0d4a36]/5 text-[#0d4a36] border border-[#0d4a36]/15 shrink-0 shadow-2xs">
          {/* Webhook & Inbound API Gateway Icon */}
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#0d4a36" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c0-2.21 1.79-4 4-4h1" />
            <path d="M6 13V7a4 4 0 0 1 4-4h6" />
            <circle cx="18" cy="17" r="3" fill="#0d4a36" />
            <circle cx="18" cy="7" r="3" fill="#0d4a36" />
          </svg>
        </div>
      );

    case "property_db":
    default:
      return (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-200/90 shrink-0 shadow-2xs">
          {/* Enterprise Database & PMS Storage Stack Icon */}
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5V12C3 13.66 7.03 15 12 15C16.97 15 21 13.66 21 12V5" />
            <path d="M3 12V19C3 20.66 7.03 22 12 22C16.97 22 21 20.66 21 19V12" />
          </svg>
        </div>
      );
  }
}

function renderStatusBadge(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-md"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Connected
        </Badge>
      );
    case "reconnecting":
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-md"
        >
          <RefreshCw className="h-2.5 w-2.5 animate-spin text-amber-600" />
          Reconnecting
        </Badge>
      );
    case "error":
      return (
        <Badge
          variant="outline"
          className="border-rose-200 bg-rose-50 text-rose-800 text-[11px] font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-md"
        >
          <AlertTriangle className="h-2.5 w-2.5 text-rose-600" />
          Error
        </Badge>
      );
    case "disconnected":
    default:
      return (
        <Badge
          variant="outline"
          className="border-stone-200 bg-stone-50 text-stone-600 text-[11px] font-medium px-2 py-0.5 rounded-md"
        >
          Disconnected
        </Badge>
      );
  }
}

function renderHealthIndicator(health: IntegrationHealthStatus, latencyMs?: number | null) {
  switch (health) {
    case "healthy":
      return (
        <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Healthy {latencyMs ? `(${latencyMs}ms)` : ""}
        </span>
      );
    case "degraded":
      return (
        <span className="inline-flex items-center gap-1.5 text-amber-700 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Degraded {latencyMs ? `(${latencyMs}ms)` : ""}
        </span>
      );
    case "unhealthy":
      return (
        <span className="inline-flex items-center gap-1.5 text-rose-700 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Unhealthy
        </span>
      );
    case "untested":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-stone-500 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-stone-300" />
          Untested
        </span>
      );
  }
}

export function IntegrationCard({
  integration,
  onTest,
  onReconnect,
  onDisconnect,
  onConfigure,
  onConnectGoogle,
  isTesting = false,
  isReconnecting = false,
  isConnectingGoogle = false,
}: IntegrationCardProps) {
  const [copied, setCopied] = React.useState(false);

  const copyWebhookUrl = () => {
    const url =
      integration.config?.endpointUrl ||
      `https://api.spacia.ai/api/v1/leads/ingest?key=${integration.maskedKey || "whsec_live"}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConnected = integration.status === "connected";
  const isError = integration.status === "error";
  const isGoogle = integration.type === "google_calendar";

  const formattedLastTested = integration.lastTestedAt
    ? new Date(integration.lastTestedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  return (
    <Card className="flex flex-col justify-between border border-stone-200/80 shadow-2xs hover:border-stone-300 transition-all bg-white rounded-xl overflow-hidden">
      <CardHeader className="p-4.5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {renderCompanyBrandIcon(integration.type)}
            <div>
              <CardTitle className="text-sm font-semibold text-stone-900 leading-tight">
                {integration.name}
              </CardTitle>
              <span className="inline-block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
                {integration.category}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {renderStatusBadge(integration.status)}
            {isConnected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-stone-400 hover:text-stone-700">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 text-xs font-sans">
                  <DropdownMenuItem onClick={() => onConfigure(integration)} className="cursor-pointer gap-2">
                    <Settings className="h-3.5 w-3.5 text-stone-600" />
                    Configure Credentials
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onTest(integration.id)}
                    disabled={isTesting}
                    className="cursor-pointer gap-2"
                  >
                    <Activity className="h-3.5 w-3.5 text-stone-600" />
                    Test Handshake
                  </DropdownMenuItem>
                  {integration.type === "webhook" && (
                    <DropdownMenuItem onClick={copyWebhookUrl} className="cursor-pointer gap-2">
                      <Copy className="h-3.5 w-3.5 text-stone-600" />
                      Copy Ingestion URL
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDisconnect(integration.id)}
                    className="cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50 gap-2"
                  >
                    <Power className="h-3.5 w-3.5" />
                    Disconnect Service
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4.5 pt-0 space-y-3.5 text-xs pb-4">
        <p className="text-stone-600 text-xs leading-relaxed min-h-[38px]">
          {integration.description}
        </p>

        {/* Security & Credentials / Account Pill Container */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50/80 border border-stone-200/70">
          <div className="flex items-center gap-1.5 text-stone-600">
            <Lock className="h-3.5 w-3.5 text-stone-400" />
            <span className="text-[11px] font-medium">
              {isGoogle ? "Linked Account:" : "Access Key:"}
            </span>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200 shadow-2xs font-semibold">
                {integration.maskedKey || (isGoogle ? "Google Workspace" : "Live Key")}
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            </div>
          ) : (
            <span className="text-[11px] text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              {isGoogle ? "Awaiting Google Sign-In" : "Credentials Required"}
            </span>
          )}
        </div>

        {/* Failure alert banner if error exists */}
        {integration.lastError && (
          <div className="p-2.5 rounded-lg bg-rose-50/90 border border-rose-200 text-rose-800 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              <span>Failed Handshake ({integration.failureCount} error{integration.failureCount > 1 ? "s" : ""})</span>
            </div>
            <p className="text-[10px] text-rose-700 font-mono break-all line-clamp-2">
              {integration.lastError}
            </p>
          </div>
        )}

        {/* Diagnostic health summary row */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
          <div className="flex items-center gap-2">
            {isConnected ? (
              renderHealthIndicator(integration.healthStatus, integration.latencyMs)
            ) : (
              <span className="inline-flex items-center gap-1.5 text-stone-500 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-stone-300" />
                Untested
              </span>
            )}
          </div>
          <span className="text-stone-400 text-[10px]">
            {isConnected
              ? `Checked: ${formattedLastTested}`
              : isGoogle
              ? "Free/Busy Clash Detection"
              : "Ready to connect"}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-3 px-4.5 border-t border-stone-100 bg-stone-50/40 rounded-b-xl flex items-center justify-between gap-2">
        {isConnected ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTest(integration.id)}
              disabled={isTesting}
              className="h-8 text-xs text-stone-700 border-stone-200 bg-white hover:bg-stone-50 font-medium gap-1.5 flex-1 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 text-stone-500 ${isTesting ? "animate-spin" : ""}`} />
              {isTesting ? "Validating..." : "Test Health"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onConfigure(integration)}
              className="h-8 px-2.5 text-xs text-stone-700 border-stone-200 bg-white hover:bg-stone-50 font-medium gap-1.5 shadow-2xs cursor-pointer"
              title="Configure Credentials"
            >
              <Settings className="h-3.5 w-3.5 text-stone-500" />
              <span>Config</span>
            </Button>

            {integration.type === "webhook" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyWebhookUrl}
                className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium gap-1 cursor-pointer"
                title="Copy Webhook Endpoint"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "URL"}</span>
              </Button>
            )}
          </>
        ) : isError ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReconnect(integration.id)}
            disabled={isReconnecting}
            className="h-8 text-xs border-amber-300 text-amber-900 bg-amber-50/70 hover:bg-amber-100 font-medium gap-1.5 flex-1 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-700 ${isReconnecting ? "animate-spin" : ""}`} />
            {isReconnecting ? "Reconnecting..." : "Reconnect"}
          </Button>
        ) : isGoogle ? (
          <Button
            size="sm"
            onClick={onConnectGoogle}
            disabled={isConnectingGoogle}
            className="h-8 text-xs font-semibold gap-2 flex-1 bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
          >
            {isConnectingGoogle ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <GoogleGIcon className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{isConnectingGoogle ? "Connecting..." : "Connect Google Calendar"}</span>
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              onClick={() => onConfigure(integration)}
              className="h-8 text-xs font-semibold gap-1.5 flex-1 bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Plug className="h-3.5 w-3.5" />
              <span>Connect Service</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConfigure(integration)}
              className="h-8 px-2.5 text-xs text-stone-700 border-stone-200 bg-white hover:bg-stone-50 font-medium gap-1.5 shadow-2xs cursor-pointer"
              title="Configure Credentials"
            >
              <Settings className="h-3.5 w-3.5 text-stone-500" />
              <span>Config</span>
            </Button>
            {integration.type === "webhook" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyWebhookUrl}
                className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium gap-1 cursor-pointer"
                title="Copy Webhook Endpoint"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "URL"}</span>
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}

