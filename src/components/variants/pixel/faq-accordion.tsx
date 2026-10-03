"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** One-open-at-a-time FAQ with a smooth height + fade reveal. */
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const base = useId();

  return (
    <motion.div
      className="divide-y divide-zinc-200 border-y border-zinc-200"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
    >
      {items.map((f, i) => {
        const isOpen = open === i;
        const panelId = `${base}-panel-${i}`;
        return (
          <motion.div
            key={f.q}
            className="relative"
            // questions rise in one after another as the FAQ enters
            variants={{
              hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
              show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
            }}
          >
            {/* thin green rule that draws across the top of the open item */}
            <motion.span
              aria-hidden="true"
              className="absolute left-0 top-[-1px] h-px origin-left bg-[#15803d]"
              initial={false}
              animate={{ width: isOpen ? "100%" : "0%" }}
              transition={{ duration: 0.5, ease: EASE }}
            />
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : i)}
              className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left font-mono text-[13px] uppercase tracking-[0.08em] text-zinc-950"
            >
              <span className={`transition-colors duration-300 ${isOpen ? "text-[#15803d]" : "group-hover:text-[#15803d]"}`}>{f.q}</span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center ring-1 transition-colors duration-300 ${
                  isOpen ? "bg-[#15803d] text-white ring-[#15803d]" : "text-zinc-400 ring-zinc-300 group-hover:ring-[#15803d] group-hover:text-[#15803d]"
                }`}
              >
                <motion.span initial={false} animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.4, ease: EASE }} className="flex">
                  <Plus className="h-3.5 w-3.5" />
                </motion.span>
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ height: { duration: 0.45, ease: EASE }, opacity: { duration: 0.3 } }}
                  className="overflow-hidden"
                >
                  <motion.p
                    initial={{ y: -6, filter: "blur(4px)" }}
                    animate={{ y: 0, filter: "blur(0px)" }}
                    exit={{ y: -6, filter: "blur(4px)" }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="pb-6 pr-12 text-[14px] leading-relaxed text-zinc-500"
                  >
                    {f.a}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
