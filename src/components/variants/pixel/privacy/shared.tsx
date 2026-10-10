"use client";

import { useEffect, useRef, useState } from "react";

export const SCANLINES: React.CSSProperties = {
  backgroundImage: "repeating-linear-gradient(0deg, rgba(134,239,172,0.07) 0 1px, transparent 1px 5px)",
};

/** True while the element is on screen (used to pause loops). */
export function useOnScreen<T extends Element>() {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on] as const;
}

/** A ticking counter (ms) that runs only while `active`. */
export function useTicker(active: boolean, step = 100) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setT((v) => v + step), step);
    return () => window.clearInterval(id);
  }, [active, step]);
  return t;
}

export const mmss = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export function Waveform({ active, bars = 28, className = "" }: { active: boolean; bars?: number; className?: string }) {
  return (
    <div className={`flex h-8 items-center gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-[#22c55e] ${active ? "wl-wave" : ""}`}
          style={{
            height: `${Math.round(25 + Math.abs(Math.sin(i * 0.9)) * 75)}%`,
            animationDelay: `${(-(i % 7) * 0.13).toFixed(2)}s`,
            opacity: active ? 1 : 0.45,
          }}
        />
      ))}
    </div>
  );
}
