"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";
import { DOTS, GRID, Glyph, Label, CTA_MAP } from "../sections";
import { LabSkyline } from "../skyline/lab-skyline";
import { PixelBlocks } from "../pixel-blocks";
import { PixelWaitlistForm, PixelSocialProof } from "./pixel-waitlist-form";
import { PixelCountdown } from "./pixel-countdown";
import { HeroStatus } from "../hero-status";
import { FaqAside } from "../faq-aside";
import { FaqAccordion } from "../faq-accordion";
import { MascotSip } from "../mascot-sip";
import { useT } from "../i18n";

// Early access opens: countdown target (fixed date so every visitor sees the same time left)
const BATCH_2_OPENS = "2026-10-23T09:00:00+01:00";

/* Hero ----------------------------------------------------------------- */

export function PixelWaitlistHero() {
  const t = useT();
  return (
    <section id="join" className="relative scroll-mt-4 overflow-hidden border-b border-zinc-200">
      <div className="relative z-10 grid gap-12 px-5 pb-8 pt-10 sm:px-10 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <Reveal>
            <HeroStatus label={t.waitlistPage.statusLabel} feed={t.waitlistPage.feed} />
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="font-display mt-6 text-[clamp(36px,4.4vw,60px)] font-light leading-[1.02] tracking-[-0.04em] text-[#14231d]">
              {t.waitlistPage.title1}
              <br />
              {t.waitlistPage.title2}
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-zinc-500">
              {t.waitlistPage.body}
            </p>
          </Reveal>
          <Reveal delay={0.24} className="mt-8 flex flex-col gap-4">
            <PixelWaitlistForm id="pixel-waitlist-email" />
            <PixelSocialProof />
          </Reveal>
        </div>

        <Reveal delay={0.3} className="lg:justify-self-end">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">{t.waitlistPage.opensIn}</div>
          <div className="mt-3">
            <PixelCountdown target={BATCH_2_OPENS} />
          </div>
        </Reveal>
      </div>

      <LabSkyline mode="drone-life" className="h-[180px] w-full sm:h-[280px]" />
    </section>
  );
}

/* How it works (short) ------------------------------------------------ */

const STEPS = [
  { n: "01", glyph: "0111010001100011000101110" },
  { n: "02", glyph: "0000100010101000100000000" },
  { n: "03", glyph: "1111110001101011000111111" },
];

export function PixelWaitlistSteps() {
  const t = useT();
  return (
    <section id="how" className="relative scroll-mt-4 border-b border-zinc-200 bg-white px-5 py-16 sm:px-10 sm:py-24" style={GRID}>
      <Reveal>
        <Label>{t.waitlistPage.stepsLabel}</Label>
        <h2 className="font-display mt-4 max-w-2xl text-[34px] font-light leading-[1.05] tracking-[-0.035em] text-[#14231d] sm:text-[42px]">
          {t.waitlistPage.stepsTitle}
        </h2>
      </Reveal>
      <Stagger className="mt-12 grid gap-px bg-zinc-200 ring-1 ring-zinc-200 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <StaggerItem key={s.n} className="flex min-h-[150px] flex-col justify-between gap-8 bg-[#f7f7f5] p-6 sm:min-h-[200px]">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[13px] text-zinc-500">
                {s.n} / <span className="text-zinc-950">{t.waitlistPage.steps[i].title}</span>
              </span>
              <Glyph cells={s.glyph} />
            </div>
            <p className="text-[14px] leading-relaxed text-zinc-600">{t.waitlistPage.steps[i].body}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* A note from the team ------------------------------------------------- */

function PixelFrameCorner({ className }: { className: string }) {
  return (
    <span className={`absolute grid grid-cols-3 ${className}`} aria-hidden="true">
      {[1, 1, 1, 1, 0, 0, 1, 0, 0].map((on, n) => (
        <span key={n} className={`h-2.5 w-2.5 ${on ? "bg-[#15803d]" : ""}`} />
      ))}
    </span>
  );
}

export function PixelTeamNote() {
  const t = useT();
  return (
    <section className="px-5 pb-16 pt-36 sm:px-10 sm:pb-24 sm:pt-44">
      <Reveal className="relative mx-auto max-w-xl">
        <MascotSip
          alt={t.waitlistPage.mascotAlt}
          className="pointer-events-none absolute -top-[118px] right-8 w-[92px] select-none sm:-top-[148px] sm:w-[114px]"
        />
        <div className="relative bg-white p-7 ring-1 ring-zinc-300 sm:p-9">
          <PixelFrameCorner className="-left-px -top-px" />
          <PixelFrameCorner className="-bottom-px -right-px rotate-180" />
          <div className="absolute inset-0 opacity-30" style={DOTS} aria-hidden="true" />
          <div className="relative">
            <Label>{t.waitlistPage.noteLabel}</Label>
            <h2 className="font-display mt-4 text-[26px] font-light tracking-[-0.035em] text-[#14231d] sm:text-[30px]">
              {t.waitlistPage.noteTitle}
            </h2>
            <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-zinc-600">
              <p>{t.waitlistPage.noteP1}</p>
              <p>{t.waitlistPage.noteP2}</p>
            </div>
            <dl className="mt-6 grid gap-px bg-zinc-200 font-mono text-[12px] ring-1 ring-zinc-200 sm:grid-cols-3">
              {t.waitlistPage.facts.map(([k, v]) => (
                <div key={k} className="bg-white p-3">
                  <dt className="uppercase tracking-[0.12em] text-zinc-400">{k}</dt>
                  <dd className="mt-1 text-zinc-900">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex items-center gap-3 border-t border-dashed border-zinc-300 pt-5">
              <span className="grid h-8 w-8 grid-cols-3 gap-px bg-zinc-100 p-1" aria-hidden="true">
                {[1, 1, 0, 1, 0, 0, 1, 1, 1].map((on, i) => (
                  <span key={i} className={on ? "bg-[#15803d]" : ""} />
                ))}
              </span>
              <div className="leading-tight">
                <div className="text-[13px] font-medium text-zinc-950">{t.waitlistPage.team}</div>
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-zinc-500">{t.waitlistPage.teamRole}</div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* FAQ -------------------------------------------------------------------- */

export function PixelWaitlistFaq() {
  const t = useT();
  return (
    <section id="faq" className="scroll-mt-4 border-t border-zinc-200 px-5 py-16 sm:px-10 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <FaqAside subtitle={t.faq.waitlistSubtitle} />
        </Reveal>
        <FaqAccordion items={t.faq.waitlist} />
      </div>
    </section>
  );
}

/* Final CTA ------------------------------------------------------------- */

export function PixelWaitlistCta() {
  const t = useT();
  return (
    <section className="px-5 pb-20 sm:px-10">
      <Reveal className="grid overflow-hidden lg:grid-cols-[0.45fr_1fr]">
        <div className="h-40 overflow-hidden bg-[#6fbf95] sm:h-64 lg:h-auto">
          <PixelBlocks className="w-full" map={CTA_MAP} />
        </div>
        <div className="flex flex-col justify-center bg-[#0b2f24] p-8 text-white sm:p-14">
          <span className="text-[13px] text-emerald-200/80">{t.waitlistPage.ctaKicker}</span>
          <h2 className="font-display mt-2 text-[34px] font-light leading-[1.05] tracking-[-0.035em] sm:text-[40px]">
            {t.waitlistPage.ctaTitle}
          </h2>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-emerald-50/75">
            <span className="text-white">{t.waitlistPage.ctaBodyBold}</span> {t.waitlistPage.ctaBody}
          </p>
          <div className="mt-8">
            <PixelWaitlistForm tone="dark" id="pixel-waitlist-email-footer" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
