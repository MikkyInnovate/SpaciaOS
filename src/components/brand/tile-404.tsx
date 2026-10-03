"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/* "404" built from real estate photo tiles (after the hxön page in the Design
   Brain, frame 3021). Hovering sends a flip wave out from the cursor and every
   tile turns over to a new property; the tiles never leave the grid. */

const GLYPHS: Record<string, string[]> = {
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "0": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
};
const WORD = "404";
const COLS = WORD.length * 6 - 1;
const ROWS = 7;

// Small (360px) square crops, served as-is
const PHOTOS = Array.from({ length: 18 }, (_, i) => `/images/homes/tiles/t${i + 1}.jpg`);

const CELLS: { col: number; row: number }[] = [];
[...WORD].forEach((ch, li) => {
  GLYPHS[ch].forEach((line, row) =>
    [...line].forEach((bit, x) => {
      if (bit === "1") CELLS.push({ col: li * 6 + x, row });
    })
  );
});

// Spread photos so neighbouring tiles never repeat (7 is coprime with 18);
// every wave shifts the whole set so each tile lands on a new property
const photoFor = (i: number, wave: number) => PHOTOS[(i * 7 + ((wave * 5) % PHOTOS.length) + PHOTOS.length) % PHOTOS.length];

type Wave = { id: number; col: number; row: number };

export function Tile404() {
  const reduce = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const [wave, setWave] = useState<Wave>({ id: 0, col: COLS / 2, row: ROWS / 2 });
  const hover = useRef<{ col: number; row: number } | null>(null);
  const last = useRef(0);

  const flip = (col: number, row: number) => {
    const now = Date.now();
    if (reduce || now - last.current < 1400) return; // let each wave finish
    last.current = now;
    setWave((w) => ({ id: w.id + 1, col, row }));
  };

  const cellAt = (e: React.PointerEvent) => {
    const r = gridRef.current!.getBoundingClientRect();
    return { col: ((e.clientX - r.left) / r.width) * COLS, row: ((e.clientY - r.top) / r.height) * ROWS };
  };

  // while hovering, a fresh wave rolls out from the cursor every couple of seconds;
  // when idle, a gentle wave starts from a random spot now and then
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      if (hover.current) flip(hover.current.col, hover.current.row);
      else if (Math.random() < 0.35) flip(Math.random() * COLS, Math.random() * ROWS);
    }, 2400);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const even = wave.id % 2 === 0 ? wave.id : wave.id - 1;
  const odd = wave.id % 2 === 1 ? wave.id : wave.id + 1;

  return (
    <div
      ref={gridRef}
      className="grid w-[min(92vw,760px)] gap-[clamp(2px,0.5vw,5px)] [perspective:900px]"
      style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      onPointerEnter={(e) => {
        const c = cellAt(e);
        hover.current = c;
        flip(c.col, c.row);
      }}
      onPointerMove={(e) => (hover.current = cellAt(e))}
      onPointerLeave={() => (hover.current = null)}
      aria-hidden="true"
    >
      {/* warm the cache so a flip never reveals an empty tile */}
      <div className="hidden">
        {PHOTOS.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" />
        ))}
      </div>

      {CELLS.map((cell, i) => {
        const dist = Math.hypot(cell.col - wave.col, cell.row - wave.row);
        return (
          <motion.div
            key={`${cell.col}-${cell.row}`}
            className="relative aspect-square bg-[#e7e7e4] shadow-[0_6px_14px_-8px_rgba(6,20,15,0.45)] [transform-style:preserve-3d]"
            style={{ gridColumn: cell.col + 1, gridRow: cell.row + 1 }}
            initial={reduce ? false : { opacity: 0, y: 14, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -3, scale: 1.06, zIndex: 10, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 240, damping: 22, delay: reduce ? 0 : 0.1 + i * 0.02 }}
          >
            {/* two-sided card: the hidden face takes the next photo, then the card turns */}
            <motion.div
              className="absolute inset-0 [transform-style:preserve-3d]"
              initial={false}
              animate={{ rotateY: wave.id * 180 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : dist * 0.045 }}
            >
              <div className="absolute inset-0 overflow-hidden [backface-visibility:hidden]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoFor(i, even)} alt="" className="h-full w-full object-cover" draggable={false} />
              </div>
              <div className="absolute inset-0 overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoFor(i, odd)} alt="" className="h-full w-full object-cover" draggable={false} />
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
