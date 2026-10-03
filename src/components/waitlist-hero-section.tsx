"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface LogoItem {
  name: string;
  src: string;
  gradient: {
    from: string;
    to: string;
  };
}

const LOGO_LIST: LogoItem[] = [
  {
    name: "Salesforce",
    src: "https://svgl.app/library/salesforce.svg",
    gradient: { from: "#15803d", to: "#0d4a36" },
  },
  {
    name: "Google",
    src: "https://svgl.app/library/google.svg",
    gradient: { from: "#22c55e", to: "#15803d" },
  },
  {
    name: "Microsoft",
    src: "https://svgl.app/library/microsoft.svg",
    gradient: { from: "#166534", to: "#14532d" },
  },
  {
    name: "Meta",
    src: "https://svgl.app/library/meta.svg",
    gradient: { from: "#059669", to: "#047857" },
  },
  {
    name: "OpenAI",
    src: "https://svgl.app/library/openai.svg",
    gradient: { from: "#10a37f", to: "#059669" },
  },
  {
    name: "Twilio",
    src: "https://svgl.app/library/twilio.svg",
    gradient: { from: "#27272a", to: "#18181b" },
  },
  {
    name: "Apple",
    src: "https://svgl.app/library/apple.svg",
    gradient: { from: "#18181b", to: "#09090b" },
  },
  {
    name: "Slack",
    src: "https://svgl.app/library/slack.svg",
    gradient: { from: "#15803d", to: "#0d4a36" },
  },
];

export function WaitlistHeroSection() {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="w-full pt-24 sm:pt-28 pb-6 md:pb-8 px-4 sm:px-6 lg:px-8">
      {/* ================================================================= */}
      {/* 1. Main Hero Container & Video Background                         */}
      {/* ================================================================= */}
      <section className="relative w-full max-w-[1400px] mx-auto rounded-[48px] bg-white border border-slate-200/50 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] overflow-hidden h-[600px] flex flex-col">
        {/* Underlying video background layer (identical to landing hero) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/videos/hero-brand-poster.jpg"
            onLoadedMetadata={(e) => {
              e.currentTarget.play().catch(() => {});
            }}
            onEnded={(e) => {
              e.currentTarget.currentTime = 0;
              e.currentTarget.play().catch(() => {});
            }}
            className="w-full h-full object-cover scale-105 transition-transform duration-1000"
            src="/videos/hero-brand.mp4"
          />
        </div>

        {/* =============================================================== */}
        {/* 2. Hero Text Content Wrapper                                     */}
        {/* =============================================================== */}
        <div className="relative z-20 flex-1 px-8 md:px-16 pt-12 md:pt-16 flex flex-col items-start">
          <div className="max-w-2xl flex flex-col items-start animate-in fade-in slide-in-from-bottom-3 duration-700">
            {/* Category Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-md text-[11px] font-mono text-slate-700 mb-4 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
              <span>FOUNDING COHORT // Q4 2026 ACCESS</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-[42px] md:text-[56px] font-medium tracking-tight text-zinc-950 leading-[1.08]">
              Reserve priority access
              <br />
              to autonomous sales orchestration
            </h1>

            {/* Subtitle */}
            <p className="font-sans text-[14px] md:text-[15px] text-slate-500 mt-5 max-w-xl leading-relaxed">
              We are onboarding premier real estate brokerages and developers in curated batches
              to guarantee bespoke neural voice tuning and sub-second telephony SLA.
            </p>

            {/* CTA Button anchoring directly to Intake Form */}
            <a href="#intake">
              <button
                type="button"
                className="mt-7 md:mt-8 px-6 py-3 rounded-full bg-zinc-950 text-white text-[14px] font-medium transition-all duration-300 hover:bg-[#15803d] hover:shadow-[0_6px_22px_rgba(21,128,61,0.38)] cursor-pointer inline-flex items-center gap-2 group/hero-btn"
              >
                <span>Reserve Priority Position</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover/hero-btn:translate-x-0.5 group-hover/hero-btn:text-white transition-all duration-200" />
              </button>
            </a>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 3. Primary Hero Navbar (Rounded Pill, Apple iOS Glass)          */}
        {/* =============================================================== */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-auto max-w-[92%]">
          <nav className="rounded-full flex items-center justify-between border border-zinc-200/60 border-t-white/95 bg-white/80 backdrop-blur-2xl backdrop-saturate-200 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] px-2.5 py-1.5 sm:px-3 sm:py-2 gap-2 sm:gap-5 animate-in fade-in duration-500">
            {/* Brand Logo & Name */}
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 group select-none pl-1"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-white font-mono text-xs font-bold shadow-xs group-hover:bg-[#15803d] transition-all duration-300">
                S
              </div>
              <span className="font-semibold text-sm tracking-tight text-zinc-950 whitespace-nowrap hidden sm:inline-block pr-1">
                SpaciaOS
              </span>
            </Link>

            {/* Navigation Anchor Links */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors whitespace-nowrap"
              >
                Overview
              </Link>
              <a
                href="#cohort"
                className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors whitespace-nowrap"
              >
                Cohort Perks
              </a>
              <a
                href="#faq"
                className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors whitespace-nowrap hidden sm:inline-block"
              >
                FAQ
              </a>
              <Link
                href="/#pricing"
                className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors whitespace-nowrap hidden sm:inline-block"
              >
                Pricing
              </Link>
              <Link
                href="/sign-in"
                className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors whitespace-nowrap hidden sm:inline-block"
              >
                Sign In
              </Link>
            </div>

            {/* Action Button */}
            <a href="#intake" className="shrink-0">
              <div className="group/btn relative rounded-full bg-zinc-950 hover:bg-[#15803d] text-white px-5 sm:px-6 py-2.5 text-xs sm:text-[14px] font-medium shadow-sm hover:shadow-[0_6px_22px_rgba(21,128,61,0.38)] flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <span className="whitespace-nowrap transition-transform duration-200">
                  Reserve Seat
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all duration-200" />
              </div>
            </a>
          </nav>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. Seamless Marquee Logo Scroller Component (mt-10)                 */}
      {/* =================================================================== */}
      <div className="mt-10 relative w-full max-w-[1400px] mx-auto overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] py-2">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {/* First loop of 8 items */}
          <div className="flex items-center gap-5 pr-5 shrink-0">
            {LOGO_LIST.map((logo) => (
              <div
                key={`loop-1-${logo.name}`}
                className="group relative h-24 w-40 shrink-0 flex items-center justify-center rounded-full bg-white border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all overflow-hidden cursor-pointer"
              >
                <div
                  className="absolute inset-0 scale-150 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${logo.gradient.from}, ${logo.gradient.to})`,
                  }}
                />
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="relative z-10 h-7 w-auto max-w-[80px] object-contain transition-all duration-300 group-hover:brightness-0 group-hover:invert select-none"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {/* Second loop of 8 items for seamless infinite scroll */}
          <div className="flex items-center gap-5 pr-5 shrink-0" aria-hidden="true">
            {LOGO_LIST.map((logo) => (
              <div
                key={`loop-2-${logo.name}`}
                className="group relative h-24 w-40 shrink-0 flex items-center justify-center rounded-full bg-white border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all overflow-hidden cursor-pointer"
              >
                <div
                  className="absolute inset-0 scale-150 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${logo.gradient.from}, ${logo.gradient.to})`,
                  }}
                />
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="relative z-10 h-7 w-auto max-w-[80px] object-contain transition-all duration-300 group-hover:brightness-0 group-hover:invert select-none"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WaitlistHeroSection;
