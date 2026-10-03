"use client";

import React from "react";
import { CheckCircle2, Building2, UserCheck, Shield } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";

export function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Mission & Overview */}
        <Reveal className="lg:col-span-6 space-y-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full inline-block">
            About SpaciaOS
          </span>

          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 leading-tight">
            Designed exclusively for premier real estate developers and luxury brokerages.
          </h2>

          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            In luxury real estate, high-net-worth buyers expect instantaneous, confidential,
            and articulate communication. When inquiries sit in WhatsApp threads or voicemail
            inboxes for hours, buyer enthusiasm evaporates.
          </p>

          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            SpaciaOS bridges the critical gap between inbound buyer interest and confirmed
            in-person walkthroughs. We automate lead capture, intelligent qualification,
            and calendar synchronization so your senior brokers focus entirely on closing deals.
          </p>

          <div className="pt-2 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700 font-medium">
                Sub-3 second response time across web portals, ad campaigns, and WhatsApp
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700 font-medium">
                Discreet qualification tailored for high-net-worth buyers and investors
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700 font-medium">
                Single-click human takeover allowing brokers to step into calls at any moment
              </span>
            </div>
          </div>
        </Reveal>

        {/* Right Column: Editorial Value Cards */}
        <Stagger className="lg:col-span-6 space-y-4">
          <StaggerItem className="group p-7 rounded-3xl bg-zinc-50 border border-zinc-200/80 space-y-2.5 transition-[background-color,box-shadow,border-color] duration-300 hover:bg-white hover:border-[#15803d]/25 hover:shadow-[0_24px_40px_-24px_rgba(13,74,54,0.35)]">
            <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-[#15803d] mb-1 transition-colors duration-300 group-hover:bg-[#15803d] group-hover:border-[#15803d] group-hover:text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="font-display text-lg font-bold text-zinc-950">
              Luxury Property Fluency
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Trained on luxury off-plan developments, prime penthouses, and commercial assets.
              Understands architectural finishes, square footage, escrow terms, and neighborhood covenants.
            </p>
          </StaggerItem>

          <StaggerItem className="group p-7 rounded-3xl bg-zinc-50 border border-zinc-200/80 space-y-2.5 transition-[background-color,box-shadow,border-color] duration-300 hover:bg-white hover:border-[#15803d]/25 hover:shadow-[0_24px_40px_-24px_rgba(13,74,54,0.35)]">
            <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-[#15803d] mb-1 transition-colors duration-300 group-hover:bg-[#15803d] group-hover:border-[#15803d] group-hover:text-white">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="font-display text-lg font-bold text-zinc-950">
              Brokers Retain 100% Control
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              SpaciaOS does not replace your brokers — it empowers them. Live transcripts, instant alerts,
              and seamless calendar slotting ensure your team always maintains the human relationship.
            </p>
          </StaggerItem>

          <StaggerItem className="group p-7 rounded-3xl bg-zinc-50 border border-zinc-200/80 space-y-2.5 transition-[background-color,box-shadow,border-color] duration-300 hover:bg-white hover:border-[#15803d]/25 hover:shadow-[0_24px_40px_-24px_rgba(13,74,54,0.35)]">
            <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-[#15803d] mb-1 transition-colors duration-300 group-hover:bg-[#15803d] group-hover:border-[#15803d] group-hover:text-white">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-display text-lg font-bold text-zinc-950">
              Enterprise Privacy & Security
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              All client interactions and financial disclosures are protected by end-to-end encryption
              and strict institutional privacy safeguards.
            </p>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

export default AboutSection;
