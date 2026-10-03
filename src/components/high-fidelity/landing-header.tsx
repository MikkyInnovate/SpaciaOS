"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Workflow, Info, MessageSquareQuote, CreditCard } from "lucide-react";

export function LandingHeader() {
  const pathname = usePathname();
  const isWaitlist = pathname === "/waitlist";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    function updateScroll() {
      const y = window.scrollY;
      setScrolled((prev) => {
        // Hysteresis dead-band: reveal floating capsule only once hero nav scrolls off screen
        if (!prev && y > 480) return true;
        if (prev && y < 440) return false;
        return prev;
      });
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    }

    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header
        className={`rounded-full flex items-center justify-between border border-zinc-200/60 border-t-white/95 bg-white/80 backdrop-blur-2xl backdrop-saturate-200 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isWaitlist
            ? scrolled
              ? "w-auto max-w-[92%] px-2.5 py-1.5 sm:px-3 sm:py-2 gap-2 sm:gap-4 opacity-100 translate-y-0 pointer-events-auto"
              : "w-auto max-w-[92%] px-2.5 py-1.5 sm:px-3 sm:py-2 gap-2 sm:gap-4 opacity-0 -translate-y-8 pointer-events-none"
            : scrolled
            ? "w-full max-w-[460px] px-2.5 py-1.5 gap-2 opacity-100 translate-y-0 pointer-events-auto"
            : "w-full max-w-[460px] px-2.5 py-1.5 gap-2 opacity-0 -translate-y-8 pointer-events-none"
        }`}
      >
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 group select-none pl-1"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-white font-mono text-xs font-bold shadow-xs group-hover:bg-[#15803d] transition-all duration-300">
            S
          </div>
          <span className={`font-semibold text-sm tracking-tight text-zinc-950 whitespace-nowrap transition-all duration-300 ${
            !isWaitlist && !scrolled ? "hidden sm:inline-block pr-1" : "hidden sm:inline-block pr-1"
          }`}>
            SpaciaOS
          </span>
        </Link>

        {/* Navigation Items */}
        {!isWaitlist ? (
          <nav className="flex items-center gap-1 sm:gap-1.5">
            <a
              href="#how-it-works"
              title="How It Works"
              className="px-2.5 py-1.5 rounded-full text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <Workflow className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
              <span
                className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  scrolled
                    ? "max-w-0 opacity-0 hidden md:hidden"
                    : "max-w-[100px] opacity-100"
                }`}
              >
                How It Works
              </span>
            </a>

            <a
              href="#about"
              title="About"
              className="px-2.5 py-1.5 rounded-full text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <Info className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
              <span
                className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  scrolled
                    ? "max-w-0 opacity-0 hidden md:hidden"
                    : "max-w-[60px] opacity-100"
                }`}
              >
                About
              </span>
            </a>

            <a
              href="#testimonials"
              title="Testimonials"
              className="px-2.5 py-1.5 rounded-full text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <MessageSquareQuote className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
              <span
                className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  scrolled
                    ? "max-w-0 opacity-0 hidden md:hidden"
                    : "max-w-[90px] opacity-100"
                }`}
              >
                Testimonials
              </span>
            </a>

            <a
              href="#pricing"
              title="Pricing"
              className="px-2.5 py-1.5 rounded-full text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <CreditCard className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
              <span
                className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  scrolled
                    ? "max-w-0 opacity-0 hidden md:hidden"
                    : "max-w-[70px] opacity-100"
                }`}
              >
                Pricing
              </span>
            </a>
          </nav>
        ) : (
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors whitespace-nowrap"
            >
              Overview
            </Link>
            <Link
              href="/#how-it-works"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors whitespace-nowrap hidden sm:inline-block"
            >
              How It Works
            </Link>
            <a
              href="#cohort"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors whitespace-nowrap"
            >
              Cohort Perks
            </a>
            <a
              href="#faq"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors whitespace-nowrap hidden md:inline-block"
            >
              FAQ
            </a>
            <Link
              href="/#pricing"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04] transition-colors whitespace-nowrap hidden sm:inline-block"
            >
              Pricing
            </Link>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href="/sign-in"
            className={`text-xs font-medium text-zinc-600 hover:text-zinc-950 px-2 py-1.5 transition-colors whitespace-nowrap rounded-full ${
              scrolled && !isWaitlist ? "hidden" : "hidden sm:inline-block"
            }`}
          >
            Sign In
          </Link>

          {/* Primary Action Button (Rounded Full, Brand Green Hover with Sleek Interaction) */}
          {!isWaitlist ? (
            <Link href="/waitlist">
              <div
                className={`group/btn relative rounded-full bg-zinc-950 hover:bg-[#15803d] text-white font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm hover:shadow-[0_6px_22px_rgba(21,128,61,0.38)] flex items-center justify-center gap-1.5 cursor-pointer ${
                  scrolled
                    ? "px-3.5 py-1.5 text-xs"
                    : "px-6 py-2.5 text-[14px]"
                }`}
              >
                <span className="whitespace-nowrap">Join Waitlist</span>
                <ChevronRight
                  className={`transition-all duration-200 group-hover/btn:translate-x-0.5 text-zinc-400 group-hover/btn:text-white ${
                    scrolled ? "w-3 h-3" : "w-3.5 h-3.5"
                  }`}
                />
              </div>
            </Link>
          ) : (
            <a href="#intake">
              <div className="group/btn relative rounded-full bg-zinc-950 hover:bg-[#15803d] text-white px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-medium shadow-sm hover:shadow-[0_6px_22px_rgba(21,128,61,0.38)] flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <span className="whitespace-nowrap">Reserve Seat</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all duration-200" />
              </div>
            </a>
          )}
        </div>
      </header>
    </div>
  );
}

export default LandingHeader;
