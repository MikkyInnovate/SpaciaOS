"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/marketing/motion";

export function LandingCta() {
  return (
    <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-[32px] bg-black text-white px-6 py-16 sm:px-12 sm:py-20 text-center">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[75%]"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(34,197,94,0.5), rgba(21,128,61,0.32) 30%, rgba(13,74,54,0.12) 55%, transparent 75%)",
          }}
        />
        <Reveal className="relative mx-auto max-w-2xl space-y-5">
          <div className="text-[11px] font-mono text-emerald-200/80 uppercase tracking-wider">
            FOUNDING COHORT // Q4 2026 ACCESS
          </div>

          <h2 className="font-display font-bold text-3xl sm:text-5xl tracking-tight leading-[1.05] text-balance">
            Equip your brokerage with autonomous sales speed.
          </h2>

          <p className="mx-auto text-zinc-300 text-sm sm:text-base max-w-xl leading-relaxed">
            We are onboarding premier real estate developers and luxury brokerage teams in curated batches
            to ensure white-glove voice calibration and dedicated sub-second telephony routing.
          </p>

          <div className="pt-3 flex flex-col items-center gap-4">
            <Link
              href="/waitlist"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-zinc-950 text-sm font-semibold transition-all duration-300 hover:bg-[#22c55e] hover:shadow-[0_6px_22px_rgba(34,197,94,0.45)]"
            >
              <span>Request Priority Access</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="text-[11px] font-mono text-zinc-400">
              Cohort Batch 2 Onboarding &bull; Limited Capacity
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
