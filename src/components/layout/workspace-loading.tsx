"use client";

import * as React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/lib/config/site";

export function WorkspaceLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fbfbfa] relative overflow-hidden select-none px-4">
      {/* Ambient background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-100/30 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Luxury Loading Card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-stone-200/80 bg-white/90 backdrop-blur-md p-7 shadow-xs text-center flex flex-col items-center space-y-4 animate-in fade-in-50 zoom-in-95 duration-300">
        {/* Animated Brand Emblem */}
        <div className="relative flex items-center justify-center">
          {/* Subtle radiating pulse rings */}
          <div className="absolute h-16 w-16 rounded-2xl bg-emerald-500/10 animate-ping duration-1000" />
          <div className="absolute h-14 w-14 rounded-2xl bg-emerald-500/15" />

          {/* Core Brand Icon */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-[#0d4a36] text-white shadow-xs border border-[#093829]">
            <Sparkles className="h-5 w-5 text-emerald-200 animate-pulse" />
          </div>
        </div>

        {/* Brand & Context Title */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-display text-base font-bold text-stone-900 tracking-tight">
              {siteConfig.name}
            </span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 border border-emerald-200/70">
              OS
            </span>
          </div>
          <p className="text-xs text-stone-500 font-medium">
            Verifying workspace authorization...
          </p>
        </div>

        {/* Sleek Indeterminate Progress Bar */}
        <div className="w-48 h-1 overflow-hidden rounded-full bg-stone-100 border border-stone-200/60 relative">
          <div className="absolute inset-y-0 w-2/5 rounded-full bg-[#0d4a36] animate-[indeterminate_1.4s_ease-in-out_infinite]" />
        </div>

        {/* Security & Multi-tenant Badge */}
        <div className="pt-2 border-t border-stone-100 w-full flex items-center justify-center gap-1.5 text-[11px] text-stone-400 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Tenant Isolated &amp; Encrypted</span>
        </div>
      </div>
    </div>
  );
}
