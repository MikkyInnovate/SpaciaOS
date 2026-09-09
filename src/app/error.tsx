"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    // Log non-sensitive error metadata for development inspection
    console.error("Root error boundary caught:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Application Error
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected problem occurred while rendering this view. Your data is safe.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Reference ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => reset()} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Try again</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
          >
            Go to Overview
          </Button>
        </div>
      </div>
    </div>
  );
}
