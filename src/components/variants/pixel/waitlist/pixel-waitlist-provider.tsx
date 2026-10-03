"use client";

import { useMemo } from "react";
import { WaitlistProvider } from "@/components/waitlist/waitlist-context";
import { useLocale, useT } from "../i18n";

/** WaitlistProvider with toasts in the visitor's language. */
export function PixelWaitlistProvider({ children }: { children: React.ReactNode }) {
  const t = useT().waitlistForm;
  const locale = useLocale();
  const messages = useMemo(
    () => ({
      joinError: t.genericError,
      joined: t.toastJoined,
      alreadyJoined: t.toastAlreadyJoined,
      profileError: t.profileError,
      profileSaved: t.toastProfileSaved,
      networkError: t.networkError,
      // the API's validation messages are English-only
      useApiErrors: locale === "en",
    }),
    [t, locale],
  );
  return <WaitlistProvider messages={messages}>{children}</WaitlistProvider>;
}
