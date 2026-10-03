"use client";

import React from "react";
import { PhoneCall, ShieldCheck, CalendarCheck } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";

const STEPS = [
  {
    step: "01",
    title: "Instant Inbound Response",
    subtitle: "Under 3 Seconds",
    desc: "When a prospective buyer inquires on your website, listing portals, or WhatsApp, SpaciaOS initiates an immediate, natural voice call before interest cools.",
    icon: PhoneCall,
    highlight: "24/7/365 availability across all time zones",
  },
  {
    step: "02",
    title: "Discreet Buyer Qualification",
    subtitle: "High-Net-Worth Vetting",
    desc: "Conducts an articulate, conversational assessment to verify liquid budget readiness, purchasing timeline, and decision-maker authority with zero friction.",
    icon: ShieldCheck,
    highlight: "Filters out unvetted inquiries automatically",
  },
  {
    step: "03",
    title: "Direct Calendar Booking",
    subtitle: "Confirmed Private Walkthroughs",
    desc: "Instantly locks verified viewing appointments directly onto your senior brokers' Google or Outlook calendars, complete with gate passes and briefing notes.",
    icon: CalendarCheck,
    highlight: "Zero double-bookings, zero phone tag",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-24">
      <Reveal className="text-center max-w-2xl mx-auto mb-16 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full inline-block">
          How It Works
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
          From first buyer inquiry to confirmed viewing in minutes.
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
          SpaciaOS replaces manual follow-up delays with autonomous conversational precision,
          ensuring high-net-worth buyers receive immediate, executive attention.
        </p>
      </Reveal>

      <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <StaggerItem
              key={item.step}
              className="group relative rounded-3xl bg-white border border-zinc-200/70 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-[#15803d]/30 hover:shadow-[0_24px_40px_-24px_rgba(13,74,54,0.35)] transition-[border-color,box-shadow] duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-bold text-zinc-400">
                    PHASE // {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center text-zinc-900 group-hover:bg-[#15803d] group-hover:border-[#15803d] group-hover:text-white transition-colors duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="text-xs font-medium text-emerald-700 mb-1">
                  {item.subtitle}
                </div>
                <h3 className="font-display text-xl font-bold text-zinc-950 tracking-tight mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed mb-6">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs font-medium text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>{item.highlight}</span>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}

export default HowItWorksSection;
