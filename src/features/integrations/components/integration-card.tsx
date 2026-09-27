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
  CalendarDays,
  Check,
  Copy,
  Globe,
  KeyRound,
  Mail,
  MessageSquare,
  Mic,
  MoreVertical,
  Power,
  RefreshCw,
  Settings,
  ShieldCheck,
  Zap,
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
  isTesting?: boolean;
  isReconnecting?: boolean;
}

function getProviderIcon(type: string) {
  switch (type) {
    case "vapi":
      return <Mic className="h-4 w-4" />;
    case "resend":
      return <Mail className="h-4 w-4" />;
    case "google_calendar":
      return <CalendarDays className="h-4 w-4" />;
    case "webhook":
      return <Globe className="h-4 w-4" />;
    case "whatsapp":
      return <MessageSquare className="h-4 w-4" />;
    case "crm":
      return <Zap className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

function renderStatusBadge(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center gap-1"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Connected
        </Badge>
      );
    case "reconnecting":
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-medium flex items-center gap-1"
        >
          <RefreshCw className="h-2.5 w-2.5 animate-spin text-amber-600" />
          Reconnecting
        </Badge>
      );
    case "error":
      return (
        <Badge
          variant="outline"
          className="border-red-200 bg-red-50 text-red-800 text-[11px] font-medium flex items-center gap-1"
        >
          <AlertTriangle className="h-2.5 w-2.5 text-red-600" />
          Error
        </Badge>
      );
    case "disconnected":
    default:
      return (
        <Badge
          variant="outline"
          className="border-stone-200 bg-stone-50 text-stone-600 text-[11px] font-medium"
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
        <span className="inline-flex items-center gap-1.5 text-red-700 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-red-500" />
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
  isTesting = false,
  isReconnecting = false,
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
  const isErrorOrDisconnected =
    integration.status === "disconnected" || integration.status === "error";

  const formattedLastTested = integration.lastTestedAt
    ? new Date(integration.lastTestedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Never";

  return (
    <Card className="flex flex-col justify-between border-stone-200 shadow-xs hover:border-stone-300 transition-all bg-white relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0d4a36]/5 text-[#0d4a36] border border-[#0d4a36]/10">
              {getProviderIcon(integration.type)}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-stone-900 leading-tight">
                {integration.name}
              </CardTitle>
              <CardDescription className="text-xs text-stone-500 capitalize mt-0.5">
                {integration.category} Layer
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {renderStatusBadge(integration.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-700">
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
                  Run Health Handshake
                </DropdownMenuItem>
                {integration.type === "webhook" && (
                  <DropdownMenuItem onClick={copyWebhookUrl} className="cursor-pointer gap-2">
                    <Copy className="h-3.5 w-3.5 text-stone-600" />
                    Copy Ingestion URL
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {isConnected ? (
                  <DropdownMenuItem
                    onClick={() => onDisconnect(integration.id)}
                    className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 gap-2"
                  >
                    <Power className="h-3.5 w-3.5" />
                    Disconnect Service
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => onReconnect(integration.id)}
                    disabled={isReconnecting}
                    className="cursor-pointer text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50 gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Attempt Reconnect
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5 text-xs pb-4">
        <p className="text-stone-600 text-xs leading-relaxed min-h-[36px]">
          {integration.description}
        </p>

        {/* Security & Credentials Badge Strip */}
        <div className="flex items-center justify-between p-2 rounded-md bg-stone-50 border border-stone-200/80">
          <div className="flex items-center gap-1.5 text-stone-600">
            <KeyRound className="h-3.5 w-3.5 text-stone-400" />
            <span className="text-[11px] font-medium">Credential:</span>
          </div>
          {integration.hasCredentials ? (
            <div className="flex items-center gap-1">
              <span className="font-mono text-[11px] text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200 shadow-2xs">
                {integration.maskedKey}
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            </div>
          ) : (
            <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Not Configured
            </span>
          )}
        </div>

        {/* Failure alert banner if error exists */}
        {integration.lastError && (
          <div className="p-2.5 rounded-md bg-red-50/80 border border-red-200 text-red-800 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
              <span>Failed Handshake ({integration.failureCount} error{integration.failureCount > 1 ? "s" : ""})</span>
            </div>
            <p className="text-[10px] text-red-700/90 font-mono break-all line-clamp-2">
              {integration.lastError}
            </p>
          </div>
        )}

        {/* Diagnostic health summary row */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
          <div className="flex items-center gap-2">
            {renderHealthIndicator(integration.healthStatus, integration.latencyMs)}
          </div>
          <span className="text-stone-400 text-[10px]">
            Checked: {formattedLastTested}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-4 border-t border-stone-100 bg-stone-50/40 rounded-b-xl flex items-center justify-between gap-2">
        {isErrorOrDisconnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReconnect(integration.id)}
            disabled={isReconnecting}
            className="h-8 text-xs border-amber-300 text-amber-900 bg-amber-50/60 hover:bg-amber-100 font-medium gap-1.5 flex-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-700 ${isReconnecting ? "animate-spin" : ""}`} />
            {isReconnecting ? "Reconnecting..." : "Reconnect"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTest(integration.id)}
            disabled={isTesting}
            className="h-8 text-xs text-stone-700 border-stone-200 bg-white hover:bg-stone-50 font-medium gap-1.5 flex-1"
          >
            <RefreshCw className={`h-3 w-3 text-stone-500 ${isTesting ? "animate-spin" : ""}`} />
            {isTesting ? "Validating..." : "Test Health"}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onConfigure(integration)}
          className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium gap-1.5"
          title="Configure Credentials"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Config</span>
        </Button>

        {integration.type === "webhook" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={copyWebhookUrl}
            className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium gap-1"
            title="Copy Webhook Endpoint"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "URL"}</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
