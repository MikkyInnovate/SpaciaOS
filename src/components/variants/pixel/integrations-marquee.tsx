"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { Database, Globe, Webhook, type LucideIcon } from "lucide-react";
import { BRAND_ICONS } from "@/components/brand/brand-icons";
import { useT } from "./i18n";
import type { Dict } from "./i18n/dict.en";

type Brand = keyof typeof BRAND_ICONS;
type Item = { label: string; brand?: Brand; icon?: LucideIcon };
type Source = Omit<Item, "label"> & { key: keyof Dict["marquee"]["items"] };

const SOURCES: Source[] = [
  { key: "whatsapp", brand: "whatsapp" },
  { key: "websiteForms", icon: Globe },
  { key: "anyLeadForm", icon: Webhook },
  { key: "googleCalendar", brand: "googlecalendar" },
  { key: "hubspot", brand: "hubspot" },
  { key: "emailAlerts", brand: "gmail" },
  { key: "yourListings", icon: Database },
];

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

function Tile({ label, brand, icon: Icon }: Item) {
  const mark = brand ? BRAND_ICONS[brand] : null;
  return (
    <span className="flex shrink-0 items-center gap-6 font-mono text-[12px] uppercase tracking-[0.14em]">
      <span
        className="group flex items-center gap-2.5 text-zinc-600 transition-colors duration-200 hover:text-zinc-950"
        style={{ ["--brand" as string]: mark?.color ?? "#15803d" }}
      >
        {mark ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-zinc-400 transition-[fill,transform] duration-300 group-hover:scale-110 group-hover:fill-[var(--brand)]" aria-hidden="true">
            <path d={mark.path} />
          </svg>
        ) : (
          Icon && (
            <Icon
              className="h-4 w-4 text-zinc-400 transition-[color,transform] duration-300 group-hover:scale-110 group-hover:text-[var(--brand)]"
              strokeWidth={1.75}
            />
          )
        )}
        {label}
      </span>
      <span className="text-zinc-300" aria-hidden="true">
        /
      </span>
    </span>
  );
}

/** A marquee row whose speed follows scroll velocity (and reverses with scroll direction). */
function VelocityRow({ items, baseSpeed }: { items: Item[]; baseSpeed: number }) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const direction = useRef(1);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = direction.current * baseSpeed * (delta / 1000);
    if (factor.get() < 0) direction.current = -1;
    else if (factor.get() > 0) direction.current = 1;
    move += direction.current * move * factor.get();
    baseX.set(baseX.get() + move);
  });

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <motion.div style={{ x }} className="flex w-max gap-6 py-1">
        {[0, 1, 2, 3].map((copy) => (
          <div key={copy} className="flex gap-6" aria-hidden={copy > 0 || undefined}>
            {items.map((it) => (
              <Tile key={it.label} {...it} />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function IntegrationsMarquee() {
  const t = useT().marquee;
  const items = SOURCES.map(({ key, ...rest }) => ({ ...rest, label: t.items[key] }));
  return (
    <section className="border-b border-zinc-200 py-10 sm:py-12">
      <div className="mb-6 flex flex-col justify-between gap-2 px-5 font-mono text-[11px] uppercase tracking-[0.14em] sm:flex-row sm:items-end sm:px-10">
        <span className="flex items-center gap-2 text-zinc-950">
          <span className="inline-block h-3.5 w-2 animate-pulse bg-[#15803d]" aria-hidden="true" />
          {t.heading}
        </span>
      </div>

      <VelocityRow items={items} baseSpeed={-2.2} />
    </section>
  );
}
