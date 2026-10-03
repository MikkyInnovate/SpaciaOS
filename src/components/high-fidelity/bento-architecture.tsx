"use client";

import { PhoneCall, Layers, CalendarCheck, ShieldCheck } from "lucide-react";

export function BentoArchitecture() {
  return (
    <section id="architecture" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
          02 // PLATFORM ARCHITECTURE
        </span>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950 tracking-tight">
          Calibrated for high-stakes property transactions.
        </h2>
        <p className="text-sm text-zinc-600 max-w-2xl leading-relaxed">
          SpaciaOS combines neural telephony with deterministic qualification rules, guaranteeing zero hallucinated commitments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1 */}
        <div className="p-6 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-2xs">
          <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-900">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div className="text-[10px] font-mono text-zinc-400 uppercase">PILLAR 01</div>
          <h3 className="font-bold text-base text-zinc-950">
            Sub-Second Neural Voice Telephony
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Tuned on luxury real-estate objection handling and off-plan structures. Responds in &lt;450ms with natural pacing, interruption handling, and zero awkward pauses.
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-500">
            &bull; DNC Policy Guard &bull; Quiet Hours Cap &bull; 3-Call Retries
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="p-6 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-2xs">
          <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-900">
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-[10px] font-mono text-zinc-400 uppercase">PILLAR 02</div>
          <h3 className="font-bold text-base text-zinc-950">
            5-Point BANT Qualification Engine
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Extracts and verifies budget liquidity, decision authority, purchase timeline, and property fit. Assigns an explainable 0–100 score before scheduling.
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-500">
            &bull; Liquid Proof Check &bull; Sole vs Syndicate &bull; Urgent Window
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="p-6 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-2xs">
          <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-900">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div className="text-[10px] font-mono text-zinc-400 uppercase">PILLAR 03</div>
          <h3 className="font-bold text-base text-zinc-950">
            Two-Way Calendar Lockout Sync
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Direct integration with Google Workspace and Microsoft 365. In-memory mutex locks eliminate double-bookings and auto-dispatch gate passes with pre-briefings.
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-500">
            &bull; Mutex Lock Guard &bull; Resend SMS &bull; Automated Passes
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="p-6 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-2xs">
          <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-900">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-[10px] font-mono text-zinc-400 uppercase">PILLAR 04</div>
          <h3 className="font-bold text-base text-zinc-950">
            1-Click Human Broker Takeover
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Brokers retain total command. Monitor ongoing calls via real-time transcripts and transfer any active conversation to an agent's personal phone in one keystroke.
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-500">
            &bull; Live Transcript Monitor &bull; PII Scrubbing &bull; Instant Transfer
          </div>
        </div>
      </div>
    </section>
  );
}
