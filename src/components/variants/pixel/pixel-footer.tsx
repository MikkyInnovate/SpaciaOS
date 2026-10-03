"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SpaciaLogo } from "@/components/brand/spacia-logo";
import { WAITLIST_HREF } from "./data";
import { BRAND_ICONS } from "@/components/brand/brand-icons";
import { fmt, useT } from "./i18n";
import type { Dict } from "./i18n/dict.en";

/* Footer in the Power Type Foundry layout (Design Brain, frame 3770):
   slim link columns up top, a rotating feature card on the right,
   a giant wordmark bottom-left, a spec list bottom-right, and a
   full-bleed image strip peeking out underneath. */

type FooterKey = keyof Dict["footer"];
type MarqueeKey = keyof Dict["marquee"]["items"];

const COLUMNS: { title: FooterKey; links: { label: FooterKey | { tool: MarqueeKey }; href: string }[]; soon?: boolean }[] = [
  {
    title: "product",
    links: [
      { label: "overview", href: `${WAITLIST_HREF}#perks` },
      { label: "howItWorks", href: `${WAITLIST_HREF}#how` },
      { label: "faq", href: `${WAITLIST_HREF}#faq` },
      { label: "privacy", href: "/privacy" },
    ],
  },
  {
    title: "access",
    links: [
      { label: "joinWaitlist", href: WAITLIST_HREF },
      { label: "howItWorks", href: `${WAITLIST_HREF}#how` },
    ],
  },
  {
    title: "worksWith",
    links: [
      { label: { tool: "whatsapp" }, href: `${WAITLIST_HREF}#how` },
      { label: { tool: "googleCalendar" }, href: `${WAITLIST_HREF}#how` },
      { label: { tool: "hubspot" }, href: `${WAITLIST_HREF}#how` },
    ],
    soon: true,
  },
];

// TODO: swap in SpaciaOS's real profile URLs
const SOCIALS = [
  { name: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/" },
  { name: "Instagram", icon: "instagram", href: "https://www.instagram.com/" },
  { name: "X", icon: "x", href: "https://x.com/" },
] as const;

// Property shots used nowhere else on the page
const FEATURE = [
  { src: "/images/homes/villa-pool.jpg", position: "50% 55%" },
  { src: "/images/homes/apartment-tower.jpg", position: "50% 40%" },
  { src: "/images/homes/living-room.jpg", position: "50% 50%" },
];

function FeatureCard() {
  const t = useT().footer;
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % FEATURE.length), 4200);
    return () => window.clearInterval(id);
  }, [reduce]);
  const shot = FEATURE[i];

  return (
    <div className="w-[340px] max-w-full">
      {/* preload every shot so the wipe never reveals an empty frame */}
      <div className="hidden" aria-hidden="true">
        {FEATURE.map((f) => (
          <Image key={f.src} src={f.src} alt="" width={340} height={212} loading="eager" />
        ))}
      </div>
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0d4a36]">
        <AnimatePresence initial={false}>
          <motion.div
            key={shot.src}
            className="absolute inset-0"
            initial={{ clipPath: "inset(0% 0% 100% 0%)", zIndex: 2 }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1, zIndex: 2 }}
            exit={{ zIndex: 1, opacity: 0, transition: { zIndex: { duration: 0 }, opacity: { delay: 1, duration: 0 } } }}
            transition={{ duration: 0.95, ease: [0.65, 0, 0.35, 1] }}
          >
            <Image src={shot.src} alt={t.featureAlts[i]} fill sizes="340px" loading="eager" className="object-cover" style={{ objectPosition: shot.position }} />
          </motion.div>
        </AnimatePresence>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[3] opacity-50 mix-blend-multiply"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(13,74,54,0.3) 0 1px, transparent 1px 4px)" }}
        />
        <span className="absolute bottom-2 left-2 z-[4] whitespace-nowrap bg-white/95 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-800">
          {t.featureCaption}
        </span>
      </div>
      <div className="mt-2 flex justify-end">
        <Link
          href={WAITLIST_HREF}
          className="inline-flex items-center gap-2 bg-zinc-950 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#15803d]"
        >
          {t.joinWaitlist} <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function PixelFooter() {
  const dict = useT();
  const t = dict.footer;
  return (
    <footer className="relative px-3 pb-28 pt-3 sm:px-5 sm:pb-36">
      {/* full-bleed image strip that peeks out underneath the card */}
      <div className="absolute inset-x-0 bottom-0 h-64 overflow-hidden sm:h-80" aria-hidden="true">
        <Image src="/images/homes/dusk-house.jpg" alt="" fill sizes="100vw" className="object-cover object-[50%_65%]" />
        <div
          className="absolute inset-0 opacity-60 mix-blend-multiply"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(13,74,54,0.35) 0 1px, transparent 1px 4px)" }}
        />
      </div>

      <div className="relative bg-white px-5 pb-8 pt-6 ring-1 ring-zinc-200 shadow-[0_30px_60px_-30px_rgba(6,20,15,0.45)] sm:mb-32 sm:px-10 sm:pb-10 sm:pt-8">
        {/* top row */}
        <div className="grid gap-10 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-10 sm:grid-cols-[auto_1fr] sm:gap-16">
            <Link href="/" aria-label={dict.common.homeAria} className="self-start">
              <SpaciaLogo className="text-[20px]" />
            </Link>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-12">
              {COLUMNS.map((col) => (
                <div key={col.title}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-950">{t[col.title]}</div>
                  <ul className="mt-3 space-y-1.5 text-[13px]">
                    {col.links.map((l, i) => (
                      <li key={i}>
                        <Link href={l.href} className="text-zinc-500 transition-colors hover:text-[#15803d]">
                          {typeof l.label === "string" ? t[l.label] : dict.marquee.items[l.label.tool]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {col.soon && (
                    <>
                      <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">{t.comingSoon}</div>
                      <ul className="mt-2 space-y-1.5 text-[13px]">
                        {t.soon.map((name) => (
                          <li key={name} className="flex items-center gap-2 text-zinc-400">
                            <span className="h-1.5 w-1.5 animate-pulse bg-[#22c55e]" aria-hidden="true" />
                            {name}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-8 lg:items-end">
            <FeatureCard />
          </div>
        </div>

        {/* bottom row */}
        <div className="mt-14 grid items-end gap-10 lg:mt-20 lg:grid-cols-[1fr_auto]">
          <div className="font-display text-[clamp(64px,13vw,200px)] font-light leading-[0.86] tracking-[-0.055em] text-[#14231d]">
            SpaciaOS
            <span className="mt-6 block font-mono text-[11px] font-normal uppercase leading-snug tracking-[0.18em] text-zinc-400 sm:text-[12px]">
              © {new Date().getFullYear()} {t.rights} ·{" "}
              <Link href="/privacy" className="underline-offset-4 hover:text-[#15803d] hover:underline">
                {t.privacy}
              </Link>
            </span>
          </div>
          <div className="w-full max-w-[340px]">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-950">
              <span className="h-1.5 w-1.5 rounded-full bg-[#15803d]" /> SpaciaOS
            </div>
            <ul className="mt-3 text-[13px] text-zinc-600">
              {t.specs.map((s) => (
                <li key={s} className="border-b border-zinc-200 py-2">
                  {s}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map(({ name, icon, href }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={fmt(t.socialAria, { name })}
                  className="group flex h-8 w-8 items-center justify-center ring-1 ring-zinc-200 transition-colors duration-300 hover:ring-zinc-400"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-zinc-400 transition-colors duration-300 group-hover:fill-zinc-900" aria-hidden="true">
                    <path d={BRAND_ICONS[icon].path} />
                  </svg>
                </a>
              ))}
            </div>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="mt-4 inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-[#15803d]"
            >
              {t.backToTop} <ArrowUp className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
