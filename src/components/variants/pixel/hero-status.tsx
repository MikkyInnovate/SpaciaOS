"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const DEFAULT_FEED = [
  "Portal lead → called 00:03",
  "WhatsApp lead → qualified",
  "Ad lead → viewing booked",
  "Web lead → agent took over",
];

/** Live status chip: animated pixel signal + a rotating feed of product moments. */
export function HeroStatus({ feed = DEFAULT_FEED, label = "Live" }: { feed?: string[]; label?: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % feed.length), 2600);
    return () => window.clearInterval(id);
  }, [reduce, feed.length]);

  return (
    <div className="inline-flex max-w-full items-stretch border border-zinc-900/15 bg-white font-mono text-[11px] uppercase tracking-[0.12em] shadow-[3px_3px_0_0_rgba(13,74,54,0.12)]">
      <style>{`
        @keyframes vc-bar { 0%,100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
        .vc-bar { animation: vc-bar 0.9s steps(4, end) infinite; transform-origin: bottom; }
        @media (prefers-reduced-motion: reduce) { .vc-bar { animation: none; } }
      `}</style>
      <span className="flex shrink-0 items-center gap-2 bg-[#0d4a36] px-2.5 py-1.5 text-[#86efac]">
        <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
          {[0, 0.2, 0.45, 0.1].map((d, k) => (
            <span key={k} className="vc-bar h-full w-[3px] bg-[#22c55e]" style={{ animationDelay: `${-d}s` }} />
          ))}
        </span>
        {label}
      </span>
      <span className="relative flex min-w-0 items-center overflow-hidden px-3 py-1.5 text-zinc-700" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={i}
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-110%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="block truncate"
          >
            {feed[i]}
            <span className="ml-1.5 text-[#15803d]">✓</span>
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}
