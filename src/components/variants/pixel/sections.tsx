"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Minus } from "lucide-react";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { LabSkyline } from "./skyline/lab-skyline";
import { SpeedToLeadScene } from "./speed-to-lead-scene";
import { PixelBlocks } from "./pixel-blocks";
import { HeroStatus } from "./hero-status";
import { HumanPhoto } from "./human-photo";
import { DrawLine, EnterGroup, EnterItem } from "./enter";
import { PHOTOS, WAITLIST_HREF, withAlts } from "./data";
import { SpaciaLogo } from "@/components/brand/spacia-logo";
import { FaqAside } from "./faq-aside";
import { FaqAccordion } from "./faq-accordion";
import { PlanPrice, type PlanId } from "./pricing-currency";
import { useT } from "./i18n";
import type { Dict } from "./i18n/dict.en";
import { CallLink } from "./call-link";

/* Shared bits ------------------------------------------------------- */

export const DOTS: React.CSSProperties = {
  backgroundImage: "radial-gradient(rgba(13,74,54,0.22) 1px, transparent 1px)",
  backgroundSize: "12px 12px",
};

export const GRID: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(13,74,54,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(13,74,54,0.08) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
};

export function Label({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`font-mono text-[11px] uppercase tracking-[0.14em] ${dark ? "text-[#86efac]" : "text-[#15803d]"}`}>
      [ {children} ]
    </span>
  );
}

export const SQUARE_PRIMARY =
  "inline-flex items-center gap-2 bg-zinc-950 px-5 py-3 font-mono text-[12px] uppercase tracking-[0.12em] text-white";
export const SQUARE_GHOST =
  "inline-flex items-center gap-2 bg-white px-5 py-3 font-mono text-[12px] uppercase tracking-[0.12em] text-zinc-800 ring-1 ring-zinc-300 transition-colors duration-300 hover:ring-[#15803d] hover:text-[#15803d]";

/* Nav ---------------------------------------------------------------- */

export type NavLink = { href: string; key: keyof Dict["nav"] };

const NAV_LINKS: readonly NavLink[] = [
  { href: "#system", key: "product" },
  { href: "#process", key: "howItWorks" },
  { href: "#pricing-grid", key: "pricing" },
  { href: "#faq-grid", key: "faq" },
];

export function PixelNav({
  links = NAV_LINKS,
  ctaHref = WAITLIST_HREF,
  homeHref = "/",
}: {
  links?: readonly NavLink[];
  ctaHref?: string;
  homeHref?: string;
}) {
  const t = useT();
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-10">
      <Link href={homeHref} aria-label={t.common.homeAria}>
        <SpaciaLogo className="text-[19px]" />
      </Link>
      <nav className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 md:flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-zinc-950">
            {t.nav[l.key]}
          </Link>
        ))}
      </nav>
      <CallLink href={ctaHref} className="inline-flex items-center bg-zinc-950 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white">
        {t.common.joinWaitlist}
      </CallLink>
    </header>
  );
}

/* Hero --------------------------------------------------------------- */

export function PixelHero() {
  const t = useT();
  return (
    <section className="relative overflow-hidden border-b border-zinc-200">
      <div className="pointer-events-none relative z-10 px-5 pb-10 pt-10 sm:px-10 sm:pt-16">
        <Reveal className="pointer-events-auto">
          <HeroStatus label={t.hero.statusLabel} feed={t.hero.feed} />
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="font-display mt-6 max-w-[12.5em] text-balance text-[clamp(36px,4.4vw,60px)] font-light leading-[1.02] tracking-[-0.04em] text-[#14231d]">
            {t.hero.title}
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-zinc-500">
            {t.hero.body}
          </p>
        </Reveal>
        <Reveal delay={0.24} className="pointer-events-auto mt-8 flex flex-wrap gap-3">
          <CallLink href={WAITLIST_HREF} className={SQUARE_PRIMARY}>
            {t.common.joinTheWaitlist} <ArrowRight className="h-3.5 w-3.5" />
          </CallLink>
          <a href="#process" className={SQUARE_GHOST}>
            {t.common.seeHow}
          </a>
        </Reveal>
      </div>

      {/* Signature: scanline skyline assembling from the ground up */}
      <div className="relative -mt-16 sm:-mt-60">
        <LabSkyline mode="drone-life" className="h-[300px] w-full sm:h-[560px]" />
      </div>
    </section>
  );
}

/* Integrations ticker ------------------------------------------------ */

/* Pixel-mask feature + stats ----------------------------------------- */

const STATS: { to: number; prefix?: string; suffix?: string }[] = [
  { to: 3, prefix: "<", suffix: "s" },
  { to: 24, suffix: "/7" },
  { to: 5 },
  { to: 1, suffix: "-tap" },
];

export function PixelSystem() {
  const t = useT();
  return (
    <section id="system" className="scroll-mt-4 px-5 py-16 sm:px-10 sm:py-24">
      <EnterGroup stagger={0.12}>
        <EnterItem
          from="scale"
          className="relative overflow-hidden bg-[#eceee9] p-5 ring-1 ring-zinc-200 sm:p-10 lg:min-h-[580px]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(13,74,54,0.16) 1px, transparent 1px), repeating-linear-gradient(0deg, rgba(13,74,54,0.035) 0 1px, transparent 1px 6px)",
            backgroundSize: "12px 12px, auto",
          }}
        >
          <EnterGroup className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start" stagger={0.14} delay={0.25}>
            <div>
              <h2 className="font-display text-[36px] font-light leading-[1.02] tracking-[-0.035em] text-[#14231d] sm:text-[48px]">
                <EnterItem className="overflow-hidden">{t.system.title1}</EnterItem>
                <EnterItem className="overflow-hidden">{t.system.title2}</EnterItem>
              </h2>
              <EnterItem from="left">
                <span className="mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-[#15803d]">
                  {t.system.sub}
                </span>
              </EnterItem>
            </div>
            <EnterItem from="wipe" className="w-full sm:w-[360px]">
            <HumanPhoto
              shots={withAlts(PHOTOS.buyer, t.photos.buyer)}
              sizes="(min-width: 640px) 360px, 100vw"
              className="aspect-[16/10] w-full"
            >
              <p className="absolute inset-x-3 bottom-3 bg-white/95 p-2.5 text-[12px] leading-snug text-zinc-700">
                <span className="font-semibold text-zinc-950">{t.system.captionBold}</span> {t.system.caption}
              </p>
            </HumanPhoto>
            </EnterItem>
          </EnterGroup>
          <div className="mt-8 sm:mt-10">
            <SpeedToLeadScene />
          </div>
        </EnterItem>
      </EnterGroup>

      <Stagger className="mt-px grid grid-cols-2 border-l border-t border-zinc-200 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <StaggerItem key={i} className="relative border-b border-r border-zinc-200 bg-white p-5 sm:p-7">
            <div className="absolute inset-0 opacity-60" style={DOTS} aria-hidden="true" />
            <div className="relative font-mono text-[34px] font-medium tracking-tight text-zinc-950 sm:text-[48px]">
              <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix === "-tap" ? t.system.tapSuffix : s.suffix} />
            </div>
            <div className="relative mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#15803d]">{t.system.stats[i]}</div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* Process: blueprint cards ------------------------------------------- */

/** 5×5 pixel icon whose lit cells light up in a clockwise loop, forever. */
export function Glyph({ cells }: { cells: string }) {
  const lit = cells
    .split("")
    .map((c, i) => ({ c, i, a: Math.atan2(Math.floor(i / 5) - 2, (i % 5) - 2) }))
    .filter((d) => d.c === "1")
    .sort((p, q) => p.a - q.a || p.i - q.i)
    .map((d) => d.i);
  const step = 0.14;
  const cycle = lit.length * step + 0.8;

  return (
    <span className="grid h-10 w-10 grid-cols-5 gap-[2px]" aria-hidden="true">
      {cells.split("").map((c, i) => {
        if (c !== "1") return <span key={i} className="bg-[#15803d]/10" />;
        const order = lit.indexOf(i);
        return (
          <span
            key={i}
            className="glyph-cell bg-[#15803d]"
            style={{ animationDuration: `${cycle.toFixed(2)}s`, animationDelay: `${(order * step - cycle).toFixed(2)}s` }}
          />
        );
      })}
    </span>
  );
}

const STEPS = [
  {
    n: "01",
    glyph: "0111010001100011000101110",
  },
  {
    n: "02",
    glyph: "0000100010101000100000000",
  },
  {
    n: "03",
    glyph: "1111110001101011000111111",
  },
  {
    n: "04",
    glyph: "0010001110111110111000100",
  },
];

export function PixelProcess() {
  const t = useT();
  return (
    <section id="process" className="relative scroll-mt-4 border-y border-zinc-200 bg-white px-5 py-16 sm:px-10 sm:py-24" style={GRID}>
      <EnterGroup className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-end" stagger={0.12}>
        <div>
          <EnterItem from="left">
            <Label>{t.process.label}</Label>
          </EnterItem>
          <EnterItem>
            <h2 className="font-display mt-4 text-[34px] font-light leading-[1.05] tracking-[-0.035em] text-[#14231d] sm:text-[42px]">
              {t.process.title}
            </h2>
          </EnterItem>
        </div>
        <EnterItem from="right">
          <p className="max-w-md text-[15px] leading-relaxed text-zinc-500 lg:justify-self-end">
            {t.process.body}
          </p>
        </EnterItem>
      </EnterGroup>

      {/* a rule draws across, then the four steps build in left to right like a pipeline */}
      <EnterGroup className="mt-12" stagger={0.13}>
        <DrawLine className="bg-[#15803d]" />
        <div className="grid gap-px bg-zinc-200 ring-1 ring-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <EnterItem
              key={s.n}
              className="group flex min-h-[170px] flex-col justify-between gap-8 bg-[#f7f7f5] p-6 transition-colors duration-300 hover:bg-white sm:min-h-[260px]"
            >
              <EnterGroup nested className="flex items-start justify-between" stagger={0.08}>
                <EnterItem from="left">
                  <span className="font-mono text-[13px] text-zinc-500">
                    {s.n} / <span className="text-zinc-950">{t.process.steps[i].title}</span>
                  </span>
                </EnterItem>
                <EnterItem from="pixel">
                  <Glyph cells={s.glyph} />
                </EnterItem>
              </EnterGroup>
              <p className="text-[14px] leading-relaxed text-zinc-600">{t.process.steps[i].body}</p>
            </EnterItem>
          ))}
        </div>
      </EnterGroup>
    </section>
  );
}

/* Features: Plasma split panel --------------------------------------- */

export function PixelFeatures() {
  const t = useT();
  return (
    <section className="px-5 py-16 sm:px-10 sm:py-24">
      <EnterGroup className="grid items-stretch overflow-hidden lg:grid-cols-[0.8fr_1.2fr]" stagger={0.15}>
        <EnterItem from="wipe" className="h-full">
        <HumanPhoto
          shots={withAlts(PHOTOS.buyers, t.photos.buyers)}
          className="h-72 sm:h-96 lg:h-full lg:min-h-[520px]"
        >
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 bg-white/95 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-800">
            <span className="h-2 w-2 bg-[#22c55e]" /> {t.features.booked}
          </span>
        </HumanPhoto>
        </EnterItem>
        <EnterItem from="wipeLeft" className="relative bg-[#0d4a36] p-7 text-white sm:p-12">
          <div className="absolute inset-0 opacity-30" style={{ ...DOTS, backgroundImage: "radial-gradient(rgba(134,239,172,0.35) 1px, transparent 1px)" }} aria-hidden="true" />
          <EnterGroup nested className="relative" stagger={0.09} delay={0.45}>
            <EnterItem from="left">
              <Label dark>{t.features.label}</Label>
            </EnterItem>
            <EnterItem>
              <h2 className="font-display mt-4 max-w-md text-[32px] font-light leading-[1.05] tracking-[-0.035em] sm:text-[44px]">
                {t.features.title}
              </h2>
            </EnterItem>
            <EnterItem>
              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-emerald-100/80">
                {t.features.body}
              </p>
            </EnterItem>
            <ul className="mt-8 space-y-3">
              {t.features.items.map((f) => (
                <li key={f}>
                  <DrawLine className="bg-white/10" />
                  <EnterItem from="right" className="flex items-start gap-3 pt-3 text-[14px]">
                    <span className="mt-1 h-2 w-2 shrink-0 bg-[#22c55e]" />
                    {f}
                  </EnterItem>
                </li>
              ))}
            </ul>
          </EnterGroup>
        </EnterItem>
      </EnterGroup>
    </section>
  );
}

/* Pricing ------------------------------------------------------------ */

// Tiers per the SpaciaOS business model: managed AI sales system, monthly fee + PAYG usage
const PLANS: { id: PlanId; featured: boolean }[] = [
  { id: "starter", featured: false },
  { id: "growth", featured: true },
  { id: "scale", featured: false },
];

export function PixelPricing() {
  const t = useT();
  return (
    <section id="pricing-grid" className="scroll-mt-4 border-t border-zinc-200 bg-white px-5 py-16 sm:px-10 sm:py-24">
      <EnterGroup className="flex flex-col justify-between gap-4 md:flex-row md:items-end" stagger={0.12}>
        <div>
          <EnterItem from="left">
            <Label>{t.pricing.label}</Label>
          </EnterItem>
          <EnterItem>
            <h2 className="font-display mt-4 max-w-2xl text-[34px] font-light leading-[1.05] tracking-[-0.035em] text-[#14231d] sm:text-[42px]">
              {t.pricing.title}
            </h2>
          </EnterItem>
          <EnterItem>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-500">
              {t.pricing.body}
            </p>
          </EnterItem>
        </div>
        <EnterItem from="right">
          <p className="max-w-xs font-mono text-[12px] uppercase leading-relaxed tracking-[0.08em] text-zinc-500 md:text-right">
            {t.pricing.billed}
          </p>
        </EnterItem>
      </EnterGroup>

      {/* plans rise in; inside each, the feature list ticks down */}
      <EnterGroup className="mt-12 grid gap-px bg-zinc-200 ring-1 ring-zinc-200 lg:grid-cols-3" stagger={0.14}>
        {PLANS.map(({ id, featured }) => {
          const p = { id, ...t.pricing.plans[id] };
          return (
            <EnterItem
              key={p.id}
              from={featured ? "scale" : "up"}
              className={`relative flex h-full flex-col p-7 ${featured ? "bg-[#15803d] text-white" : "bg-white"}`}
            >
              {featured && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 6px)" }}
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em]">
                <span className={featured ? "text-emerald-100" : "text-zinc-500"}>{p.name}</span>
                {featured && <span className="bg-white px-2 py-0.5 text-[#15803d]">{t.pricing.mostPopular}</span>}
              </div>
              <div className="relative mt-8 flex items-baseline gap-1.5">
                <PlanPrice plan={p.id} featured={featured} />
              </div>
              <p className={`relative mt-2 text-[13px] ${featured ? "text-emerald-50/90" : "text-zinc-500"}`}>{p.blurb}</p>
              <p className={`relative mt-3 font-mono text-[10px] uppercase tracking-[0.12em] ${featured ? "text-emerald-100/80" : "text-zinc-400"}`}>
                {p.note || t.pricing.usageNote}
              </p>
              <EnterGroup
                nested
                delay={0.3}
                stagger={0.06}
                className={`relative mt-6 flex-1 space-y-2.5 border-t border-dashed pt-6 text-[13px] ${featured ? "border-white/30" : "border-zinc-300"}`}
              >
                {p.features.map((f) => (
                  <EnterItem key={f} from="left" duration={0.55} className="flex items-start gap-2.5">
                    {f.endsWith(":") ? (
                      <span className={`font-medium ${featured ? "text-white" : "text-zinc-950"}`}>{f}</span>
                    ) : (
                      <>
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${featured ? "text-white" : "text-[#15803d]"}`} />
                        {f}
                      </>
                    )}
                  </EnterItem>
                ))}
              </EnterGroup>
              <CallLink
                href={`${WAITLIST_HREF}?plan=${p.id}`}
                tone={featured ? "light" : "dark"}
                className={`mt-8 inline-flex items-center justify-between px-4 py-3 font-mono text-[12px] uppercase tracking-[0.12em] ${
                  featured ? "bg-white text-[#0d4a36]" : "bg-zinc-950 text-white"
                }`}
              >
                {p.cta} <ArrowUpRight className="h-3.5 w-3.5" />
              </CallLink>
            </EnterItem>
          );
        })}
      </EnterGroup>

      {/* what's in every plan, what you never pay for, and how usage works */}
      <EnterGroup className="mt-px grid gap-px bg-zinc-200 ring-1 ring-zinc-200 md:grid-cols-3" stagger={0.1}>
        <EnterItem className="bg-[#f7f7f5] p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#15803d]">{t.pricing.inEveryPlan}</div>
          <ul className="mt-3 space-y-1.5 text-[13px] text-zinc-700">
            {t.pricing.included.map((x) => (
              <li key={x} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#15803d]" /> {x}
              </li>
            ))}
          </ul>
        </EnterItem>
        <EnterItem className="bg-[#f7f7f5] p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">{t.pricing.neverPay}</div>
          <ul className="mt-3 space-y-1.5 text-[13px] text-zinc-500">
            {t.pricing.never.map((x) => (
              <li key={x} className="flex items-center gap-2">
                <Minus className="h-3.5 w-3.5 text-zinc-400" /> {x}
              </li>
            ))}
          </ul>
        </EnterItem>
        <EnterItem className="bg-[#f7f7f5] p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">{t.pricing.howUsage}</div>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">
            {t.pricing.usageBody}
          </p>
        </EnterItem>
      </EnterGroup>
    </section>
  );
}

/* FAQ + CTA ---------------------------------------------------------- */

export const CTA_MAP = ["22221111", "22211001", "22110001", "21100011", "11000111", "10001111", "10011112", "11111122"];

export function PixelFaqCta() {
  const t = useT();
  return (
    <section id="faq-grid" className="scroll-mt-4 px-5 pb-20 pt-4 sm:px-10">
      <div className="grid gap-10 border-t border-zinc-200 pt-14 lg:grid-cols-[1fr_1.4fr]">
        <EnterGroup>
          <EnterItem from="left">
            <FaqAside subtitle={t.faq.landingSubtitle} />
          </EnterItem>
        </EnterGroup>
        <FaqAccordion items={t.faq.product} />
      </div>

      {/* final CTA: the pixel tiles assemble in a diagonal wave, then the panel copy follows */}
      <EnterGroup className="mt-20 grid overflow-hidden lg:grid-cols-[0.45fr_1fr]" stagger={0.2}>
        <div className="h-40 overflow-hidden bg-[#0b2f24] sm:h-64 lg:h-auto">
          <PixelBlocks className="w-full" map={CTA_MAP} />
        </div>
        <EnterItem from="wipeLeft" className="flex flex-col justify-center bg-[#0b2f24] p-8 text-white sm:p-14">
          <EnterGroup nested stagger={0.1} delay={0.35}>
            <EnterItem from="left">
              <span className="text-[13px] text-emerald-200/80">{t.cta.kicker}</span>
            </EnterItem>
            <EnterItem>
              <h2 className="font-display mt-2 text-[34px] font-light leading-[1.05] tracking-[-0.035em] sm:text-[40px]">
                {t.cta.title}
              </h2>
            </EnterItem>
            <EnterItem>
              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-emerald-50/75">
                <span className="text-white">{t.cta.bodyBold}</span> {t.cta.body}
              </p>
            </EnterItem>
            <EnterItem from="scale" className="mt-8">
              <CallLink href={WAITLIST_HREF} tone="light" className="inline-flex items-center gap-2 bg-white px-5 py-3 font-mono text-[12px] uppercase tracking-[0.12em] text-[#0d4a36]">
                {t.common.joinTheWaitlist} <ArrowRight className="h-3.5 w-3.5" />
              </CallLink>
            </EnterItem>
          </EnterGroup>
        </EnterItem>
      </EnterGroup>
    </section>
  );
}
