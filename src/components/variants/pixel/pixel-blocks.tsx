"use client";

import { motion } from "motion/react";

/**
 * Plasma-style pixel-block artwork: a coarse grid of green squares in three
 * tones. A pattern map draws a stepped "S" glyph; cells pop in on scroll.
 */

// 0 = light, 1 = mid, 2 = deep. 8 x 8 map.
const MAP = [
  "11122222",
  "10022222",
  "10000221",
  "11000011",
  "12200001",
  "22222001",
  "22222111",
  "22221111",
];

const TONES = ["#6fbf95", "#2f8a5f", "#0d4a36"];

export function PixelBlocks({ className, map = MAP }: { className?: string; map?: string[] }) {
  const cols = map[0].length;
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      variants={{ hidden: {}, show: {} }}
      className={`grid aspect-square ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {map.flatMap((row, r) =>
        row.split("").map((v, c) => (
          <motion.span
            key={`${r}-${c}`}
            // tiles assemble in a diagonal wave from the top-left corner
            variants={{
              hidden: { opacity: 0, scale: 0.2, rotate: -12 },
              show: {
                opacity: 1,
                scale: 1,
                rotate: 0,
                transition: { type: "spring", stiffness: 300, damping: 20, delay: (r + c) * 0.045 },
              },
            }}
            style={{ background: TONES[Number(v)] }}
          />
        ))
      )}
    </motion.div>
  );
}
