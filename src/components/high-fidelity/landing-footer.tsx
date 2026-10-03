"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function LandingFooter() {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const [subEmail, setSubEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail || !subEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subEmail }),
      });
      if (res.ok) {
        toast.success("Priority position reserved! Redirecting to queue status...");
        router.push(`/waitlist`);
      } else {
        const json = await res.json().catch(() => null);
        toast.error(json?.message || "We couldn't save your email. Please try again.");
      }
    } catch {
      toast.error("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    function fitWatermark() {
      if (!svgRef.current || !textRef.current) return;
      try {
        const bbox = textRef.current.getBBox();
        svgRef.current.setAttribute(
          "viewBox",
          `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
        );
      } catch {
        // Fallback gracefully if getBBox is not available
      }
    }

    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitWatermark);
    } else {
      fitWatermark();
    }

    window.addEventListener("resize", fitWatermark);
    return () => window.removeEventListener("resize", fitWatermark);
  }, []);

  return (
    <footer className="w-full bg-white pt-12 pb-6 px-4 sm:px-6 relative overflow-hidden">
      <section className="footer-section w-full max-w-[1150px] mx-auto relative">
        {/* =============================================================== */}
        {/* Main Footer Wrapper Grid                                        */}
        {/* =============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-4 items-stretch relative z-10">
          {/* ============================================================= */}
          {/* Left Card: Video Background & Brand Overview                  */}
          {/* ============================================================= */}
          <div className="relative min-h-[340px] rounded-[28px] p-8 overflow-hidden bg-[#0d4a36] shadow-[0_12px_40px_rgba(13,74,54,0.25)] flex flex-col justify-between">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster="/videos/footer-brand-poster.jpg"
              onLoadedMetadata={(e) => {
                e.currentTarget.play().catch(() => {});
              }}
              className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
              src="/videos/footer-brand.mp4"
            />

            {/* Logo */}
            <div className="flex flex-row items-center gap-2.5 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-white/15 border-[1.5px] border-white/85 flex items-center justify-center font-bold text-base text-white tracking-tight">
                S
              </div>
              <span className="font-bold text-[22px] text-white tracking-tight">
                SpaciaOS
              </span>
            </div>

            {/* Tagline */}
            <div className="mt-auto mb-7 relative z-10">
              <p className="text-[19px] font-normal text-white leading-[1.45]">
                Smarter sales automation,
                <br />
                <span className="text-white/65">powered by AI.</span>
              </p>
            </div>

            {/* Social Row */}
            <div className="flex flex-row justify-between items-center gap-3 relative z-10">
              <span className="font-caveat text-[17px] font-semibold text-white/90 tracking-[0.3px]">
                Stay in touch!
              </span>
              <div className="flex flex-row gap-2">
                {/* Discord */}
                <a
                  href="#"
                  aria-label="Discord"
                  className="w-9 h-9 rounded-[9px] bg-[#0e1014] flex items-center justify-center text-white shadow-[0_6px_18px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.2)] hover:bg-black hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-all duration-200"
                >
                  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] fill-current">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
                {/* X */}
                <a
                  href="#"
                  aria-label="X (Twitter)"
                  className="w-9 h-9 rounded-[9px] bg-[#0e1014] flex items-center justify-center text-white shadow-[0_6px_18px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.2)] hover:bg-black hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-all duration-200"
                >
                  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="w-9 h-9 rounded-[9px] bg-[#0e1014] flex items-center justify-center text-white shadow-[0_6px_18px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.2)] hover:bg-black hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-all duration-200"
                >
                  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] fill-current">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                {/* GitHub */}
                <a
                  href="#"
                  aria-label="GitHub"
                  className="w-9 h-9 rounded-[9px] bg-[#0e1014] flex items-center justify-center text-white shadow-[0_6px_18px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.2)] hover:bg-black hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-all duration-200"
                >
                  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] fill-current">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* Right Card: Navigation, Subscribe & Floating Lucky Badge      */}
          {/* ============================================================= */}
          <div className="bg-[#f0f1f5] rounded-[28px] p-6 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between relative overflow-visible">
            {/* Floating "Feeling lucky?" badge */}
            <div className="absolute -top-9 right-4 sm:right-10 z-20 hidden sm:flex flex-col items-start gap-1.5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] -rotate-10 bg-gradient-to-br from-[#34d399] via-[#15803d] to-[#0d4a36] shadow-[inset_3px_3px_8px_rgba(255,255,255,0.35),inset_-3px_-3px_12px_rgba(0,0,0,0.18),8px_14px_28px_rgba(13,74,54,0.35)] flex items-center justify-center">
                <span className="font-bold text-3xl sm:text-[42px] text-white tracking-tight rotate-10 [text-shadow:0_3px_6px_rgba(0,0,0,0.25)] leading-none select-none">
                  S
                </span>
              </div>
              <div className="flex flex-row items-center gap-1.5 -rotate-4 mt-1">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-zinc-400 stroke-current fill-none [stroke-width:2] [stroke-linecap:round] [stroke-linejoin:round]"
                >
                  <path d="M3 20 C 6 14, 10 9, 18 5" />
                  <path d="M18 5 L 12 5" />
                  <path d="M18 5 L 18 11" />
                </svg>
                <span className="font-caveat text-lg sm:text-[20px] font-semibold text-zinc-400 whitespace-nowrap">
                  Feeling lucky?
                </span>
              </div>
            </div>

            {/* Navigation Columns */}
            <div className="pt-2">
              <div className="flex flex-row gap-10 sm:gap-18">
                {/* Column 1: Navigation */}
                <div>
                  <div className="font-caveat text-2xl font-semibold italic text-zinc-400 mb-4.5">
                    Navigation
                  </div>
                    <div className="space-y-3.5">
                    <a
                      href="#how-it-works"
                      className="block text-sm font-semibold text-zinc-900 hover:text-[#15803d] transition-colors"
                    >
                      How It Works
                    </a>
                    <a
                      href="#about"
                      className="block text-sm font-semibold text-zinc-900 hover:text-[#15803d] transition-colors"
                    >
                      About SpaciaOS
                    </a>
                    <a
                      href="#testimonials"
                      className="block text-sm font-semibold text-zinc-900 hover:text-[#15803d] transition-colors"
                    >
                      Testimonials
                    </a>
                    <a
                      href="#pricing"
                      className="block text-sm font-semibold text-zinc-900 hover:text-[#15803d] transition-colors"
                    >
                      Pricing Plans
                    </a>
                    <Link
                      href="/waitlist"
                      className="block text-sm font-semibold text-zinc-900 hover:text-[#15803d] transition-colors"
                    >
                      VIP Waitlist
                    </Link>
                  </div>
                </div>

                {/* Column 2: Governance & Company */}
                <div>
                  <div className="font-caveat text-2xl font-semibold italic text-zinc-400 mb-4.5">
                    Company
                  </div>
                  <div className="space-y-3.5">
                    <a
                      href="#about"
                      className="block text-sm font-semibold text-zinc-900 hover:text-[#15803d] transition-colors"
                    >
                      About SpaciaOS
                    </a>
                    <Link
                      href="/waitlist#perks"
                      className="block text-sm font-semibold text-zinc-900 hover:text-[#15803d] transition-colors"
                    >
                      Founding Cohort
                    </Link>
                    <Link
                      href="#faq"
                      className="block text-sm font-semibold text-zinc-900 hover:text-[#15803d] transition-colors"
                    >
                      FAQ & Standards
                    </Link>
                    <a
                      href="#about"
                      className="block text-sm font-semibold text-zinc-900 hover:text-[#15803d] transition-colors"
                    >
                      Telephony SLA
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mt-12">
              <div className="text-[12.5px] font-medium text-zinc-400">
                © {new Date().getFullYear()} SpaciaOS Technologies Ltd. All rights reserved.
              </div>

              <div className="flex flex-col gap-3.5">
                <h4 className="text-[15px] font-normal text-zinc-500 leading-[1.45]">
                  AI moves fast.
                  <strong className="block text-[19px] font-bold text-zinc-900">
                    Stay ahead with SpaciaOS.
                  </strong>
                </h4>

                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-row w-full sm:w-[310px] bg-white border border-zinc-200 rounded-xl p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                >
                  <input
                    type="email"
                    required
                    value={subEmail}
                    onChange={(e) => setSubEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3.5 py-2.5 bg-transparent border-none outline-none text-[13.5px] text-zinc-900 placeholder:text-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-zinc-950 hover:bg-black text-white text-[13.5px] font-semibold rounded-lg shadow-[0_6px_20px_rgba(0,0,0,0.28),0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:-translate-y-px transition-all cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? "Joining..." : "Subscribe"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* Dynamic Watermark SVG: Fits to full container width             */}
        {/* =============================================================== */}
        <div
          className="w-full max-w-[1150px] -mt-14 mx-auto pointer-events-none select-none relative z-0 leading-none overflow-hidden"
          aria-hidden="true"
        >
          <svg
            ref={svgRef}
            id="watermarkSvg"
            viewBox="62 95 876 175"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-auto block overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              ref={textRef}
              id="watermarkText"
              x="500"
              y="240"
              textAnchor="middle"
              fontSize="320"
              className="font-bold tracking-[-0.03em] fill-black/[0.04]"
            >
              SpaciaOS
            </text>
          </svg>
        </div>
      </section>
    </footer>
  );
}

export default LandingFooter;
