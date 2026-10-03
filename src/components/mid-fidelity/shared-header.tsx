"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export function SharedHeader() {
  const pathname = usePathname();
  const isWaitlist = pathname === "/waitlist";

  return (
    <header className="w-full bg-[#fbfbfa]/95 backdrop-blur-md border-b border-[#e8e8e6] sticky top-[37px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Architecture Pill */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-[#18181b] flex items-center justify-center text-white font-display font-bold text-sm tracking-wider shadow-2xs group-hover:bg-[#0d4a36] transition-colors">
              S
            </div>
            <span className="font-display font-bold text-base tracking-tight text-[#18181b]">
              SpaciaOS<span className="text-[#0d4a36]">OS</span>
            </span>
          </Link>
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-[10px] font-mono text-stone-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>v0.9.4 Beta</span>
          </div>
        </div>

        {/* Navigation Anchors */}
        {!isWaitlist ? (
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-600">
            <a href="#system" className="hover:text-stone-900 transition-colors">
              Autonomous System
            </a>
            <a href="#simulation" className="hover:text-stone-900 transition-colors">
              Live Cockpit
            </a>
            <a href="#architecture" className="hover:text-stone-900 transition-colors">
              Bento Architecture
            </a>
            <a href="#booking" className="hover:text-stone-900 transition-colors">
              Inspection Sync
            </a>
            <Link href="/waitlist" className="text-[#0d4a36] font-semibold hover:underline">
              VIP Waitlist
            </Link>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-600">
            <Link href="/" className="hover:text-stone-900 transition-colors">
              ← Back to Overview
            </Link>
            <a href="#privileges" className="hover:text-stone-900 transition-colors">
              Cohort Privileges
            </a>
            <a href="#faq" className="hover:text-stone-900 transition-colors">
              Frequently Answered
            </a>
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-xs font-medium text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-md hover:bg-stone-100 transition-colors"
          >
            Sign In
          </Link>

          {!isWaitlist ? (
            <Link
              href="/waitlist"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#18181b] hover:bg-[#0d4a36] text-white text-xs font-medium shadow-2xs transition-colors"
            >
              <span>Join Waitlist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <a
              href="#intake"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0d4a36] hover:bg-[#093829] text-white text-xs font-medium shadow-2xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Claim Priority</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
