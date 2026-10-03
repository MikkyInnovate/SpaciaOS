"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, ArrowRight, CheckCircle2 } from "lucide-react";

export function WireframeBanner() {
  const pathname = usePathname();
  const isWaitlist = pathname === "/waitlist";

  return (
    <div className="bg-stone-900 text-stone-200 text-xs px-4 py-2 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px] font-bold">
          15
        </span>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-stone-400">Process Checkpoint:</span>
          <span className="text-white font-semibold">Mid-Fidelity Review Stage</span>
          <span className="hidden sm:inline text-stone-500 font-normal">
            (Structure, Content & UX Verification before High-Fidelity UI)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-[11px] text-stone-400 hidden md:inline">Inspect Experience:</span>
        <div className="inline-flex items-center rounded-lg bg-stone-800/80 p-0.5 border border-stone-700/60">
          <Link
            href="/"
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              !isWaitlist
                ? "bg-white text-stone-900 shadow-2xs font-semibold"
                : "text-stone-300 hover:text-white"
            }`}
          >
            Landing Page
          </Link>
          <Link
            href="/waitlist"
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              isWaitlist
                ? "bg-white text-stone-900 shadow-2xs font-semibold"
                : "text-stone-300 hover:text-white"
            }`}
          >
            Waitlist Page
          </Link>
        </div>

        <Link
          href={isWaitlist ? "/" : "/waitlist"}
          className="inline-flex items-center gap-1 text-[11px] text-stone-300 hover:text-white underline underline-offset-2 ml-2"
        >
          <span>Switch View</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
