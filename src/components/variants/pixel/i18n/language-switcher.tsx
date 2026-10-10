"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronUp } from "lucide-react";
import { DICTS, setLocale, useLocale, useT, type Locale } from ".";

const OPTIONS: Locale[] = ["en", "fr"];

function Flag({ locale, className = "" }: { locale: Locale; className?: string }) {
  if (locale === "fr") {
    return (
      <svg viewBox="0 0 3 2" className={className} aria-hidden="true">
        <rect width="1" height="2" fill="#002654" />
        <rect x="1" width="1" height="2" fill="#fff" />
        <rect x="2" width="1" height="2" fill="#ce1126" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true">
      <clipPath id="uk-clip">
        <path d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z" />
      </clipPath>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" clipPath="url(#uk-clip)" stroke="#C8102E" strokeWidth="5" />
      <path d="M30,0 v40 M0,20 h60" stroke="#fff" strokeWidth="12" />
      <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="7" />
    </svg>
  );
}

/** Floating EN/FR pill, bottom-left. */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="fixed z-[60]"
      style={{ left: "calc(16px + env(safe-area-inset-left, 0px))", bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={t.switcher.label}
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "bottom left" }}
            className="absolute bottom-full left-0 mb-2 w-44 rounded-2xl bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(6,20,15,0.35)] ring-1 ring-zinc-900/10"
          >
            {OPTIONS.map((l) => {
              const active = l === locale;
              return (
                <button
                  key={l}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setLocale(l);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors hover:bg-zinc-100 ${
                    active ? "font-semibold text-zinc-950" : "text-zinc-600"
                  }`}
                >
                  <Flag locale={l} className="h-3.5 w-5 shrink-0 rounded-[2px] ring-1 ring-black/10" />
                  <span className="flex-1">{DICTS[l].langName}</span>
                  {active && <Check className="h-4 w-4 text-[#15803d]" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.switcher.label}: ${t.langName}`}
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-br from-[#0d4a36] to-[#15803d] py-2 pl-2.5 pr-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_24px_-8px_rgba(13,74,54,0.6)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
      >
        <Flag locale={locale} className="h-3.5 w-5 rounded-[2px] ring-1 ring-white/30" />
        {locale.toUpperCase()}
        <ChevronUp className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "" : "rotate-180"}`} />
      </button>
    </div>
  );
}
