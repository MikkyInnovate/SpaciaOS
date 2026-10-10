"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { en, type Dict } from "./dict.en";
import { fr } from "./dict.fr";

/* English/French for the Pixel pages. The server always renders English; the
   browser then swaps to the saved choice, or French for French-language browsers. */

export type Locale = "en" | "fr";
export const DICTS: Record<Locale, Dict> = { en, fr };

const KEY = "spacia-locale";
const listeners = new Set<() => void>();
let current: Locale | null = null;

function read(): Locale {
  if (current) return current;
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "en" || saved === "fr") return (current = saved);
  } catch {
    // storage unavailable: fall through to the browser language
  }
  return (current = navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en");
}

export function setLocale(l: Locale) {
  current = l;
  try {
    window.localStorage.setItem(KEY, l);
  } catch {
    // keep it for this visit only
  }
  listeners.forEach((cb) => cb());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const LocaleContext = createContext<Locale>("en");

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, read, () => "en" as Locale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT(): Dict {
  return DICTS[useContext(LocaleContext)];
}

/** Fill `{name}` placeholders. */
export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
