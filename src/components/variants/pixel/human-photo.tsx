"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export type Shot = { src: string; alt: string; position?: string };

/**
 * Real photography with the Pixel treatment: a soft green scanline veil and a
 * slight desaturation that lift on hover. Given several shots, it rotates
 * through them with a scanline wipe (paused on hover, off-screen, or when the
 * viewer prefers reduced motion).
 */
export function HumanPhoto({
  shots,
  sizes = "(min-width: 1024px) 40vw, 100vw",
  interval = 5200,
  delay = 0,
  className = "",
  children,
}: {
  shots: Shot[];
  sizes?: string;
  interval?: number;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(0);
  const [shown, setShown] = useState(0);
  if (index !== shown) {
    // remember the outgoing shot so it stays underneath while the new one wipes in
    setPrev(shown);
    setShown(index);
  }
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rotating = shots.length > 1 && !reduce && visible && !hovered;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!rotating) return;
    let id = 0;
    const start = window.setTimeout(() => {
      setIndex((i) => (i + 1) % shots.length);
      id = window.setInterval(() => setIndex((i) => (i + 1) % shots.length), interval);
    }, interval + delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [rotating, interval, delay, shots.length]);


  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative overflow-hidden bg-[#0d4a36] ${className}`}
    >
      {/* Every shot stays mounted (so it's loaded before it's needed). The current shot
          wipes in on top while the previous one stays fully visible underneath. */}
      {shots.map((sh, i) => {
        const current = i === index;
        const below = i === prev && !current;
        return (
          <motion.div
            key={sh.src}
            className="absolute inset-0"
            initial={false}
            animate={{ clipPath: current || below ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }}
            transition={current ? { duration: 1.1, ease: [0.65, 0, 0.35, 1] } : { duration: 0 }}
            style={{ zIndex: current ? 2 : below ? 1 : 0 }}
          >
            <Image
              src={sh.src}
              alt={current ? sh.alt : ""}
              fill
              sizes={sizes}
              loading="eager"
              className="object-cover saturate-[0.75] transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.03] group-hover:saturate-100"
              style={{ objectPosition: sh.position ?? "center" }}
            />
            {current && index !== prev && (
              <motion.div
                key={`band-${index}`}
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 h-16 -translate-y-full"
                initial={{ top: "0%", opacity: 1 }}
                animate={{ top: "100%", opacity: 0 }}
                transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(134,239,172,0.55) 0 1px, transparent 1px 4px), linear-gradient(to bottom, transparent, rgba(34,197,94,0.35))",
                }}
              />
            )}
          </motion.div>
        );
      })}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] opacity-70 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-0"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(13,74,54,0.28) 0 1px, transparent 1px 4px)" }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[#06140f]/55 via-transparent to-transparent" />

      {shots.length > 1 && (
        <div className="absolute right-3 top-3 z-[3] flex gap-1" aria-hidden="true">
          {shots.map((s, i) => (
            <span key={s.src} className={`h-1 transition-all duration-500 ${i === index ? "w-5 bg-white" : "w-2 bg-white/50"}`} />
          ))}
        </div>
      )}
      <div className="relative z-[3] h-full">{children}</div>
    </div>
  );
}
