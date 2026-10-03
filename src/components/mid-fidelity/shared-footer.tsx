"use client";

import Link from "next/link";
import { ShieldCheck, Activity, Terminal } from "lucide-react";

export function SharedFooter() {
  return (
    <footer className="w-full bg-[#f4f4f5]/60 border-t border-[#e8e8e6] pt-16 pb-12 text-stone-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#e8e8e6]">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#18181b] flex items-center justify-center text-white font-display font-bold text-xs shadow-2xs">
                S
              </div>
              <span className="font-display font-bold text-base tracking-tight text-[#18181b]">
                Spacia<span className="text-[#0d4a36]">OS</span>
              </span>
            </div>
            <p className="text-stone-500 max-w-sm leading-relaxed">
              Managed autonomous AI sales system purpose-built for premier real estate firms,
              brokerages, and property developers. Sub-second voice qualification, underwriting,
              and inspection scheduling.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-stone-200 text-[11px] font-mono text-stone-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational • Telephony Latency &lt;450ms</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-stone-900 tracking-tight text-xs uppercase font-mono">
              Product & Flow
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-stone-900 transition-colors">
                  Overview & Engine
                </Link>
              </li>
              <li>
                <a href="/#simulation" className="hover:text-stone-900 transition-colors">
                  Cockpit Simulation
                </a>
              </li>
              <li>
                <a href="/#architecture" className="hover:text-stone-900 transition-colors">
                  Bento Architecture
                </a>
              </li>
              <li>
                <a href="/#booking" className="hover:text-stone-900 transition-colors">
                  Inspection Booking
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-stone-900 tracking-tight text-xs uppercase font-mono">
              Access & Cohort
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/waitlist" className="text-[#0d4a36] font-semibold hover:underline">
                  VIP Waitlist Intake
                </Link>
              </li>
              <li>
                <a href="/waitlist#privileges" className="hover:text-stone-900 transition-colors">
                  Founding Privileges
                </a>
              </li>
              <li>
                <a href="/waitlist#faq" className="hover:text-stone-900 transition-colors">
                  Frequently Answered
                </a>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-stone-900 transition-colors">
                  Operator Login
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-stone-900 tracking-tight text-xs uppercase font-mono">
              Governance & Trust
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5 text-stone-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Customer PII in Telemetry</span>
              </li>
              <li className="text-stone-500">NDPR & GDPR Aligned</li>
              <li className="text-stone-500">Vapi Telephony Encryption</li>
              <li className="text-stone-500">Multi-tenant Row Isolation</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <p>© {new Date().getFullYear()} Spacia Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono">LAGOS • LONDON • SAN FRANCISCO</span>
            <span>•</span>
            <span className="font-mono">ARCHITECTURAL EDITION</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
