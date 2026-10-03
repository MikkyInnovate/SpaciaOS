"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Building2, Check, Megaphone, MessageCircle, PhoneCall } from "lucide-react";
import { EnterGroup, EnterItem } from "./enter";
import { useT } from "./i18n";

/**
 * "Speed to lead" scene: a looping, pixel-styled story of one lead.
 *   ping (lead arrives) → call line races out with a 00:00→00:03 timer →
 *   qualification ticks → inspection slot drops into a pixel calendar → next lead.
 * Runs only while in view; reduced motion shows the final composed frame.
 */

const LOOP = 8200;
const T = { ping: 900, callEnd: 2900, ticks: [3300, 3800, 4300], book: 4900, fade: 7700 };
const SLOTS = ["09", "10", "14", "16"];
// Busy cells in the calendar, as "day-slot"
const BUSY = new Set(["0-1", "1-2", "2-0", "3-3", "4-1", "5-2", "6-0", "1-0", "4-3"]);

const LEADS = [
  { Icon: Building2, name: "Adaeze O.", day: 5, slot: 1, time: "10:00", place: "Banana Island" },
  { Icon: MessageCircle, name: "Tunde A.", day: 6, slot: 2, time: "14:00", place: "Lekki Phase 1" },
  { Icon: Megaphone, name: "Chioma E.", day: 3, slot: 0, time: "09:00", place: "Eko Atlantic" },
];

/* Pixel line: either fills up to `p`, or carries a short travelling packet */
function PixelLine({ p, n, vertical = false, packet = false }: { p: number; n: number; vertical?: boolean; packet?: boolean }) {
  const head = Math.floor(p * n);
  return (
    <div
      className={vertical ? "grid h-full w-3 gap-[3px]" : "grid h-3 w-full gap-[3px]"}
      style={vertical ? { gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` } : { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {Array.from({ length: n }).map((_, i) => {
        const on = packet ? p > 0 && p < 1 && i <= head && i > head - 3 : i < head;
        const isHead = p > 0 && p < 1 && i === Math.min(head, n - 1);
        return (
          <span
            key={i}
            className={`${vertical ? "h-full w-3" : "h-3 w-full"} ${
              isHead ? "bg-[#22c55e] shadow-[0_0_10px_2px_rgba(34,197,94,0.55)]" : on ? "bg-[#15803d]" : "bg-zinc-200"
            }`}
          />
        );
      })}
    </div>
  );
}

export function SpeedToLeadScene() {
  const s = useT().scene;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();
  const [{ lead, t }, setClock] = useState({ lead: 0, t: 0 });

  useEffect(() => {
    if (!inView || reduce) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      setClock((prev) => {
        const next = prev.t + dt;
        return next >= LOOP ? { lead: (prev.lead + 1) % LEADS.length, t: 0 } : { lead: prev.lead, t: next };
      });
    }, 50);
    return () => clearInterval(id);
  }, [inView, reduce]);

  const time = reduce ? LOOP - 1000 : t;
  const idx = reduce ? 0 : lead;
  const L = { ...LEADS[idx], source: s.sources[idx], listing: s.listings[idx] };
  const DAYS = s.days;
  const ping = Math.min(1, time / T.ping);
  const call = Math.min(1, Math.max(0, (time - T.ping) / (T.callEnd - T.ping)));
  const secs = Math.min(3, Math.floor(call * 3.999));
  const connected = time >= T.callEnd;
  const booked = time >= T.book;
  const phase = booked ? s.phases.booked : time >= T.ticks[0] ? s.phases.qualifying : time >= T.ping ? s.phases.calling : s.phases.newLead;
  const fading = !reduce && time > T.fade;

  return (
    <div ref={ref} className={`transition-opacity duration-500 ${fading ? "opacity-40" : "opacity-100"}`}>
      {/* Status bar */}
      <EnterGroup>
      <EnterItem className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
        <span className="text-zinc-500">
          {s.lead} {String((reduce ? 0 : lead) + 1).padStart(2, "0")} / {String(LEADS.length).padStart(2, "0")}
        </span>
        <span className="inline-flex items-center gap-2 text-[#15803d]">
          <span className="h-2 w-2 animate-pulse bg-[#22c55e]" />
          {phase}
        </span>
      </EnterItem>
      </EnterGroup>

      {/* Flow: source → SpaciaOS → buyer */}
      <EnterGroup stagger={0.12} className="mt-6 flex flex-col items-stretch gap-3 lg:grid lg:grid-cols-[180px_1fr_auto_1.4fr_220px] lg:items-center lg:gap-4">
        {/* Source */}
        <EnterItem from="left" className="relative flex items-center gap-3 bg-white p-3 ring-1 ring-zinc-200">
          {ping < 1 && !reduce && <span className="absolute inset-0 animate-ping bg-[#22c55e]/15" aria-hidden="true" />}
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center bg-zinc-950 text-white">
            <L.Icon className="h-4 w-4" />
          </span>
          <div className="relative min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400">{s.source}</div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={L.source}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="truncate text-[13px] font-medium text-zinc-900"
              >
                {L.source}
              </motion.div>
            </AnimatePresence>
          </div>
        </EnterItem>

        <EnterItem from="left" className="hidden lg:block">
          <PixelLine p={ping} n={14} packet />
        </EnterItem>
        <div className="flex justify-center py-1 lg:hidden">
          <div className="h-10"><PixelLine p={ping} n={5} vertical packet /></div>
        </div>

        {/* SpaciaOS node */}
        <EnterItem from="scale" className="flex items-center justify-center gap-3 self-center bg-[#0d4a36] px-4 py-3 text-white">
          <span className="grid h-6 w-6 grid-cols-3 gap-px" aria-hidden="true">
            {[1, 1, 0, 1, 0, 0, 1, 1, 1].map((on, i) => (
              <span key={i} className={on ? "bg-[#22c55e]" : "bg-white/10"} />
            ))}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em]">SpaciaOS</span>
        </EnterItem>

        {/* Call line + timer */}
        <EnterItem from="left" className="relative">
          <div className="mb-2 flex items-end justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
              <PhoneCall className="h-3 w-3" /> {connected ? s.connected : time >= T.ping ? s.phases.calling : s.standby}
            </span>
            <span className="font-mono text-[34px] font-medium leading-none tabular-nums tracking-tight text-zinc-950 sm:text-[44px]">
              00:0{secs}
            </span>
          </div>
          <div className="hidden lg:block">
            <PixelLine p={call} n={22} />
          </div>
          <div className="flex justify-center lg:hidden">
            <div className="h-14"><PixelLine p={call} n={7} vertical /></div>
          </div>
        </EnterItem>

        {/* Buyer */}
        <EnterItem from="right" className="flex items-center gap-3 bg-white p-3 ring-1 ring-zinc-200">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center font-mono text-[12px] font-semibold ${
              connected ? "bg-[#15803d] text-white" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {L.name.split(" ").map((p) => p[0]).join("")}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-zinc-900">{L.name}</div>
            <div className="truncate text-[11px] text-zinc-500">{L.listing}</div>
          </div>
        </EnterItem>
      </EnterGroup>

      {/* Qualification + calendar */}
      <EnterGroup stagger={0.15} className="mt-6 grid gap-3 lg:mt-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <EnterItem className="bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">{s.qualification}</div>
          <ul className="mt-3 space-y-2">
            {s.checks.map((c, i) => {
              const done = time >= T.ticks[i];
              return (
                <li key={c} className="flex items-center justify-between gap-3 border-b border-dashed border-zinc-200 pb-2 last:border-0 last:pb-0">
                  <span className={`text-[14px] ${done ? "text-zinc-950" : "text-zinc-400"}`}>{c}</span>
                  <span className={`flex h-5 w-5 items-center justify-center ${done ? "bg-[#15803d] text-white" : "bg-zinc-100"}`}>
                    <AnimatePresence>
                      {done && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                          <Check className="h-3 w-3" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </li>
              );
            })}
          </ul>
        </EnterItem>

        <EnterItem className="bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">{s.agentCalendar}</span>
            <span className={`font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${booked ? "text-[#15803d]" : "text-zinc-300"}`}>
              {DAYS[L.day]} {L.time} · {L.place}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-[28px_repeat(7,minmax(0,1fr))] gap-[3px]">
            <span />
            {DAYS.map((d) => (
              <span key={d} className="text-center font-mono text-[9px] tracking-[0.08em] text-zinc-400">{d}</span>
            ))}
            {SLOTS.map((slot, si) => (
              <div key={slot} className="contents">
                <span className="self-center font-mono text-[9px] text-zinc-400">{slot}:00</span>
                {DAYS.map((_, di) => {
                  const isTarget = di === L.day && si === L.slot;
                  const busy = BUSY.has(`${di}-${si}`) && !isTarget;
                  return (
                    <span key={di} className={`relative h-6 sm:h-7 ${busy ? "bg-zinc-300" : "bg-zinc-100"}`}>
                      <AnimatePresence>
                        {isTarget && booked && (
                          <motion.span
                            key={`${lead}-drop`}
                            initial={reduce ? false : { y: -48, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", stiffness: 420, damping: 18 }}
                            className="absolute inset-0 bg-[#15803d] shadow-[0_0_14px_rgba(34,197,94,0.55)]"
                          />
                        )}
                      </AnimatePresence>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </EnterItem>
      </EnterGroup>
    </div>
  );
}
