"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

/* The hard-hat mascot takes a sip of his tea when he scrolls into view, then keeps
   sipping now and then. Layers are cut from the original drawing (458×640):
   base (body, arm), hand+cup, steam. Positions below are in % of that canvas. */

const W = 458;
const H = 640;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

const HAND = { x: 163, y: 410, w: 147, h: 105 };
const STEAM = { x: 212, y: 362, w: 66, h: 54 };

const CYCLE = 3.4; // seconds for one sip
const T = [0, 0.18, 0.32, 0.62, 0.8, 1]; // lift, tip, hold (drink), lower, rest

export function MascotSip({ className = "", alt = "" }: { className?: string; alt?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const reduce = useReducedMotion();
  const play = inView && !reduce;
  const loop = { duration: CYCLE, times: T, ease: "easeInOut" as const, repeat: Infinity, repeatDelay: 2.6 };

  return (
    // the outer box takes the caller's positioning; the inner box anchors the layers
    <div ref={ref} className={className} role="img" aria-label={alt}>
      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/mascot/base.png" alt="" className="absolute inset-0 h-full w-full select-none" draggable={false} />

      {/* the arm stretches to follow the hand */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <motion.path
          d="M154 515 C 156 495, 160 482, 166 470"
          fill="none"
          stroke="#000"
          strokeWidth={10}
          strokeLinecap="round"
          initial={false}
          animate={
            play
              ? {
                  d: [
                    "M154 515 C 156 495, 160 482, 166 470",
                    "M154 515 C 150 470, 158 420, 176 400",
                    "M154 515 C 148 462, 160 408, 184 390",
                    "M154 515 C 148 462, 160 408, 184 390",
                    "M154 515 C 150 470, 158 420, 176 400",
                    "M154 515 C 156 495, 160 482, 166 470",
                  ],
                }
              : { d: "M154 515 C 156 495, 160 482, 166 470" }
          }
          transition={play ? loop : { duration: 0.4 }}
        />
      </svg>

      {/* hand + cup: lifts to the mouth and tips */}
      <motion.div
        className="absolute"
        style={{
          left: pct(HAND.x, W),
          top: pct(HAND.y, H),
          width: pct(HAND.w, W),
          height: pct(HAND.h, H),
          transformOrigin: "8% 70%",
        }}
        initial={false}
        animate={
          play
            ? { y: ["0%", "-62%", "-74%", "-74%", "-62%", "0%"], x: ["0%", "6%", "10%", "10%", "6%", "0%"], rotate: [0, -12, -30, -30, -12, 0] }
            : { y: "0%", x: "0%", rotate: 0 }
        }
        transition={play ? loop : { duration: 0.4 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/mascot/hand-cup.png" alt="" className="h-full w-full select-none" draggable={false} />
      </motion.div>

      {/* steam drifts up; it vanishes while he drinks */}
      <motion.div
        className="absolute"
        style={{ left: pct(STEAM.x, W), top: pct(STEAM.y, H), width: pct(STEAM.w, W), height: pct(STEAM.h, H) }}
        initial={false}
        animate={
          play
            ? { opacity: [1, 0, 0, 0, 0, 1], y: ["0%", "-20%", "-20%", "-20%", "10%", "0%"] }
            : { opacity: 1, y: "0%" }
        }
        transition={play ? loop : { duration: 0.4 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/mascot/steam.png" alt="" className="h-full w-full select-none" draggable={false} />
      </motion.div>

      {/* happy closed eyes while sipping */}
      <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <motion.g initial={false} animate={play ? { opacity: [0, 0, 1, 1, 0, 0] } : { opacity: 0 }} transition={play ? loop : { duration: 0.2 }}>
          <circle cx={210} cy={288} r={13} fill="#fff" />
          <circle cx={353} cy={277} r={13} fill="#fff" />
          <path d="M199 290 Q 210 280 221 290" fill="none" stroke="#000" strokeWidth={6} strokeLinecap="round" />
          <path d="M342 279 Q 353 269 364 279" fill="none" stroke="#000" strokeWidth={6} strokeLinecap="round" />
        </motion.g>
      </svg>
      </div>
    </div>
  );
}
