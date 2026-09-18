import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { RetryPolicy, FailureDiagnostic } from "../types";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Clock,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

export interface WorkflowRetryStateProps {
  workflowId: string;
  retry?: RetryPolicy;
  failure?: FailureDiagnostic;
  onRetry?: (workflowId: string) => Promise<void> | void;
  onEscalate?: (workflowId: string) => Promise<void> | void;
  className?: string;
}

export function WorkflowRetryState({
  workflowId,
  retry,
  failure,
  onRetry,
  onEscalate,
  className,
}: WorkflowRetryStateProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [showDiagnostics, setShowDiagnostics] = React.useState(false);
  const [secondsRemaining, setSecondsRemaining] = React.useState(
    retry?.backoffSeconds || 45
  );

  // Simulated countdown timer for backoff
  React.useEffect(() => {
    if (!retry?.isRetrying || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [retry?.isRetrying, secondsRemaining]);

  const handleManualRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      if (onRetry) {
        await onRetry(workflowId);
      }
      toast.success("Workflow Retry Dispatched", {
        description: `Retry attempt initiated for workflow ${workflowId}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Retry attempt failed";
      toast.error("Retry Failed", { description: msg });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleEscalate = async () => {
    if (onEscalate) {
      await onEscalate(workflowId);
    }
    toast.success("Escalated to Human Broker", {
      description: "Sales associate notified for manual lead intervention.",
    });
  };

  const currentAttempt = retry?.currentAttempt || 1;
  const maxRetries = retry?.maxRetries || 3;

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-300/80 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/20 p-3.5 space-y-3 shadow-2xs",
        className
      )}
    >
      {/* Header & Error Summary */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-stone-900">
                {failure?.errorCode || "AUTOMATION_EXECUTION_FAULT"}
              </span>
              <span className="rounded bg-amber-200/60 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-amber-900 border border-amber-300">
                Attempt {currentAttempt} of {maxRetries}
              </span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              {failure?.errorMessage ||
                "A temporary provider or telephony fault interrupted workflow execution."}
            </p>
          </div>
        </div>

        {/* Retry Backoff Countdown */}
        {retry?.isRetrying && secondsRemaining > 0 && (
          <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-amber-800 bg-amber-100/70 px-2 py-1 rounded-md border border-amber-300">
            <Clock className="h-3 w-3 text-amber-700 animate-pulse" />
            <span>Next in {secondsRemaining}s</span>
          </div>
        )}
      </div>

      {/* Suggested Fix Action */}
      {failure?.suggestedAction && (
        <div className="rounded-lg bg-white/90 p-2.5 border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="text-[11px] leading-tight">
            <strong>Recommended Recovery:</strong> {failure.suggestedAction}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleManualRetry}
            disabled={isRetrying}
            className="h-7 px-2.5 bg-[#0d4a36] hover:bg-[#093829] text-white text-xs gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw
              className={cn("h-3 w-3", isRetrying && "animate-spin")}
            />
            <span>{isRetrying ? "Retrying..." : "Retry Now"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEscalate}
            className="h-7 px-2.5 border-stone-300 bg-white text-stone-700 hover:text-stone-900 text-xs gap-1.5 cursor-pointer"
          >
            <UserCheck className="h-3 w-3 text-indigo-600" />
            <span>Escalate to Broker</span>
          </Button>
        </div>

        {/* Technical Diagnostics Accordion Trigger */}
        {failure?.technicalDetails && (
          <button
            type="button"
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className="flex items-center gap-1 text-[10px] font-medium text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          >
            <Terminal className="h-3 w-3 text-stone-400" />
            <span>{showDiagnostics ? "Hide Diagnostics" : "Inspect Logs"}</span>
            {showDiagnostics ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {/* Technical Diagnostics Detail */}
      {showDiagnostics && failure?.technicalDetails && (
        <div className="mt-2 rounded-lg bg-stone-900 p-2.5 text-[10px] font-mono text-stone-200 overflow-x-auto border border-stone-800 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-stone-400 text-[9px] pb-1 border-b border-stone-800 mb-1.5">
            <span>TECHNICAL DEBUG PAYLOAD</span>
            <span>Failed at: {failure.failedAt}</span>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed text-emerald-400">
            {failure.technicalDetails}
          </pre>
        </div>
      )}
    </div>
  );
}
