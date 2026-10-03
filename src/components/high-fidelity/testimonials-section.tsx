"use client";

import React from "react";
import { Star, Quote } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";

const TESTIMONIALS = [
  {
    quote:
      "Spacia reduced our response time from 3 hours to under 3 seconds. In our first 60 days, verified property inspection bookings surged by 340% without hiring additional coordinators.",
    author: "Babatunde Adeleke",
    role: "Senior Partner",
    company: "Eko Atlantic Luxury Developments",
    metric: "+340% Viewings Booked",
    avatar: "BA",
  },
  {
    quote:
      "The voice telephony is remarkably natural and sophisticated. Our high-net-worth buyers receive immediate, articulate answers, and our brokers only meet serious, pre-qualified decision makers.",
    author: "Claire Kensington",
    role: "Head of Private Client Sales",
    company: "Mayfair & Prime Real Estate",
    metric: "<3s Response Time",
    avatar: "CK",
  },
  {
    quote:
      "Eliminating double-bookings and WhatsApp phone tag transformed our deal velocity. Deals that used to stall for weeks now lock into inspection slots within ten minutes of initial portal inquiry.",
    author: "Dr. Folake Alabi",
    role: "Managing Director",
    company: "Ikoyi Waterfront Residences",
    metric: "100% Calendar Lockout",
    avatar: "FA",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-24">
      <Reveal className="text-center max-w-2xl mx-auto mb-16 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full inline-block">
          Testimonials
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
          Trusted by premier developers and luxury brokerages.
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
          See how leading real estate teams accelerate deal flow and eliminate lead leakage with SpaciaOS.
        </p>
      </Reveal>

      <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <StaggerItem
            key={t.author}
            className="rounded-3xl bg-white border border-zinc-200/80 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-[#15803d]/25 hover:shadow-[0_24px_40px_-24px_rgba(13,74,54,0.35)] transition-[border-color,box-shadow] duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  {t.metric}
                </span>
              </div>

              <p className="text-sm text-zinc-700 leading-relaxed italic">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            <div className="pt-6 border-t border-zinc-100 flex items-center gap-3.5 mt-6">
              <div className="w-10 h-10 rounded-full bg-zinc-900 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                {t.avatar}
              </div>
              <div>
                <div className="font-semibold text-sm text-zinc-950">
                  {t.author}
                </div>
                <div className="text-xs text-zinc-500">
                  {t.role}, {t.company}
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

export default TestimonialsSection;
