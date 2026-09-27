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
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  INTEGRATION_FIELD_DEFINITIONS,
  type IntegrationItem,
  type UpdateCredentialsPayload,
} from "../types";

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
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [visibleFields, setVisibleFields] = React.useState<Record<string, boolean>>({});
  const [testImmediately, setTestImmediately] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (integration) {
      setFormData({});
      setVisibleFields({});
      setErrorMessage(null);
    }
  }, [integration]);

  if (!integration) return null;

  const fieldDefs = INTEGRATION_FIELD_DEFINITIONS[integration.type] || [
    {
      key: "apiKey",
      label: "API Access Key / Secret",
      type: "password",
      placeholder: "Enter secret access token...",
      description: "Primary secret credential for authenticating API requests.",
      required: true,
    },
  ];

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const toggleVisibility = (key: string) => {
    setVisibleFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check required fields
    for (const def of fieldDefs) {
      if (def.required && !formData[def.key]?.trim()) {
        setErrorMessage(`Field "${def.label}" is required.`);
        return;
      }
    }

    // Split credentials vs config fields
    const credentials: Record<string, any> = {};
    const config: Record<string, any> = { ...(integration.config || {}) };

    for (const [key, val] of Object.entries(formData)) {
      if (!val) continue;
      if (key === "endpointUrl" || key === "calendarId" || key === "portalId" || key === "fromEmail") {
        config[key] = val;
      }
      credentials[key] = val;
    }

    try {
      await onSave(integration.id, { credentials, config }, testImmediately);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update integration credentials.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg border-stone-200">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d4a36]/10 text-[#0d4a36]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-stone-900">
                Configure {integration.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Manage access tokens and connection parameters securely
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Security Assurance Banner */}
          <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/80 p-3 text-emerald-950 flex items-start gap-2.5 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-semibold text-emerald-900">Zero-Trust Credential Security</span>
              <p className="text-emerald-800 text-[11px]">
                Secrets are encrypted with AES-256 before storage in Neon PostgreSQL. Credentials are never exposed or returned to the browser.
              </p>
            </div>
          </div>

          {/* Masked Key Status if already configured */}
          {integration.hasCredentials && (
            <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-600">
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-stone-400" />
                <span>Existing Credential:</span>
              </div>
              <span className="font-mono text-[11px] text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200">
                {integration.maskedKey}
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3.5">
            {fieldDefs.map((field) => {
              const isPassword = field.type === "password";
              const isVisible = visibleFields[field.key] || false;

              return (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor={field.key}
                      className="font-medium text-stone-800 flex items-center gap-1"
                    >
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {isPassword && (
                      <button
                        type="button"
                        onClick={() => toggleVisibility(field.key)}
                        className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-[11px]"
                      >
                        {isVisible ? (
                          <>
                            <EyeOff className="h-3 w-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" /> Show
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      id={field.key}
                      type={isPassword && !isVisible ? "password" : "text"}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="font-mono text-xs pr-8 border-stone-300 focus-visible:ring-emerald-700"
                    />
                  </div>

                  {field.description && (
                    <p className="text-[11px] text-stone-500 leading-normal">
                      {field.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Test connection immediately toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <label
              htmlFor="testImmediately"
              className="text-xs text-stone-700 font-medium cursor-pointer"
            >
              Test connection handshake immediately on save
            </label>
            <input
              id="testImmediately"
              type="checkbox"
              checked={testImmediately}
              onChange={(e) => setTestImmediately(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-[#0d4a36] focus:ring-[#0d4a36]"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs text-stone-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="text-xs bg-[#0d4a36] hover:bg-[#0a3829] text-white font-medium gap-1.5"
            >
              {isSaving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              {isSaving ? "Saving & Testing..." : "Save Credentials"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
