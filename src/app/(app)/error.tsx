"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { telemetry } from "@/lib/telemetry/sentry";

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [errorId, setErrorId] = React.useState<string>("");

  React.useEffect(() => {
    // Record to Sentry / client telemetry with digest and stack trace
    const id = telemetry.captureException(error, {
      extra: { digest: error.digest },
    });
    setErrorId(id);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-6 shadow-sm">
        <AlertCircle className="h-8 w-8" aria-hidden="true" />
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        View Temporarily Unavailable
      </h2>
      <p className="mt-2.5 max-w-md text-sm text-muted-foreground leading-relaxed">
        An unexpected error occurred while loading this workspace component. Your data is secure and no changes were lost.
      </p>

      {error.digest && (
        <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-md bg-stone-100 dark:bg-stone-900 px-2.5 py-1 text-[11px] font-mono text-muted-foreground border border-border">
          <span>Digest:</span>
          <span className="text-foreground font-semibold">{error.digest}</span>
        </div>
      )}

      {errorId && (
        <p className="mt-1 text-[10px] font-mono text-muted-foreground/60">
          Trace ID: {errorId}
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => reset()}
          className="gap-2 bg-stone-900 text-stone-100 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Reload Component</span>
        </Button>

        <Button asChild variant="outline">
          <Link href="/dashboard" className="gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Return to Overview</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
