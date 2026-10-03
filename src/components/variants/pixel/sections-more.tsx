"use client";

import { Minus, Plus } from "lucide-react";
import { motion } from "motion/react";
import { EnterGroup, EnterItem, PopCell } from "./enter";
import { DOTS, GRID, Label } from "./sections";
import { HumanPhoto } from "./human-photo";
import { PHOTOS, withAlts } from "./data";
import { useT } from "./i18n";

/* Before vs after ---------------------------------------------------- */

export function PixelBeforeAfter() {
  const t = useT();
  return (
    <section className="border-y border-zinc-200 bg-white px-5 py-16 sm:px-10 sm:py-24">
      <EnterGroup stagger={0.12}>
        <EnterItem from="left">
          <Label>{t.beforeAfter.label}</Label>
        </EnterItem>
        <EnterItem>
          <h2 className="font-display mt-4 max-w-2xl text-[34px] font-light leading-[1.05] tracking-[-0.035em] text-[#14231d] sm:text-[42px]">
            {t.beforeAfter.title}
          </h2>
        </EnterItem>
      </EnterGroup>

      {/* rows build top to bottom: the label, then "today" fades in grey, then the SpaciaOS answer slides in */}
      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="font-mono text-[11px] uppercase tracking-[0.14em]">
              <th className="w-[28%] border-b border-zinc-300 py-3 pr-4 font-normal text-zinc-400"></th>
              <th className="w-[36%] border-b border-zinc-300 px-4 py-3 font-normal text-zinc-500">{t.beforeAfter.today}</th>
              <th className="w-[36%] border-b-2 border-[#15803d] bg-[#15803d]/[0.06] px-4 py-3 font-normal text-[#15803d]">
                {t.beforeAfter.withSpacia}
              </th>
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.11 } } }}
          >
            {t.beforeAfter.rows.map((c, i) => (
              <motion.tr
                key={i}
                className="text-[14px]"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
              >
                <td className="border-b border-zinc-200 py-4 pr-4 font-mono text-[12px] uppercase tracking-[0.08em] text-zinc-950">
                  <EnterItem from="left" duration={0.6}>{c.row}</EnterItem>
                </td>
                <td className="border-b border-zinc-200 px-4 py-4 text-zinc-400">
                  <EnterItem from="fade" className="inline-flex items-start gap-2">
                    <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {c.before}
                  </EnterItem>
                </td>
                <td className="border-b border-zinc-200 bg-[#15803d]/[0.06] px-4 py-4 font-medium text-zinc-900">
                  <EnterItem from="right" duration={0.65} className="inline-flex items-start gap-2">
                    <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#15803d]" />
                    {c.after}
                  </EnterItem>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </section>
  );
}

/* Who it's for ------------------------------------------------------- */

const AUDIENCE = [PHOTOS.brokerages, PHOTOS.developers, PHOTOS.agencies];
const AUDIENCE_ALTS = ["brokerages", "developers", "agencies"] as const;

export function PixelAudience() {
  const t = useT();
  return (
    <section className="relative px-5 py-16 sm:px-10 sm:py-24" style={GRID}>
      <EnterGroup stagger={0.12}>
        <EnterItem from="left">
          <Label>{t.audience.label}</Label>
        </EnterItem>
        <EnterItem>
          <h2 className="font-display mt-4 text-[34px] font-light leading-[1.05] tracking-[-0.035em] text-[#14231d] sm:text-[42px]">
            {t.audience.title}
          </h2>
        </EnterItem>
      </EnterGroup>
      {/* each card: the photo wipes open, then its title and line rise beneath it */}
      <EnterGroup className="mt-12 grid gap-px bg-zinc-200 ring-1 ring-zinc-200 md:grid-cols-3" stagger={0.16}>
        {AUDIENCE.map((shots, i) => (
          <EnterGroup nested key={i} className="relative flex flex-col bg-[#f7f7f5]" stagger={0.12}>
            <EnterItem from="wipe">
            <HumanPhoto shots={withAlts(shots, t.photos[AUDIENCE_ALTS[i]])} delay={i * 1300} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[4/3] w-full">
              <span className="absolute left-3 top-3 bg-white/95 px-2 py-1 font-mono text-[11px] text-zinc-700">
                0{i + 1}
              </span>
            </HumanPhoto>
            </EnterItem>
            <EnterItem className="p-6 sm:p-8">
              <h3 className="font-display text-[22px] font-normal tracking-tight text-[#14231d]">{t.audience.cards[i].title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{t.audience.cards[i].body}</p>
            </EnterItem>
          </EnterGroup>
        ))}
      </EnterGroup>
    </section>
  );
}

/* Founding cohort perks ---------------------------------------------- */

export function PixelPerks() {
  const t = useT();
  return (
    <section className="px-5 py-16 sm:px-10 sm:py-24">
      <EnterGroup stagger={0.12}>
        <EnterItem from="left">
          <Label>{t.perks.label}</Label>
        </EnterItem>
        <EnterItem>
          <h2 className="font-display mt-4 max-w-2xl text-[34px] font-light leading-[1.05] tracking-[-0.035em] text-[#14231d] sm:text-[42px]">
            {t.perks.title}
          </h2>
        </EnterItem>
      </EnterGroup>
      {/* cards rise one by one; the stepped pixel corner of each builds cell by cell */}
      <EnterGroup className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
        {t.perks.items.map((p, i) => (
          <EnterItem key={i} className="group relative bg-white p-6 ring-1 ring-zinc-200 transition-shadow duration-300 hover:ring-[#15803d]">
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-50" style={DOTS} aria-hidden="true" />
            {/* stepped pixel corner */}
            <EnterGroup nested delay={0.35} stagger={0.05} className="absolute right-0 top-0 grid grid-cols-3 gap-0">
              {[1, 1, 1, 0, 1, 1, 0, 0, 1].map((on, n) =>
                on ? <PopCell key={n} className="h-2 w-2 bg-[#15803d]" /> : <span key={n} className="h-2 w-2" />
              )}
            </EnterGroup>
            <div className="relative font-mono text-[12px] text-zinc-400">0{i + 1}</div>
            <h3 className="font-display relative mt-6 text-[19px] font-normal tracking-tight text-[#14231d]">{p.title}</h3>
            <p className="relative mt-2 text-[13px] leading-relaxed text-zinc-500">{p.body}</p>
          </EnterItem>
        ))}
      </EnterGroup>
    </section>
  );
}
