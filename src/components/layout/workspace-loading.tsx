"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { siteConfig } from "@/lib/config/site";

export function WorkspaceLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fbfbfa] select-none px-4">
      <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in duration-500">
        {/* Sleek Concentric Orbital Ring Loader */}
        <div className="relative flex items-center justify-center h-16 w-16">
          {/* Subtle static guide track */}
          <div className="absolute inset-0 rounded-full border-[1.5px] border-stone-200/60" />

          {/* Smooth spinning gradient arc with soft glow */}
          <svg
            className="absolute inset-0 h-full w-full animate-spin [animation-duration:1.5s] ease-linear"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="32"
              cy="32"
              r="30"
              stroke="url(#pacia-loader-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="50 140"
            />
            <defs>
              <linearGradient id="pacia-loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0d4a36" stopOpacity="1" />
                <stop offset="60%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Central Luxury Emblem */}
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d4a36] text-white shadow-2xs border border-[#093829]">
            <Sparkles className="h-4 w-4 text-emerald-200 animate-pulse" />
          </div>
        </div>

        {/* Minimalist Typographic Label */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-display text-sm font-bold text-stone-900 tracking-tight">
              {siteConfig.name}
            </span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 border border-emerald-200/70">
              OS
            </span>
          </div>
          <p className="text-xs text-stone-400 font-medium tracking-wide">
            Initializing workspace...
          </p>
        </div>
      </div>
    </div>
  );
}
