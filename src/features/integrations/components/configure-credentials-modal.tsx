"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Database,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { IntegrationItem, UpdateCredentialsPayload } from "../types";

interface ConfigureCredentialsModalProps {
  integration: IntegrationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, payload: UpdateCredentialsPayload, testImmediately: boolean) => Promise<void>;
  isSaving: boolean;
}

export function ConfigureCredentialsModal({
  integration,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: ConfigureCredentialsModalProps) {
  // Form State
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [visibleFields, setVisibleFields] = React.useState<Record<string, boolean>>({});
  const [testImmediately, setTestImmediately] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // UI States
  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const [copiedCurl, setCopiedCurl] = React.useState(false);
  const [copiedSecret, setCopiedSecret] = React.useState(false);
  const [showPayloadGuide, setShowPayloadGuide] = React.useState(false);
  const [propertyProtocol, setPropertyProtocol] = React.useState<"pms_api" | "direct_db">("pms_api");

  React.useEffect(() => {
    if (integration) {
      const cfg = integration.config || {};
      let initialSecret = "";
      if (integration.type === "webhook" && !integration.hasCredentials) {
        const array = new Uint8Array(20);
        window.crypto.getRandomValues(array);
        initialSecret = "whsec_live_" + Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
      }

      setFormData({
        // Webhook
        webhookSecret: initialSecret,
        signingSecret: initialSecret,
        // Property DB
        endpointUrl: cfg.endpointUrl || "https://api.luxuryagency.com/v1/properties",
        apiKey: "",
        connectionString: "",
        syncMode: cfg.syncMode || "realtime",
        // CRM
        accessToken: "",
        portalId: cfg.portalId || "",
      });
      setVisibleFields({});
      setErrorMessage(null);
      setShowPayloadGuide(false);
      setPropertyProtocol("pms_api");
    }
  }, [integration]);

  if (!integration) return null;

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const toggleVisibility = (key: string) => {
    setVisibleFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerateWebhookSecret = () => {
    const array = new Uint8Array(20);
    window.crypto.getRandomValues(array);
    const secret = "whsec_live_" + Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
    setFormData((prev) => ({
      ...prev,
      webhookSecret: secret,
      signingSecret: secret,
    }));
  };

  const webhookEndpoint =
    integration.config?.endpointUrl ||
    `https://api.spacia.ai/api/v1/leads/ingest?workspaceId=${integration.workspaceId || "org_dubai_palace"}`;

  const copyToClipboard = (text: string, isCurl = false, isSecret = false) => {
    navigator.clipboard.writeText(text);
    if (isCurl) {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else if (isSecret) {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const curlExample = `curl -X POST "${webhookEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-Spacia-Signature: sha256=..." \\
  -d '{
    "firstName": "Elena",
    "lastName": "Rostova",
    "email": "elena.rostova@monaco-invest.mc",
    "phone": "+971501234567",
    "budgetMin": 5000000,
    "budgetMax": 12000000,
    "currency": "AED",
    "notes": "Penthouse with private pool"
  }'`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const credentials: Record<string, any> = {};
    const config: Record<string, any> = { ...(integration.config || {}) };

    if (integration.type === "webhook") {
      const secret = formData.webhookSecret || formData.signingSecret;
      if (secret?.trim()) {
        credentials.webhookSecret = secret.trim();
        credentials.signingSecret = secret.trim();
      } else if (!integration.hasCredentials) {
        setErrorMessage("Please enter or generate a Webhook HMAC Signing Secret.");
        return;
      }
      config.endpointUrl = webhookEndpoint;
    } else if (integration.type === "property_db") {
      if (propertyProtocol === "pms_api") {
        if (!formData.endpointUrl?.trim()) {
          setErrorMessage("Property Database / PMS API Endpoint URL is required.");
          return;
        }
        if (!formData.apiKey?.trim() && !integration.hasCredentials) {
          setErrorMessage("Bearer Token / Secret API Key is required.");
          return;
        }
        if (formData.apiKey?.trim()) {
          credentials.apiKey = formData.apiKey.trim();
        }
        config.endpointUrl = formData.endpointUrl.trim();
        config.syncMode = formData.syncMode || "realtime";
        config.protocol = "pms_api";
      } else {
        if (!formData.connectionString?.trim() && !integration.hasCredentials) {
          setErrorMessage("Database Connection URI is required.");
          return;
        }
        if (formData.connectionString?.trim()) {
          credentials.connectionString = formData.connectionString.trim();
          credentials.apiKey = "sql_pooler_active";
        }
        config.protocol = "direct_db";
        config.syncMode = "realtime";
      }
    } else if (integration.type === "crm") {
      if (!formData.accessToken?.trim() && !integration.hasCredentials) {
        setErrorMessage("HubSpot Private App Access Token is required.");
        return;
      }
      if (formData.accessToken?.trim()) {
        credentials.accessToken = formData.accessToken.trim();
      }
      if (formData.portalId?.trim()) {
        config.portalId = formData.portalId.trim();
      }
      config.syncMode = "bidirectional";
    } else {
      // Generic fallback
      for (const [key, val] of Object.entries(formData)) {
        if (!val) continue;
        if (key.includes("Url") || key.includes("Mode") || key.includes("Id")) {
          config[key] = val;
        } else {
          credentials[key] = val;
        }
      }
    }

    try {
      await onSave(integration.id, { credentials, config }, testImmediately);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update integration credentials.");
    }
  };

  // Provider Icon styling
  const renderProviderIcon = () => {
    switch (integration.type) {
      case "webhook":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-700 border border-stone-200/80 shrink-0">
            <Webhook className="h-5 w-5" />
          </div>
        );
      case "property_db":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-700 border border-stone-200/80 shrink-0">
            <Database className="h-5 w-5" />
          </div>
        );
      case "crm":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-700 border border-stone-200/80 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-700 border border-stone-200/80 shrink-0">
            <KeyRound className="h-5 w-5" />
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border border-stone-200 bg-white shadow-xl rounded-xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-stone-100 bg-white">
          <div className="flex items-center gap-3">
            {renderProviderIcon()}
            <div>
              <DialogTitle className="text-base font-semibold text-stone-900">
                {integration.type === "webhook"
                  ? "Configure Inbound Lead Webhook"
                  : integration.type === "property_db"
                  ? "Connect External Property Database"
                  : integration.type === "crm"
                  ? "Connect HubSpot Luxury CRM"
                  : `Configure ${integration.name}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                {integration.type === "webhook"
                  ? "Capture website inquiries and landing page lead submissions in sub-second time"
                  : integration.type === "property_db"
                  ? "Connect live inventory and availability for AI-driven buyer inquiries"
                  : integration.type === "crm"
                  ? "Two-way synchronization of qualified buyer dossiers and deal pipeline stages"
                  : "Manage access tokens and connection parameters securely"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Security Banner */}
          <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3 text-xs text-stone-700 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-stone-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-stone-900">Zero-Trust Encrypted Storage</span>
              <p className="text-[11px] text-stone-500 leading-normal">
                Credentials are encrypted with AES-256 before storage in Neon PostgreSQL. Raw keys are never returned to client browsers.
              </p>
            </div>
          </div>

          {/* Masked Existing Key Badge */}
          {integration.hasCredentials && (
            <div className="flex items-center justify-between px-3 py-2 bg-stone-50/90 border border-stone-200/80 rounded-lg text-xs">
              <div className="flex items-center gap-2 text-stone-600">
                <Lock className="h-3.5 w-3.5 text-stone-400" />
                <span className="font-medium">Active Credential:</span>
              </div>
              <span className="font-mono text-[11px] text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200 font-medium">
                {integration.maskedKey}
              </span>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200/80 text-red-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ==================================================================== */}
          {/* CASE 1: WEBHOOK INGESTION                                            */}
          {/* ==================================================================== */}
          {integration.type === "webhook" && (
            <div className="space-y-4">
              {/* Endpoint Display with 1-Click Copy */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-stone-800">Your Inbound Webhook Endpoint URL</label>
                  <span className="text-[11px] text-stone-400">Read-Only</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={webhookEndpoint}
                    className="font-mono text-[11px] bg-stone-50 text-stone-700 border-stone-200 select-all"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookEndpoint)}
                    className="h-9 px-3 shrink-0 text-xs border-stone-200 bg-white hover:bg-stone-50 font-medium gap-1.5"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-stone-500" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-stone-500">
                  Paste this endpoint into your Webflow form, WordPress, Zapier, Unbounce, or custom website backend.
                </p>
              </div>

              {/* Webhook HMAC Signing Secret */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-stone-800">
                    Webhook Signing Secret Token
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleGenerateWebhookSecret}
                      className="text-stone-500 hover:text-stone-800 flex items-center gap-1 text-[11px] font-medium"
                      title="Generate a new secret token"
                    >
                      <RotateCcw className="h-3 w-3" /> Roll New Secret
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleVisibility("webhookSecret")}
                      className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-[11px]"
                    >
                      {visibleFields.webhookSecret ? (
                        <>
                          <EyeOff className="h-3 w-3" /> Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" /> Show
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type={visibleFields.webhookSecret ? "text" : "password"}
                    placeholder={integration.maskedKey || "whsec_live_••••••••••••••••"}
                    value={formData.webhookSecret || ""}
                    onChange={(e) => handleInputChange("webhookSecret", e.target.value)}
                    className="font-mono text-xs border-stone-200 focus-visible:ring-1 focus-visible:ring-stone-400 select-all"
                  />
                  {formData.webhookSecret && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(formData.webhookSecret, false, true)}
                      className="h-9 px-3 shrink-0 text-xs border-stone-200 bg-white hover:bg-stone-50 font-medium gap-1.5"
                    >
                      {copiedSecret ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-stone-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="rounded-md bg-stone-50 p-2.5 border border-stone-200/60 text-[11px] text-stone-600 space-y-1">
                  <p>
                    <span className="font-semibold text-stone-800">Where does this go?</span> Spacia provides this secret key to authenticate requests. Your website backend signs payloads using HMAC-SHA256 in the <code className="text-[10px] bg-stone-200/70 px-1 py-0.5 rounded text-stone-800 font-mono">X-Spacia-Signature</code> header.
                  </p>
                  <p className="text-stone-500 text-[10.5px]">
                    Note: If your website uses standard forms (Webflow, WordPress Elementor, Zapier) without signature support, you only need to copy the Webhook URL above.
                  </p>
                </div>
              </div>

              {/* Collapsible Sample Payload & Curl Guide */}
              <div className="rounded-lg border border-stone-200 bg-stone-50/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPayloadGuide(!showPayloadGuide)}
                  className="w-full flex items-center justify-between p-3 text-xs font-medium text-stone-700 hover:bg-stone-100/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Code2 className="h-3.5 w-3.5 text-stone-500" />
                    Payload Schema & cURL Test Example
                  </span>
                  {showPayloadGuide ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
                {showPayloadGuide && (
                  <div className="p-3 pt-0 border-t border-stone-200/60 space-y-2.5">
                    <div className="relative">
                      <pre className="text-[10.5px] font-mono bg-stone-900 text-stone-100 p-3 rounded-md overflow-x-auto leading-relaxed">
                        {curlExample}
                      </pre>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(curlExample, true)}
                        className="absolute top-2 right-2 h-7 px-2 text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 gap-1"
                      >
                        {copiedCurl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedCurl ? "Copied" : "Copy cURL"}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* CASE 2: PROPERTY DATABASE / PMS GATEWAY                              */}
          {/* ==================================================================== */}
          {integration.type === "property_db" && (
            <div className="space-y-4">
              {/* Protocol Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-800">Connection Protocol</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100/80 rounded-lg border border-stone-200/80">
                  <button
                    type="button"
                    onClick={() => setPropertyProtocol("pms_api")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer",
                      propertyProtocol === "pms_api"
                        ? "bg-white text-stone-900 shadow-xs border border-stone-200"
                        : "text-stone-600 hover:text-stone-900"
                    )}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>REST API / PMS Gateway</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPropertyProtocol("direct_db")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer",
                      propertyProtocol === "direct_db"
                        ? "bg-white text-stone-900 shadow-xs border border-stone-200"
                        : "text-stone-600 hover:text-stone-900"
                    )}
                  >
                    <Server className="h-3.5 w-3.5" />
                    <span>Direct SQL Database</span>
                  </button>
                </div>
              </div>

              {propertyProtocol === "pms_api" ? (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-800 flex items-center gap-1">
                      PMS Listings API Endpoint URL <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="url"
                      placeholder="https://api.luxuryagency.com/v1/properties"
                      value={formData.endpointUrl || ""}
                      onChange={(e) => handleInputChange("endpointUrl", e.target.value)}
                      className="font-mono text-xs border-stone-200 focus-visible:ring-1 focus-visible:ring-stone-400"
                    />
                    <p className="text-[11px] text-stone-500">
                      The REST API endpoint where Spacia AI queries live listing inventory and floor plans.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-medium text-stone-800 flex items-center gap-1">
                        API Access Token / Bearer Secret Key <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleVisibility("apiKey")}
                        className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-[11px]"
                      >
                        {visibleFields.apiKey ? (
                          <>
                            <EyeOff className="h-3 w-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" /> Show
                          </>
                        )}
                      </button>
                    </div>
                    <Input
                      type={visibleFields.apiKey ? "text" : "password"}
                      placeholder="pms_sec_••••••••••••"
                      value={formData.apiKey || ""}
                      onChange={(e) => handleInputChange("apiKey", e.target.value)}
                      className="font-mono text-xs border-stone-200 focus-visible:ring-1 focus-visible:ring-stone-400"
                    />
                    <p className="text-[11px] text-stone-500">
                      Passed in requests as <code className="text-[10px] bg-stone-100 px-1 py-0.5 rounded text-stone-800">Authorization: Bearer &lt;key&gt;</code>.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-800">Sync Strategy</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange("syncMode", "realtime")}
                        className={cn(
                          "p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer",
                          formData.syncMode === "realtime"
                            ? "border-stone-900 bg-stone-100/80 text-stone-900 font-semibold"
                            : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        <p className="font-medium text-stone-900">Real-Time On-Demand</p>
                        <p className="text-[10.5px] text-stone-500 font-normal mt-0.5">Live query during client calls</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange("syncMode", "interval")}
                        className={cn(
                          "p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer",
                          formData.syncMode === "interval"
                            ? "border-stone-900 bg-stone-100/80 text-stone-900 font-semibold"
                            : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        <p className="font-medium text-stone-900">Cached Polling</p>
                        <p className="text-[10.5px] text-stone-500 font-normal mt-0.5">Refreshes every 15 minutes</p>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-medium text-stone-800 flex items-center gap-1">
                        PostgreSQL / Supabase Connection URI <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleVisibility("connectionString")}
                        className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-[11px]"
                      >
                        {visibleFields.connectionString ? (
                          <>
                            <EyeOff className="h-3 w-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" /> Show
                          </>
                        )}
                      </button>
                    </div>
                    <Input
                      type={visibleFields.connectionString ? "text" : "password"}
                      placeholder="postgresql://user:password@db.luxuryagency.com:5432/properties?sslmode=require"
                      value={formData.connectionString || ""}
                      onChange={(e) => handleInputChange("connectionString", e.target.value)}
                      className="font-mono text-xs border-stone-200 focus-visible:ring-1 focus-visible:ring-stone-400"
                    />
                    <p className="text-[11px] text-stone-500">
                      Standard connection URI with read-only credentials to your properties table or schema.
                    </p>
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
                    <span className="font-medium text-stone-800">Supported Direct Engines:</span>
                    <p className="text-[11px] text-stone-500 leading-normal">
                      PostgreSQL 14+, Neon Serverless, Supabase, AWS RDS, and Google Cloud SQL with TLS/SSL encryption enabled.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================================== */}
          {/* CASE 3: HUBSPOT CRM                                                  */}
          {/* ==================================================================== */}
          {integration.type === "crm" && (
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-stone-800 flex items-center gap-1">
                    HubSpot Private App Access Token <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleVisibility("accessToken")}
                    className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-[11px]"
                  >
                    {visibleFields.accessToken ? (
                      <>
                        <EyeOff className="h-3 w-3" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" /> Show
                      </>
                    )}
                  </button>
                </div>
                <Input
                  type={visibleFields.accessToken ? "text" : "password"}
                  placeholder="pat-na1-••••••••••••••••••••••••"
                  value={formData.accessToken || ""}
                  onChange={(e) => handleInputChange("accessToken", e.target.value)}
                  className="font-mono text-xs border-stone-200 focus-visible:ring-1 focus-visible:ring-stone-400"
                />
                <p className="text-[11px] text-stone-500">
                  Created in HubSpot Settings &gt; Integrations &gt; Private Apps. Requires <code className="text-[10px] bg-stone-100 px-1 py-0.5 rounded text-stone-800">crm.objects.contacts</code> and <code className="text-[10px] bg-stone-100 px-1 py-0.5 rounded text-stone-800">crm.objects.deals</code> scopes.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-800">HubSpot Portal / Hub ID</label>
                <Input
                  type="text"
                  placeholder="e.g. 14482910"
                  value={formData.portalId || ""}
                  onChange={(e) => handleInputChange("portalId", e.target.value)}
                  className="font-mono text-xs border-stone-200 focus-visible:ring-1 focus-visible:ring-stone-400"
                />
                <p className="text-[11px] text-stone-500">
                  Your HubSpot Hub ID found in the top-right corner of your HubSpot dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Test connection immediately toggle */}
          <div className="pt-2 border-t border-stone-100">
            <label
              htmlFor="testImmediately"
              className="flex items-center gap-2.5 text-xs text-stone-700 font-medium cursor-pointer"
            >
              <input
                id="testImmediately"
                type="checkbox"
                checked={testImmediately}
                onChange={(e) => setTestImmediately(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 accent-stone-900"
              />
              <span>Test connection handshake immediately on save</span>
            </label>
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 -mx-5 -mb-5 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs text-stone-700 bg-white hover:bg-stone-50 h-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="text-xs h-8 shadow-2xs font-medium gap-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-md cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving & Validating...</span>
                </>
              ) : (
                <span>Save Credentials</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
