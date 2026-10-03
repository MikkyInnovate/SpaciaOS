"use client";

import { LanguageProvider } from ".";
import { LanguageSwitcher } from "./language-switcher";
import { CurrencyProvider, type Currency } from "../pricing-currency";

/** Language + currency context and the floating language pill for a Pixel page. */
export function PixelShell({ currency = null, children }: { currency?: Currency | null; children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CurrencyProvider value={currency}>
        {children}
        <LanguageSwitcher />
      </CurrencyProvider>
    </LanguageProvider>
  );
}
