"use client";

import { useEffect, useRef } from "react";

/* Intro counter 00 → 100. Driven by JavaScript so it counts in every browser (Safari
   doesn't animate CSS counters fed by @property). Timing is measured from navigation
   start, so it stays in step with the CSS pixel bar even if the script loads late. */

const DURATION = 1500;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

export function IntroCount() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, performance.now() / DURATION);
      el.textContent = String(Math.round(easeOut(t) * 100)).padStart(2, "0");
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span ref={ref} className="tabular-nums">
      00
    </span>
  );
}
