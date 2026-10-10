"use client";

import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";

export function LandingHero() {
  return (
    <section className="pt-20 sm:pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
      {/* Category Tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-zinc-200 bg-zinc-50 text-[11px] font-mono text-zinc-600">
        <span>MANAGED AI SALES SYSTEM // REAL ESTATE</span>
      </div>

      {/* Main Headline - Concise & High-Impact */}
      <h1 className="font-display font-bold text-4xl sm:text-6xl text-zinc-950 tracking-tight leading-[1.08] max-w-4xl mx-auto">
        Autonomous sales orchestration for high-ticket real estate.
      </h1>

      {/* Crisp Value Proposition */}
      <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
        SpaciaOS captures inbound buyer inquiries in under 3 seconds, conducts conversational BANT
        underwriting over natural voice telephony, and books verified property inspections on your agents' calendars.
      </p>

      {/* Primary CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
        <Link
          href="/waitlist"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
        >
          <span>Request Priority Access</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <a
          href="#cockpit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium border border-zinc-200 transition-colors"
        >
          <span>View Live Cockpit</span>
          <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />
        </a>
      </div>

      {/* Spec Strip */}
      <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-zinc-500">
        <span>• &lt;450ms Speech Latency</span>
        <span>• 2-Way Calendar Lockout</span>
        <span>• 1-Click Broker Takeover</span>
      </div>
    </section>
  );
}
