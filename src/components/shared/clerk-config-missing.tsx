import * as React from "react";
import { KeyRound, ExternalLink, Terminal, ShieldAlert } from "lucide-react";

export function ClerkConfigMissing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa] p-4 font-sans">
      <div className="w-full max-w-xl rounded-xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
        {/* Header Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-stone-900">
              Clerk Authentication Setup Required
            </h1>
            <p className="text-xs text-stone-500">
              Pacia requires valid Clerk credentials to initialize authentication & workspaces.
            </p>
          </div>
        </div>

        {/* Informational Box */}
        <div className="mt-6 rounded-lg bg-stone-50 p-4 border border-stone-200/80 text-xs text-stone-700 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-stone-900">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Real Authentication Enforcement</span>
          </div>
          <p className="text-stone-600 leading-relaxed">
            Per Pacia production standards, simulated demo users are disabled. Real authentication must be provided via your Clerk development instance.
          </p>
        </div>

        {/* Step-by-step Setup */}
        <div className="mt-6 space-y-4 text-xs">
          <div className="font-semibold text-stone-900">Quick Configuration Steps:</div>
          <ol className="space-y-3 text-stone-600 list-decimal list-inside leading-relaxed">
            <li>
              Copy the environment template:
              <div className="mt-1.5 flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 text-[11px] font-mono text-stone-100">
                <Terminal className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span>cp .env.example .env.local</span>
              </div>
            </li>
            <li>
              Obtain your API keys from the{" "}
              <a
                href="https://dashboard.clerk.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#0d4a36] hover:underline"
              >
                Clerk Dashboard <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              Add the following keys to your <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-stone-800">.env.local</code> file:
              <div className="mt-1.5 rounded-md bg-stone-900 p-3 text-[11px] font-mono text-stone-100 space-y-1 overflow-x-auto">
                <div>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...</div>
                <div>CLERK_SECRET_KEY=sk_test_...</div>
              </div>
            </li>
            <li>Restart your local development server.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
