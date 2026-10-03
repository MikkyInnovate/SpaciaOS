"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/**
 * "On this page" contents that tracks where you are: the active section's title turns
 * green, a green bar glides beside it, and a hairline fills with reading progress.
 */
export function ScrollSpyToc({ items, label }: { items: { id: string; title: string }[]; label: string }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(items[0]?.id);
  const listRef = useRef<HTMLOListElement>(null);
  const [bar, setBar] = useState({ top: 0, height: 0 });

  // the active section is the last one whose top has passed 35% of the viewport
  useEffect(() => {
    const onScroll = () => {
      const line = window.innerHeight * 0.35;
      let current = items[0]?.id;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= line) current = it.id;
      }
      // at the very bottom, light up the last section
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = items[items.length - 1]?.id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  // position the gliding bar beside the active item
  useLayoutEffect(() => {
    const li = listRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (li) setBar({ top: li.offsetTop, height: li.offsetHeight });
  }, [active]);

  // reading progress across the whole document
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 30, mass: 0.4 });

  return (
    <nav aria-label={label}>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">{label}</div>
      <div className="relative mt-4">
        {/* rail + progress fill */}
        <span aria-hidden="true" className="absolute left-0 top-0 h-full w-px bg-zinc-200" />
        <motion.span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-px origin-top bg-[#15803d]/40"
          style={{ scaleY: reduce ? scrollYProgress : progress }}
        />
        {/* gliding active marker */}
        <motion.span
          aria-hidden="true"
          className="absolute -left-px w-[3px] bg-[#15803d]"
          initial={false}
          animate={{ top: bar.top, height: bar.height }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
        />
        <ol ref={listRef} className="space-y-1 pl-4 text-[13px]">
          {items.map((s, i) => {
            const on = s.id === active;
            return (
              <li key={s.id} data-id={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={on ? "location" : undefined}
                  className={`group flex gap-2 py-1 transition-colors duration-300 ${on ? "text-[#14231d]" : "text-zinc-500 hover:text-[#15803d]"}`}
                >
                  <span
                    className={`font-mono text-[11px] transition-colors duration-300 ${on ? "text-[#15803d]" : "text-zinc-300 group-hover:text-[#15803d]"}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`transition-[font-weight] ${on ? "font-medium" : ""}`}>{s.title}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
