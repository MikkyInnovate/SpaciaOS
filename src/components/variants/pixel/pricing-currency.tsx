"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { EU, type Currency } from "./currency-region";
import { useT } from "./i18n";

/* Regional pricing: set, rounded prices per market (not live FX conversion).
   The market comes from the visitor's IP country (see currency-region.ts), passed
   in through <CurrencyProvider>. With no country header (local dev), the browser
   falls back to guessing from its time zone / region. */

export type { Currency };
export type PlanId = "starter" | "growth" | "scale";

// TODO(pricing): confirm these with the founders. NGN are the agreed prices; others are proposals.
const PRICES: Record<Currency, Record<PlanId, { amount: string; plus?: boolean }>> = {
  // charm pricing: every price ends in 99
  NGN: { starter: { amount: "₦99,999" }, growth: { amount: "₦249,999" }, scale: { amount: "₦499,999", plus: true } },
  USD: { starter: { amount: "$79.99" }, growth: { amount: "$199.99" }, scale: { amount: "$399.99", plus: true } },
  GBP: { starter: { amount: "£64.99" }, growth: { amount: "£159.99" }, scale: { amount: "£319.99", plus: true } },
  EUR: { starter: { amount: "€74.99" }, growth: { amount: "€184.99" }, scale: { amount: "€369.99", plus: true } },
};

function detect(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Africa/Lagos") return "NGN";
    if (tz === "Europe/London") return "GBP";
    const region = (navigator.language.split("-")[1] || "").toUpperCase();
    if (region === "NG") return "NGN";
    if (region === "GB") return "GBP";
    if (EU.has(region) || (tz.startsWith("Europe/") && tz !== "Europe/London")) return "EUR";
    return "USD";
  } catch {
    return "NGN";
  }
}

const CurrencyContext = createContext<Currency | null>(null);

export function CurrencyProvider({ value, children }: { value: Currency | null; children: React.ReactNode }) {
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

const noop = () => () => {};

/** The server's country-based pick wins; without one the browser guesses after hydration. */
export function useCurrency(): Currency {
  const fromIp = useContext(CurrencyContext);
  return useSyncExternalStore(noop, () => fromIp ?? detect(), () => fromIp ?? "NGN");
}

export function PlanPrice({ plan, featured = false }: { plan: PlanId; featured?: boolean }) {
  const c = useCurrency();
  const t = useT();
  const p = PRICES[c][plan];
  return (
    <>
      <span className="font-display text-[40px] font-medium tracking-tight">
        {p.amount}
        {p.plus ? "+" : ""}
      </span>
      <span className={`font-mono text-[11px] ${featured ? "text-emerald-100" : "text-zinc-400"}`}>{t.common.perMonth}</span>
    </>
  );
}
