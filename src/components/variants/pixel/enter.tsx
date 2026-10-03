"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

/* Scroll-entrance helpers: an EnterGroup reveals its EnterItems one after another
   the first time it scrolls into view. Items choose where they come from.
   Groups can nest: an inner group with `nested` waits for its parent instead of
   watching the viewport itself. */

const EASE = [0.16, 1, 0.3, 1] as const;

export type From = "up" | "left" | "right" | "scale" | "wipe" | "wipeLeft" | "pixel" | "fade";

const FROM: Record<From, Variants["hidden"]> = {
  up: { opacity: 0, y: 26, filter: "blur(6px)" },
  left: { opacity: 0, x: -36, filter: "blur(6px)" },
  right: { opacity: 0, x: 36, filter: "blur(6px)" },
  scale: { opacity: 0, scale: 0.86, filter: "blur(6px)" },
  fade: { opacity: 0 },
  wipe: { opacity: 1, clipPath: "inset(0% 0% 100% 0%)" },
  wipeLeft: { opacity: 1, clipPath: "inset(0% 100% 0% 0%)" },
  pixel: { opacity: 1, clipPath: "inset(0% 0% 100% 0%)" },
};
const SHOW: Record<From, Variants["show"]> = {
  up: { opacity: 1, y: 0, filter: "blur(0px)" },
  left: { opacity: 1, x: 0, filter: "blur(0px)" },
  right: { opacity: 1, x: 0, filter: "blur(0px)" },
  scale: { opacity: 1, scale: 1, filter: "blur(0px)" },
  fade: { opacity: 1 },
  wipe: { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" },
  wipeLeft: { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" },
  // a stepped, "pixel" reveal: the panel builds in four hard bands
  pixel: {
    opacity: 1,
    clipPath: ["inset(0% 0% 100% 0%)", "inset(0% 0% 75% 0%)", "inset(0% 0% 50% 0%)", "inset(0% 0% 25% 0%)", "inset(0% 0% 0% 0%)"],
  },
};
const DURATION: Partial<Record<From, number>> = { wipe: 1, wipeLeft: 1, pixel: 0.7, fade: 0.6 };

export function EnterGroup({
  children,
  className,
  stagger = 0.1,
  delay = 0,
  amount = 0.25,
  nested = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  amount?: number;
  nested?: boolean;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  const variants: Variants = { hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } };
  // reduced motion: everything simply appears in its final state
  if (reduce) return <motion.div className={className} style={style} initial="show" animate="show" variants={variants}>{children}</motion.div>;
  if (nested) return <motion.div className={className} style={style} variants={variants}>{children}</motion.div>;
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

export function EnterItem({
  children,
  className,
  from = "up",
  style,
  duration,
}: {
  children?: React.ReactNode;
  className?: string;
  from?: From;
  style?: React.CSSProperties;
  duration?: number;
}) {
  const d = duration ?? DURATION[from] ?? 0.75;
  return (
    <motion.div
      className={className}
      style={style}
      variants={{
        hidden: FROM[from],
        show: {
          ...SHOW[from],
          transition:
            from === "pixel"
              ? { duration: d, ease: "linear", times: [0, 0.25, 0.5, 0.75, 1] }
              : { duration: d, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** A 1px rule that draws itself in (inside an EnterGroup). */
export function DrawLine({ className = "", vertical = false }: { className?: string; vertical?: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`block ${vertical ? "w-px origin-top" : "h-px origin-left"} ${className}`}
      variants={{
        hidden: vertical ? { scaleY: 0 } : { scaleX: 0 },
        show: { ...(vertical ? { scaleY: 1 } : { scaleX: 1 }), transition: { duration: 0.9, ease: EASE } },
      }}
    />
  );
}

/** Pixel cells that pop in one by one (inside an EnterGroup). */
export function PopCell({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <motion.span
      className={className}
      style={style}
      variants={{
        hidden: { scale: 0, opacity: 0 },
        show: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 420, damping: 22 } },
      }}
    />
  );
}
