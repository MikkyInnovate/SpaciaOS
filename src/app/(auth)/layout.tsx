import * as React from "react";
import Link from "next/link";
import { Sparkles, Building2, ShieldCheck, Zap } from "lucide-react";
import { siteConfig } from "@/lib/config/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#fbfbfa] text-stone-900">
      {/* Top Navigation / Brand Header */}
      <header className="w-full border-b border-stone-200/80 bg-white/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d4a36] text-white shadow-xs">
              <Sparkles className="h-4 w-4 text-emerald-200" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm tracking-tight text-stone-900">
                {siteConfig.name}
              </span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60">
                OS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span className="hidden sm:inline">Enterprise Tenant Security</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Real-Estate Product Context Banner */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-medium text-stone-600 shadow-2xs">
              <Building2 className="h-3 w-3 text-[#0d4a36]" />
              <span>Managed Real-Estate Sales System</span>
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight text-stone-900">
              Welcome to {siteConfig.name}
            </h1>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Autonomous AI lead qualification, voice pipeline, and viewing management.
            </p>
          </div>

          {/* Children: SignIn / SignUp Component */}
          <div className="flex justify-center">
            {children}
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full border-t border-stone-200/60 bg-white/50 px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
          <div>
            © {new Date().getFullYear()} {siteConfig.name} OS. Real-Estate Operational Intelligence.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-600" /> High-Concurrence AI Pipeline
            </span>
            <span>Clerk Identity Protected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
