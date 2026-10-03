"use client";

import { HumanPhoto } from "./human-photo";
import { Label } from "./sections";
import { useT } from "./i18n";

/** Left column of the FAQ: heading plus a small, sticky "ask a real person" card. */
export function FaqAside({ subtitle }: { subtitle?: string }) {
  const t = useT();
  return (
    <div className="lg:sticky lg:top-8">
      <Label>{t.faq.label}</Label>
      <h2 className="font-display mt-4 text-[32px] font-light leading-[1.05] tracking-[-0.035em] text-[#14231d] sm:text-[42px]">
        {t.faq.title}
      </h2>
      <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-zinc-500">
        {subtitle ?? t.faq.waitlistSubtitle}
      </p>

      <div className="mt-10 flex max-w-sm items-center gap-4 bg-white p-4 ring-1 ring-zinc-200">
        <HumanPhoto
          shots={[{ src: "/images/people/support.jpg", alt: t.faq.supportAlt, position: "62% 30%" }]}
          sizes="80px"
          className="h-20 w-20 shrink-0"
        />
        <div>
          <div className="text-[15px] text-[#14231d]">{t.faq.stillQuestion}</div>
          <p className="mt-1 text-[13px] leading-snug text-zinc-500">
            {t.faq.stillBody}
          </p>
        </div>
      </div>
    </div>
  );
}
