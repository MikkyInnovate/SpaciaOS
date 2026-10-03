"use client";

export function LandingProblem() {
  return (
    <section id="problem" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
          01 // THE CORE BOTTLENECK
        </span>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950 tracking-tight">
          High-ticket real estate deals are lost in the first 5 minutes.
        </h2>
        <p className="text-sm text-zinc-600 max-w-2xl leading-relaxed">
          Inbound leads arrive at all hours across portals and ad campaigns. When brokers take hours to respond, buyer intent evaporates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* The Problem Box */}
        <div className="p-6 rounded-xl border border-zinc-200 bg-zinc-50 space-y-4">
          <div className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
            Traditional Handling
          </div>
          <h3 className="font-bold text-base text-zinc-900">
            Manual Lag & Lead Leakage
          </h3>
          <ul className="space-y-2.5 text-xs text-zinc-600">
            <li className="flex items-start gap-2">
              <span className="text-zinc-400 font-mono shrink-0">—</span>
              <span><strong>4+ Hour Delay:</strong> Leads wait hours for a callback; 78% engage a competing developer before sunrise.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-400 font-mono shrink-0">—</span>
              <span><strong>Unfiltered Time Drain:</strong> Brokers spend over 60% of their day answering basic FAQs from unvetted prospects.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-400 font-mono shrink-0">—</span>
              <span><strong>Scattered Context:</strong> Budget constraints, financing readiness, and inspection dates get lost across chat threads.</span>
            </li>
          </ul>
        </div>

        {/* The Solution Box */}
        <div className="p-6 rounded-xl border border-zinc-900 bg-white space-y-4 shadow-sm">
          <div className="text-xs font-mono font-bold text-zinc-950 uppercase tracking-wider">
            SpaciaOS Engine
          </div>
          <h3 className="font-bold text-base text-zinc-950">
            Sub-Second Qualification & Lockout
          </h3>
          <ul className="space-y-2.5 text-xs text-zinc-700">
            <li className="flex items-start gap-2">
              <span className="font-mono font-bold text-zinc-950 shrink-0">✓</span>
              <span><strong>Sub-3s Inbound Pickup:</strong> Immediate conversational outbound call or response 24/7/365.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono font-bold text-zinc-950 shrink-0">✓</span>
              <span><strong>5-Point BANT Scoring:</strong> Verifies liquid proof, purchase timeline, and decision-maker status.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono font-bold text-zinc-950 shrink-0">✓</span>
              <span><strong>Autonomous Booking:</strong> Locks calendar slots into Google Workspace with zero double-booking collisions.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
