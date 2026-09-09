"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global crash caught:", error.message);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-6">
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Critical System Failure</h1>
          <p className="mt-2 text-sm text-slate-500">
            A fatal error occurred at the root application level.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-slate-400">
              Digest: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}
