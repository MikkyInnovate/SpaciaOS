"use client";

import { motion, useReducedMotion } from "motion/react";
import { Hand } from "lucide-react";
import { Label } from "../sections";
import { EnterGroup, EnterItem, PopCell } from "../enter";
import { mmss, useOnScreen, useTicker } from "./shared";
import { HumanPhoto } from "../human-photo";
import { useT } from "../i18n";

// 9×9 pixel padlock (shackle + body + keyhole)
const LOCK = [
  "001111100",
  "011000110",
  "010000010",
  "010000010",
  "111111111",
  "111101111",
  "111101111",
  "111111111",
  "111111111",
];

function Tile({ children, className = "", dark = false }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={`relative overflow-hidden p-5 sm:p-7 ${dark ? "bg-[#0b2f24] text-white ring-1 ring-white/10" : "bg-white ring-1 ring-zinc-200"} ${className}`}>
      {children}
    </div>
  );
}

export function PrivacyBento() {
  const reduce = useReducedMotion();
  const [ref, on] = useOnScreen<HTMLDivElement>();
  const t = useTicker(on && !reduce, 100);
  const c = useT().privacy;
  const [p0, p1, p2] = c.promises;
  // transcript lines, with the summary flagged so it can be highlighted in any language
  const notes = [...c.transcript.map((text) => ({ text, summary: false })), { text: c.summary, summary: true }];

  return (
    <section ref={ref} className="border-y border-zinc-200 bg-[#f4f4f2] px-5 py-16 sm:px-10 sm:py-24">
      <EnterGroup className="mx-auto max-w-6xl" stagger={0.12}>
        <EnterItem>
          <Label>{c.label}</Label>
        </EnterItem>
        <EnterItem>
          <h2 className="font-display mt-4 max-w-xl text-[32px] font-light leading-[1.05] tracking-[-0.035em] text-[#14231d] sm:text-[42px]">{c.headline}</h2>
        </EnterItem>

        <div className="mt-10 grid gap-3 lg:grid-cols-[1.25fr_1fr] lg:grid-rows-2">
          {/* big: take over, shown with a real agent on a live call */}
          <EnterItem from="wipe" className="lg:row-span-2">
            <div className="group relative h-full min-h-[420px] overflow-hidden bg-[#0b2f24] sm:min-h-[520px]">
              {/* z-0 keeps the photo's own layers beneath the overlay text */}
              <div className="absolute inset-0 z-0">
                <HumanPhoto
                  shots={[
                    { src: "/images/people/call-blazer.jpg", alt: c.alts[0], position: "50% 25%" },
                    { src: "/images/people/call-coat.jpg", alt: c.alts[1], position: "50% 30%" },
                    { src: "/images/people/call-hands.jpg", alt: c.alts[2], position: "50% 50%" },
                    { src: "/images/people/call-smile.jpg", alt: c.alts[3], position: "55% 25%" },
                    { src: "/images/people/call-blazer-man.jpg", alt: c.alts[4], position: "45% 30%" },
                  ]}
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="h-full w-full"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06140f]/90 via-[#06140f]/25 to-transparent transition-opacity duration-500 lg:opacity-60 lg:group-hover:opacity-100" />

              {/* live badge, always visible */}
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 bg-white/95 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-800">
                <span className="relative flex h-2 w-2">
                  {on && !reduce && <span className="absolute inset-0 animate-ping bg-[#22c55e] opacity-70" />}
                  <span className="relative h-2 w-2 bg-[#22c55e]" />
                </span>
                {c.live} · Adaeze O. · {mmss(41_000 + (reduce ? 0 : t))}
              </span>

              {/* text: always on touch screens, slides up on hover with a pointer */}
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7 lg:translate-y-6 lg:opacity-0 lg:transition-all lg:duration-500 lg:ease-out lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#86efac]">{p1.title}</div>
                <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-white/85">{p1.body}</p>
                <span className="mt-4 inline-flex items-center gap-2 bg-[#22c55e] px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#06140f]">
                  <Hand className="h-3.5 w-3.5" /> {c.takeOver}
                </span>
              </div>
              {/* hint for mouse users before they hover */}
              <span className="absolute bottom-5 left-5 hidden font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 transition-opacity duration-300 group-hover:opacity-0 lg:block">
                {p1.title} ↗
              </span>
            </div>
          </EnterItem>

          {/* private: pixel padlock */}
          <EnterItem from="up">
            <Tile className="flex h-full items-center gap-6">
              <EnterGroup nested stagger={0.012} className="grid shrink-0 grid-cols-9 gap-[3px]" style={{ width: 108 }}>
                {LOCK.join("").split("").map((c, i) =>
                  c === "1" ? (
                    <PopCell key={i} className={`block aspect-square ${i === 49 || i === 58 ? "bg-white" : "bg-[#15803d]"}`} />
                  ) : (
                    <span key={i} className="block aspect-square" />
                  )
                )}
              </EnterGroup>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#15803d]">{p0.title}</div>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{p0.body}</p>
              </div>
            </Tile>
          </EnterItem>

          {/* notes: auto-scrolling transcript */}
          <EnterItem from="up">
            <Tile className="h-full">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#15803d]">{p2.title}</div>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{p2.body}</p>
              <div className="relative mt-4 h-[104px] overflow-hidden bg-[#f7f7f5] ring-1 ring-zinc-200 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
                <motion.ul
                  className="space-y-2 px-3 py-3 font-mono text-[11px] text-zinc-600"
                  animate={on && !reduce ? { y: ["0%", "-50%"] } : undefined}
                  transition={{ duration: 14, ease: "linear", repeat: Infinity }}
                >
                  {[...notes, ...notes].map((n, i) => (
                    <li key={i} className={n.summary ? "text-[#15803d]" : undefined}>
                      {n.text}
                    </li>
                  ))}
                </motion.ul>
              </div>
            </Tile>
          </EnterItem>
        </div>
      </EnterGroup>
    </section>
  );
}
