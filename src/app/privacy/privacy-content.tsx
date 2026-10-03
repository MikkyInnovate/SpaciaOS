"use client";

import { useMemo } from "react";
import Link from "next/link";
import { SpaciaLogo } from "@/components/brand/spacia-logo";
import { PixelFooter } from "@/components/variants/pixel/pixel-footer";
import { MotionRoot } from "@/components/marketing/motion";
import { SmoothAnchors } from "@/components/variants/pixel/smooth-anchors";
import { useT } from "@/components/variants/pixel/i18n";
import { ScrollSpyToc } from "@/components/variants/pixel/scrollspy-toc";

// TODO(legal): replace with the real privacy contact and have a Nigerian data-protection lawyer review this page.
const CONTACT = "privacy@[your-domain]";
const UPDATED = new Date("2026-10-03T00:00:00Z");

/** Dictionary copy marks bold with **…** and the contact address with {contact}. */
function rich(text: string) {
  return text
    .replace("{contact}", CONTACT)
    .split(/\*\*(.+?)\*\*/)
    .map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

export function PrivacyContent() {
  const dict = useT();
  const t = dict.privacyPolicy;
  const tocItems = useMemo(() => t.sections.map((s) => ({ id: s.id, title: s.title })), [t.sections]);
  return (
    <MotionRoot>
      <SmoothAnchors offset={24} />
      <div className="min-h-screen bg-[#f4f4f2] text-zinc-950">
        <header className="flex items-center justify-between px-5 py-5 sm:px-10">
          <Link href="/" aria-label={dict.common.homeAria}>
            <SpaciaLogo className="text-[19px]" />
          </Link>
          <Link
            href="/waitlist"
            className="bg-zinc-950 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#15803d]"
          >
            {dict.common.joinWaitlist}
          </Link>
        </header>

        <main className="px-5 pb-24 pt-10 sm:px-10 sm:pt-16">
          <div className="mx-auto max-w-6xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#15803d]">[ {t.legal} ]</span>
            <h1 className="font-display mt-4 text-[clamp(36px,4.4vw,60px)] font-light leading-[1.02] tracking-[-0.04em] text-[#14231d]">
              {t.title}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-500">
              {t.intro}
            </p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400">
              {t.updated} {UPDATED.toLocaleDateString(dict.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
            </p>

            <div className="mt-14 grid gap-12 border-t border-zinc-200 pt-12 lg:grid-cols-[220px_1fr]">
              {/* contents */}
              <div className="lg:sticky lg:top-8 lg:self-start">
                <ScrollSpyToc items={tocItems} label={t.onThisPage} />
              </div>

              {/* body */}
              <div className="max-w-2xl space-y-12">
                {t.sections.map((s, i) => (
                  <section key={s.id} id={s.id} className="scroll-mt-8">
                    <div className="font-mono text-[11px] text-zinc-400">{String(i + 1).padStart(2, "0")}</div>
                    <h2 className="font-display mt-1 text-[24px] font-light tracking-[-0.03em] text-[#14231d] sm:text-[28px]">
                      {s.title}
                    </h2>
                    <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-zinc-600 [&_li]:relative [&_li]:pl-5 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.65em] [&_li]:before:h-1.5 [&_li]:before:w-1.5 [&_li]:before:bg-[#15803d] [&_strong]:font-medium [&_strong]:text-zinc-900 [&_ul]:space-y-1.5">
                      {s.blocks.map((b, k) =>
                        "p" in b ? <p key={k}>{rich(b.p)}</p> : <ul key={k}>{b.ul.map((li) => <li key={li}>{rich(li)}</li>)}</ul>,
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </main>

        <PixelFooter />
      </div>
    </MotionRoot>
  );
}
