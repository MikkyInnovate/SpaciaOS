"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Reveal } from "@/components/marketing/motion";
import { Building2, Phone } from "lucide-react";
import { playChime, playLost, unlockAudio } from "./chime";
import { BRAND_ICONS } from "@/components/brand/brand-icons";
import { Label } from "./sections";
import { IPhoneFrame } from "./iphone-frame";
import { fmt, useT } from "./i18n";
import type { Dict } from "./i18n/dict.en";

/* The problem, told as an agent's own lock screen (their portrait on the
   wallpaper, the real time on the clock) filling up with unanswered leads
   while you scroll. */

type App = "portal" | "phone" | "whatsapp" | "email";
// titles and bodies live in the dictionary, in this order
type Note = { app: App; minsAgo: number; adds: number };

const NOTES: Note[] = [
  { app: "portal", minsAgo: 180, adds: 1 },
  { app: "phone", minsAgo: 178, adds: 1 },
  { app: "whatsapp", minsAgo: 162, adds: 3 },
  { app: "phone", minsAgo: 107, adds: 2 },
  { app: "email", minsAgo: 82, adds: 1 },
  { app: "portal", minsAgo: 57, adds: 1 },
  { app: "whatsapp", minsAgo: 22, adds: 2 },
  { app: "phone", minsAgo: 1, adds: 3 },
];
const VISIBLE_MAX = 4;
const CARD_H = 62; // px, at the 300px design width
const PITCH = CARD_H + 8;

/* Live clock: ticks every second on the client; renders placeholders on the server */
function subscribe(cb: () => void) {
  const id = window.setInterval(cb, 1000);
  return () => window.clearInterval(id);
}
const getSecond = () => Math.floor(Date.now() / 1000);
const getServerSecond = () => null;

function useNowSec() {
  return useSyncExternalStore(subscribe, getSecond, getServerSecond);
}

type P = Dict["problem"];
const fmtTime = (d: Date, locale: string) => d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
const fmtDate = (d: Date, locale: string) => d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
// real elapsed time since a notification actually landed on screen
const ago = (secs: number, t: P) =>
  secs < 3
    ? t.now
    : secs < 60
      ? fmt(t.secondsAgo, { n: secs })
      : secs < 3600
        ? fmt(t.minutesAgo, { n: Math.floor(secs / 60) })
        : fmt(t.hoursAgo, { n: Math.floor(secs / 3600) });
const elapsed = (secs: number, t: P) =>
  secs < 60
    ? { value: secs, unit: t.units.sec }
    : secs < 3600
      ? { value: Math.floor(secs / 60), unit: t.units.min }
      : { value: Math.floor(secs / 3600), unit: t.units.hrs };

function useProgress(progress: MotionValue<number>, start: number, end: number) {
  const reduce = useReducedMotion();
  const [p, setP] = useState(0);
  useMotionValueEvent(progress, "change", (v) => {
    const t = Math.min(1, Math.max(0, (v - start) / (end - start)));
    setP(Math.round(t * 1000) / 1000);
  });
  return reduce ? 1 : p;
}

function AppIcon({ app }: { app: App }) {
  const box = "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] shadow-[inset_0_0.5px_0_rgba(255,255,255,0.4)]";
  if (app === "whatsapp" || app === "email") {
    const b = BRAND_ICONS[app === "whatsapp" ? "whatsapp" : "gmail"];
    return (
      <span className={`${box} ${app === "whatsapp" ? "bg-[#25D366]" : "bg-white"}`}>
        <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" style={{ fill: app === "whatsapp" ? "#fff" : b.color }} aria-hidden="true">
          <path d={b.path} />
        </svg>
      </span>
    );
  }
  if (app === "phone")
    return (
      <span className={`${box} bg-gradient-to-b from-[#5bf675] to-[#2fcc4b]`}>
        <Phone className="h-[12px] w-[12px] fill-white text-white" />
      </span>
    );
  return (
    <span className={`${box} bg-[#0d4a36]`}>
      <Building2 className="h-[12px] w-[12px] text-[#86efac]" />
    </span>
  );
}

/* Apple "Liquid Glass" notification: translucent, blurred, with a bright rim and specular sheen */
function GlassCard({ children, dim = false, style }: { children: React.ReactNode; dim?: boolean; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] px-3 py-2.5 backdrop-blur-2xl backdrop-saturate-[1.8] ${
        dim ? "bg-[rgba(40,40,40,0.38)]" : "bg-[rgba(255,255,255,0.2)]"
      }`}
      style={{
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(255,255,255,0.12), inset 0 0 0 0.5px rgba(255,255,255,0.28), 0 10px 26px -10px rgba(0,0,0,0.45)",
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.04) 38%, transparent 60%)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function LockScreen({
  shown,
  lost,
  nowSec,
  arrivals,
}: {
  shown: number;
  lost: boolean;
  nowSec: number | null;
  arrivals: Record<string, number>;
}) {
  const dict = useT();
  const t = dict.problem;
  const locale = dict.locale;
  const now = nowSec === null ? null : new Date(nowSec * 1000);
  const since = (key: string) => Math.max(0, (nowSec ?? 0) - (arrivals[key] ?? nowSec ?? 0));
  // which way is the story moving? outgoing cards leave in that direction
  const step = shown + (lost ? 1 : 0);
  const [dir, setDir] = useState(1);
  const [prevStep, setPrevStep] = useState(step);
  if (step !== prevStep) {
    setPrevStep(step);
    setDir(step > prevStep ? 1 : -1);
  }
  const visible = NOTES.slice(0, shown).map((n, i) => ({ ...n, ...t.notes[i] })).reverse(); // newest first, like a real lock screen
  // ages are relative to the newest arrival, so each new lead lands as "now"
  const cards = [
    ...(lost
      ? [{ key: "lost", app: "portal" as App, title: t.lostTitle, body: t.lostBody, when: ago(since("lost"), t), source: t.apps.portal, lost: true }]
      : []),
    ...visible.map((n) => ({
      key: `${n.app}-${n.minsAgo}`,
      app: n.app,
      title: n.title,
      body: n.body,
      when: ago(since(`${n.app}-${n.minsAgo}`), t),
      source: t.apps[n.app],
      lost: false,
    })),
  ].slice(0, VISIBLE_MAX);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#5a0f14] antialiased"
      // Apple's own SF Pro on Apple devices (like a real lock screen), Inter elsewhere
      style={{ fontFamily: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, var(--font-sans), system-ui, sans-serif' }}
    >
      {/* wallpaper: the agent's own baby */}
      <Image
        src="/images/people/wallpaper-executive-red.jpg"
        alt=""
        fill
        sizes="320px"
        className="object-cover"
        style={{ objectPosition: "50% 22%" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.38), rgba(0,0,0,0.05) 38%, rgba(0,0,0,0.12) 70%, rgba(0,0,0,0.4))" }}
      />

      {/* status bar */}
      <div className="relative flex h-[46px] items-center justify-between px-6 pt-1 text-[12px] font-semibold text-white">
        <span className="tabular-nums">{now ? fmtTime(now, locale) : "--:--"}</span>
        <span className="flex items-center gap-1">
          <span className="flex items-end gap-[2px]">
            {[4, 6, 8, 10].map((hgt) => (
              <span key={hgt} className="w-[3px] rounded-[1px] bg-white" style={{ height: hgt }} />
            ))}
          </span>
          <span className="ml-1 h-[10px] w-[20px] rounded-[3px] border border-white/80 p-[1px]">
            <span className="block h-full w-[70%] rounded-[1px] bg-white" />
          </span>
        </span>
      </div>

      <div className="relative text-center text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.25)]">
        <div className="text-[13px] font-medium text-white/90">{now ? fmtDate(now, locale) : "\u00a0"}</div>
        <div
          className="text-[84px] font-semibold leading-[0.95] tracking-[-0.02em] tabular-nums"
          style={{ fontFamily: '"SF Pro Display", "SF Pro Rounded", -apple-system, BlinkMacSystemFont, var(--font-sans), system-ui, sans-serif' }}
        >
          {now ? fmtTime(now, locale) : "--:--"}
        </div>
      </div>

      {/* stack grows down from under the clock, newest on top. Every card sits in a
          fixed slot and glides between slots, so arrivals and exits never collide. */}
      <div className="relative min-h-0 flex-1 overflow-hidden px-2.5 pt-5">
        <div className="relative" style={{ height: VISIBLE_MAX * PITCH + 8 }}>
          <AnimatePresence initial={false} custom={dir}>
            {cards.map((c, slot) => (
              <motion.div
                key={c.key}
                className="absolute inset-x-0 top-0"
                custom={dir}
                variants={{
                  enter: (d: number) => (d > 0 ? { opacity: 0, y: -22, scale: 0.94 } : { opacity: 0, y: VISIBLE_MAX * PITCH, scale: 0.94 }),
                  exit: (d: number) =>
                    d > 0
                      ? { opacity: 0, y: VISIBLE_MAX * PITCH, scale: 0.94, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }
                      : { opacity: 0, y: -22, scale: 0.94, transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } },
                }}
                initial="enter"
                animate={{ opacity: 1, y: slot * PITCH, scale: 1 }}
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                style={{ zIndex: VISIBLE_MAX - slot }}
              >
                <GlassCard dim={c.lost} style={{ height: CARD_H }}>
                  <div className="flex items-center gap-2.5">
                    <AppIcon app={c.app} />
                    <div className="min-w-0 flex-1">
                      <div className={`flex items-baseline justify-between gap-2 text-[12px] ${c.lost ? "text-white/85" : "text-white"}`}>
                        <span className="truncate font-semibold">{c.title}</span>
                        <span className="shrink-0 text-[11px] text-white/70">{c.when}</span>
                      </div>
                      <div className={`truncate text-[12px] ${c.lost ? "text-white/75" : "text-white/85"}`}>{c.body}</div>
                      <div className="text-[10px] text-white/55">{c.source}</div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
          {shown > VISIBLE_MAX && (
            <div
              className="absolute inset-x-4 h-2 rounded-b-xl bg-white/25 backdrop-blur-xl"
              style={{ top: VISIBLE_MAX * PITCH - 6 }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* home indicator */}
      <div className="relative flex justify-center pb-2 pt-3">
        <span className="h-[5px] w-[120px] rounded-full bg-white/85" />
      </div>
    </div>
  );
}

function Counter({ label, value, unit, lost }: { label: string; value: string | number; unit?: string; lost: boolean }) {
  return (
    <div className="text-center lg:text-left">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">{label}</div>
      <div
        className={`mt-1 font-mono text-[40px] font-medium tabular-nums tracking-tight transition-colors duration-500 sm:text-[56px] ${
          lost ? "text-zinc-400" : "text-[#14231d]"
        }`}
      >
        {value}
        {unit && <span className="text-[18px] text-zinc-400"> {unit}</span>}
      </div>
    </div>
  );
}

export function ProblemNotify() {
  const t = useT().problem;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useProgress(scrollYProgress, 0.04, 0.9);

  const shown = Math.min(NOTES.length, Math.floor(p * (NOTES.length + 1)));
  const lost = p >= 0.97;
  const count = NOTES.slice(0, shown).reduce((n, x) => n + x.adds, 0);

  // when did each notification actually appear? (seconds, real time)
  const nowSec = useNowSec();
  const [arrivals, setArrivals] = useState<Record<string, number>>({});
  const [seen, setSeen] = useState({ shown: 0, lost: false });
  if (nowSec !== null && (seen.shown !== shown || seen.lost !== lost)) {
    const next: Record<string, number> = {};
    NOTES.slice(0, shown).forEach((n) => {
      const k = `${n.app}-${n.minsAgo}`;
      next[k] = arrivals[k] ?? nowSec;
    });
    if (lost) next.lost = arrivals.lost ?? nowSec;
    setArrivals(next);
    setSeen({ shown, lost });
  }
  const first = arrivals[`${NOTES[0].app}-${NOTES[0].minsAgo}`];
  const sinceFirst = elapsed(first !== undefined && nowSec !== null ? Math.max(0, nowSec - first) : 0, t);

  // sound: a chime as each notification lands (scrolling forward only)
  const soundRef = useRef(false);
  const prev = useRef({ shown: 0, lost: false });
  useEffect(() => {
    // the browser only allows audio after a click/tap/key, so switch on at the first one
    const on = () => {
      if (unlockAudio()) soundRef.current = true;
    };
    // every gesture a browser accepts as "the user interacted" (scrolling isn't one)
    const events = ["pointerdown", "mousedown", "touchend", "click", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, on, { capture: true }));
    return () => events.forEach((e) => window.removeEventListener(e, on, { capture: true }));
  }, []);
  useEffect(() => {
    const was = prev.current;
    if (soundRef.current) {
      // one pop per message that just appeared, spaced like they're arriving
      const arrived = Math.max(0, shown - was.shown);
      for (let k = 0; k < arrived; k++) window.setTimeout(playChime, k * 220);
      if (lost && !was.lost) window.setTimeout(playLost, arrived * 220);
    }
    prev.current = { shown, lost };
  }, [shown, lost]);

  // entrance: as the section scrolls into view the phone rises, straightens and
  // grows into place while the counters slide in from the sides
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: enter } = useScroll({ target: sectionRef, offset: ["start end", "start start"] });
  const phoneY = useTransform(enter, [0, 1], reduce ? [0, 0] : [160, 0]);
  const phoneScale = useTransform(enter, [0, 1], reduce ? [1, 1] : [0.86, 1]);
  const phoneTilt = useTransform(enter, [0, 1], reduce ? [0, 0] : [18, 0]);
  const phoneFade = useTransform(enter, [0, 0.6], reduce ? [1, 1] : [0, 1]);
  const leftX = useTransform(enter, [0.3, 1], reduce ? [0, 0] : [-60, 0]);
  const rightX = useTransform(enter, [0.3, 1], reduce ? [0, 0] : [60, 0]);
  const sideFade = useTransform(enter, [0.4, 1], reduce ? [1, 1] : [0, 1]);

  // exit: as the section scrolls away the phone tilts back, shrinks and drifts up
  const { scrollYProgress: leave } = useScroll({ target: sectionRef, offset: ["end end", "end start"] });
  const outY = useTransform(leave, [0, 1], reduce ? [0, 0] : [0, -140]);
  const outScale = useTransform(leave, [0, 1], reduce ? [1, 1] : [1, 0.86]);
  const outTilt = useTransform(leave, [0, 1], reduce ? [0, 0] : [0, -16]);
  const outFade = useTransform(leave, [0.2, 0.85], reduce ? [1, 1] : [1, 0]);
  const outLeftX = useTransform(leave, [0, 0.7], reduce ? [0, 0] : [0, -60]);
  const outRightX = useTransform(leave, [0, 0.7], reduce ? [0, 0] : [0, 60]);
  const outSideFade = useTransform(leave, [0, 0.6], reduce ? [1, 1] : [1, 0]);

  return (
    <section ref={sectionRef} className="relative overflow-x-clip bg-[#f4f4f2]">
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center sm:px-10 sm:pt-24">
        <Reveal>
          <Label>{t.label}</Label>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="font-display mt-4 text-[32px] font-light leading-[1.05] tracking-[-0.035em] text-[#14231d] sm:text-[42px]">
            {t.title}
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-zinc-500">
            {t.body}
          </p>
        </Reveal>
      </div>

      <div ref={ref} className="relative h-[240vh]">
        <div className="sticky top-0 flex min-h-[100svh] items-center px-5 py-6 sm:px-10 [perspective:1200px]">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
            <motion.div style={{ x: leftX, opacity: sideFade }} className="hidden justify-self-end lg:block">
              <motion.div style={{ x: outLeftX, opacity: outSideFade }}>
                <Counter label={t.unanswered} value={count} lost={lost} />
              </motion.div>
            </motion.div>

            <motion.div
              style={{ y: phoneY, scale: phoneScale, rotateX: phoneTilt, opacity: phoneFade, transformOrigin: "50% 100%" }}
              className="relative flex justify-center"
            >
              <motion.div style={{ y: outY, scale: outScale, rotateX: outTilt, opacity: outFade, transformOrigin: "50% 0%" }}>
                <IPhoneFrame
                  screen={<LockScreen shown={shown} lost={lost} nowSec={nowSec} arrivals={arrivals} />}
                  mockupSrc="/images/mockups/iphone-17-pro-max.png"
                  mockupAspect={1588 / 3268}
                  screenInset={{ left: "4.53%", top: "1.77%", width: "90.93%", height: "96.45%", radius: "13.3% / 6.09%" }}
                  className="w-[min(80vw,320px)] drop-shadow-[0_24px_32px_rgba(6,20,15,0.18)] lg:w-[min(390px,calc(86svh*1588/3268))]"
                />
              </motion.div>
            </motion.div>

            <motion.div style={{ x: rightX, opacity: sideFade }} className="hidden justify-self-start lg:block">
              <motion.div style={{ x: outRightX, opacity: outSideFade }}>
                <Counter label={t.sinceFirst} value={sinceFirst.value} unit={sinceFirst.unit} lost={lost} />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 border-t border-zinc-200 pt-4 lg:hidden">
              <Counter label={t.unanswered} value={count} lost={lost} />
              <Counter label={t.sinceFirst} value={sinceFirst.value} unit={sinceFirst.unit} lost={lost} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
