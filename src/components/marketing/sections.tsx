import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Check,
  Headphones,
  Mail,
  MessageCircle,
  PhoneIncoming,
  PhoneMissed,
  Plus,
  Send,
  ShieldCheck,
  Sliders,
  Voicemail,
  Zap,
} from "lucide-react";
import { WaitlistEmailForm } from "@/components/waitlist/waitlist-email-form";
import { BRAND_BUTTON } from "./brand";
import { Reveal, Stagger, StaggerItem } from "./motion";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#15803d]/[0.07] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#15803d] ring-1 ring-[#15803d]/15">
      {children}
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group flex items-center gap-2 ${className}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 font-mono text-[11px] font-bold text-white transition-colors duration-300 group-hover:bg-[#15803d]">
        S
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-zinc-950">SpaciaOS</span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

const DEFAULT_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#perks", label: "Cohort perks" },
  { href: "#faq", label: "FAQ" },
  { href: "/#pricing", label: "Pricing" },
];

export function MarketingNav({
  links = DEFAULT_LINKS,
  ctaHref = "#join",
}: {
  links?: { href: string; label: string }[];
  ctaHref?: string;
}) {
  return (
    <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8">
      <Logo />
      <nav className="hidden items-center gap-7 text-[13px] text-zinc-500 md:flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="transition-colors hover:text-zinc-950">
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="hidden rounded-full px-3.5 py-2 text-[13px] text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-950 sm:inline-flex"
        >
          Sign in
        </Link>
        <Link
          href={ctaHref}
          className={`group inline-flex items-center gap-1 rounded-full px-4 py-2 text-[13px] font-medium ${BRAND_BUTTON}`}
        >
          Join waitlist <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* The chaos: floating app tiles                                       */
/* ------------------------------------------------------------------ */

type Tile = {
  pos: string;
  delay: string;
  badge?: string;
  chip?: string;
  tile: string;
  icon: React.ReactNode;
  mobile?: boolean;
};

const TILES: Tile[] = [
  { pos: "left-[4%] top-[30%]", delay: "0s", badge: "420", tile: "bg-[#25D366] text-white", icon: <MessageCircle className="h-7 w-7" fill="currentColor" /> },
  {
    pos: "left-[24%] top-[4%]", delay: "-2s", badge: "99+", tile: "bg-white text-zinc-900",
    icon: (
      <span className="flex flex-col items-center leading-none">
        <span className="text-[9px] font-semibold uppercase text-red-500">Sat</span>
        <span className="text-[22px] font-light">31</span>
      </span>
    ),
    mobile: true,
  },
  { pos: "left-[55%] top-[2%]", delay: "-4s", badge: "37", tile: "bg-white text-red-500", icon: <PhoneMissed className="h-7 w-7" />, mobile: true },
  { pos: "right-[5%] top-[14%]", delay: "-1s", chip: "New lead", tile: "bg-zinc-950 text-white", icon: <Building2 className="h-7 w-7" /> },
  { pos: "right-[3%] top-[62%]", delay: "-3s", badge: "1.2k", tile: "bg-white text-sky-600", icon: <Mail className="h-7 w-7" /> },
  { pos: "left-[16%] top-[70%]", delay: "-5s", chip: "Inbox full", tile: "bg-white text-zinc-700", icon: <Voicemail className="h-7 w-7" /> },
  { pos: "left-[52%] top-[80%]", delay: "-2.5s", badge: "64", tile: "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-white", icon: <Send className="h-6 w-6" />, mobile: true },
];

export function ChaosSection() {
  return (
    <section className="relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="wl-line" x1="0" x2="1">
            <stop offset="0" stopColor="#18181b" stopOpacity="0" />
            <stop offset="1" stopColor="#18181b" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#wl-line)" strokeWidth="0.15" vectorEffect="non-scaling-stroke">
          <path d="M12 40 C 20 34, 26 22, 30 14" vectorEffect="non-scaling-stroke" />
          <path d="M88 24 C 92 40, 94 52, 92 66" vectorEffect="non-scaling-stroke" />
          <path d="M60 84 C 70 82, 78 78, 90 70" vectorEffect="non-scaling-stroke" />
          <path d="M50 92 L 50 80" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>

      {TILES.map((t) => (
        <div
          key={t.pos}
          className={`wl-float absolute ${t.pos} ${t.mobile ? "" : "hidden md:block"}`}
          style={{ animationDelay: t.delay }}
          aria-hidden="true"
        >
          <div className="relative">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_14px_30px_-10px_rgba(24,24,27,0.35)] ring-1 ring-black/5 sm:h-16 sm:w-16 ${t.tile}`}
            >
              {t.icon}
            </div>
            {t.badge && (
              <span className="absolute -right-3 -top-3 rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                {t.badge}
              </span>
            )}
            {t.chip && (
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700 shadow-md ring-1 ring-zinc-200">
                {t.chip}
              </span>
            )}
          </div>
        </div>
      ))}

      <Reveal className="relative mx-auto max-w-3xl py-24 text-center sm:py-28">
        <h2 className="text-balance text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-zinc-950 sm:text-[52px]">
          Leads don&apos;t wait.
          <br />
          <span className="text-zinc-400">Right now, they&apos;re waiting on&nbsp;you.</span>
        </h2>
        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-6 font-mono text-[13px] leading-relaxed text-zinc-600 sm:grid-cols-3 sm:text-left">
          <p>New enquiries land while you&apos;re mid-inspection.</p>
          <p>Every hour without a reply, interest cools.</p>
          <p>Follow-ups are scattered across five different apps.</p>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works: bento                                                 */
/* ------------------------------------------------------------------ */

function StepCard({
  n,
  title,
  body,
  children,
}: {
  n: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <StaggerItem className="flex h-full flex-col justify-between gap-6 rounded-[22px] bg-white p-5 ring-1 ring-zinc-200/80 transition-[box-shadow,--tw-ring-color] duration-300 hover:shadow-[0_24px_40px_-24px_rgba(13,74,54,0.35)] hover:ring-[#15803d]/30">
      <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100">{children}</div>
      <div>
        <div className="font-mono text-[11px] text-zinc-400">{n}</div>
        <h3 className="mt-1 text-[17px] font-medium tracking-tight text-zinc-950">{title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{body}</p>
      </div>
    </StaggerItem>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-6 bg-zinc-50/80 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 max-w-xl text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-zinc-950 sm:text-[44px]">
              From enquiry to inspection, <span className="font-serif-accent italic text-[#15803d]">handled.</span>
            </h2>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-zinc-500">
            SpaciaOS plugs into your lead sources, calls every new enquiry, and only hands you the buyers worth your time.
          </p>
        </div>

        <Stagger className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Dark feature card */}
          <StaggerItem className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[22px] bg-zinc-950 p-6 text-white shadow-[0_30px_60px_-30px_rgba(13,74,54,0.8)] lg:row-span-2">
            <div
              className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-[130%] rounded-[50%] opacity-80 blur-2xl"
              style={{ background: "radial-gradient(ellipse at center, rgba(34,197,94,0.55), rgba(21,128,61,0.35) 35%, rgba(13,74,54,0) 70%)" }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
                backgroundSize: "10px 10px",
                maskImage: "radial-gradient(ellipse at 70% 0%, black, transparent 70%)",
                WebkitMaskImage: "radial-gradient(ellipse at 70% 0%, black, transparent 70%)",
              }}
            />
            <div className="relative">
              <h3 className="text-[22px] font-medium tracking-tight">Meet your AI sales agent</h3>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-zinc-400">
                A voice agent trained on your listings, your pricing, and the way your team talks to buyers. It works
                every lead, every hour, in natural conversation.
              </p>
            </div>

            <div className="relative space-y-4">
              <div className="flex h-16 items-center gap-[3px]" aria-hidden="true">
                {Array.from({ length: 42 }).map((_, i) => (
                  <span
                    key={i}
                    className="wl-wave w-[3px] rounded-full bg-gradient-to-t from-[#22c55e] to-white"
                    style={{
                      height: `${Math.round(18 + Math.abs(Math.sin(i * 0.7)) * 70)}%`,
                      animationDelay: `${-(i % 7) * 0.15}s`,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
                  </span>
                  <span className="text-[13px]">Live call · Lekki Phase 1 enquiry</span>
                </div>
                <span className="font-mono text-[12px] text-zinc-400">02:14</span>
              </div>
            </div>
          </StaggerItem>

          <StepCard n="01" title="Calls in seconds" body="The moment a lead lands from your ads, portal or website, SpaciaOS rings them back, while they still care.">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#15803d] text-white">
                <PhoneIncoming className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-zinc-900">New lead · Adaeze O.</div>
                <div className="text-[11px] text-zinc-500">4-bed duplex, Ikoyi</div>
              </div>
              <span className="rounded-full bg-[#15803d]/10 px-2 py-0.5 font-mono text-[11px] text-[#15803d]">00:03</span>
            </div>
          </StepCard>

          <StepCard n="02" title="Qualifies the buyer" body="Budget, timeline, financing and location, asked naturally and logged against the lead.">
            <ul className="grid grid-cols-2 gap-1.5 text-[12px]">
              {["Budget", "Timeline", "Financing", "Location"].map((k, i) => (
                <li key={k} className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-zinc-200">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full ${i < 3 ? "bg-[#15803d] text-white" : "bg-zinc-200 text-zinc-500"}`}>
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span className={i < 3 ? "text-zinc-900" : "text-zinc-400"}>{k}</span>
                </li>
              ))}
            </ul>
          </StepCard>

          <StepCard n="03" title="Books the inspection" body="Qualified buyers get a viewing slot booked straight into your team's calendar.">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-white leading-none ring-1 ring-zinc-200">
                <span className="text-[8px] font-semibold uppercase text-red-500">Sat</span>
                <span className="text-[17px]">14</span>
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-zinc-900">Inspection · 10:00</div>
                <div className="text-[11px] text-zinc-500">Banana Island · with Tunde</div>
              </div>
              <CalendarCheck className="h-4 w-4 text-[#15803d]" />
            </div>
          </StepCard>

          <StepCard n="04" title="You step in when it counts" body="Watch the transcript live and take over any call in one tap.">
            <div className="space-y-1.5 text-[12px]">
              <p className="w-fit max-w-[85%] rounded-xl rounded-bl-sm bg-white px-2.5 py-1.5 text-zinc-700 ring-1 ring-zinc-200">
                Can we see it this weekend?
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="w-fit rounded-xl rounded-br-sm bg-[#0d4a36] px-2.5 py-1.5 text-white">Saturday at 10 works.</p>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 ring-1 ring-zinc-200">
                  Take over
                </span>
              </div>
            </div>
          </StepCard>
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Founding cohort perks                                               */
/* ------------------------------------------------------------------ */

const PERKS = [
  { icon: Headphones, title: "Custom voice persona", body: "A voice tuned to your portfolio's terminology and the objections your buyers actually raise." },
  { icon: Zap, title: "Priority call routing", body: "Founding teams sit on dedicated telephony capacity, so peak ad campaigns never queue." },
  { icon: Sliders, title: "White-glove setup", body: "We ingest your listings, payment plans and floorplans for you. No spreadsheets to wrangle." },
  { icon: ShieldCheck, title: "Direct line to the team", body: "A shared channel with the people building SpaciaOS, for fast tuning and feedback." },
];

export function CohortPerks() {
  return (
    <section id="perks" className="scroll-mt-6 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <Eyebrow>Founding cohort</Eyebrow>
          <h2 className="mx-auto mt-4 max-w-2xl text-balance text-[32px] font-medium leading-[1.08] tracking-[-0.03em] sm:text-[44px]">
            <span className="text-zinc-400">Early teams get</span> more than early access.
          </h2>
        </div>
        <Stagger className="mt-16 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title} className="group relative rounded-[22px] bg-zinc-50/80 px-5 pb-6 pt-10 text-center ring-1 ring-zinc-200/70 transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-[0_24px_40px_-24px_rgba(13,74,54,0.35)]">
              <span className="absolute -top-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-zinc-950 text-white shadow-[0_10px_20px_-6px_rgba(24,24,27,0.55)] transition-colors duration-300 group-hover:bg-[#15803d]">
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="text-[15px] font-medium tracking-tight text-zinc-950">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mission note with the hard-hat blob                                 */
/* ------------------------------------------------------------------ */

export function MissionNote() {
  return (
    <section className="px-5 pb-20 pt-36 sm:px-8 sm:pb-28 sm:pt-44">
      <Reveal className="relative mx-auto max-w-xl">
        <Image
          src="/images/waitlist/blob-hardhat.png"
          alt="Our mascot in a hard hat, holding a coffee"
          width={458}
          height={640}
          className="pointer-events-none absolute -top-[118px] right-6 w-[92px] select-none sm:-top-[150px] sm:w-[116px]"
        />
        <div className="relative rounded-[24px] bg-white p-6 ring-1 ring-zinc-200 shadow-[0_30px_60px_-35px_rgba(24,24,27,0.35)] sm:p-8">
          <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600">A note from the team</span>
          <h2 className="mt-5 text-[24px] font-medium tracking-tight text-zinc-950 sm:text-[28px]">
            We&apos;re still pouring the foundation.
          </h2>
          <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-zinc-600">
            <p>
              Real estate runs on speed. The agent who calls back first usually wins the buyer, and most teams simply
              can&apos;t pick up every lead the moment it arrives.
            </p>
            <p>
              We&apos;re building SpaciaOS to close that gap. We&apos;re onboarding in small batches so every team gets a
              voice agent that actually sounds like them.
            </p>
          </div>
          <dl className="mt-6 space-y-1.5 text-[13px]">
            <div className="flex gap-2"><dt className="font-medium text-zinc-950">Next batch:</dt><dd className="text-zinc-600">Batch 2, rolling from Q4 2026</dd></div>
            <div className="flex gap-2"><dt className="font-medium text-zinc-950">Built for:</dt><dd className="text-zinc-600">Brokerages, agencies &amp; developers</dd></div>
            <div className="flex gap-2"><dt className="font-medium text-zinc-950">Setup:</dt><dd className="text-zinc-600">Done with you, not handed to you</dd></div>
          </dl>
          <div className="mt-6 flex items-center gap-2.5 border-t border-zinc-100 pt-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#15803d] font-mono text-[11px] font-bold text-white">S</span>
            <div className="leading-tight">
              <div className="text-[13px] font-medium text-zinc-950">The SpaciaOS team</div>
              <div className="text-[11px] text-zinc-500">Founding team</div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "How is SpaciaOS different from a chatbot?",
    a: "SpaciaOS is voice-first. It phones inbound leads within seconds, qualifies them in natural conversation, and books inspections into your calendar. No forms, no typing.",
  },
  {
    q: "Can my agents take over a live call?",
    a: "Yes. Your team can follow call transcripts in real time and transfer any ongoing call to their own phone in one tap.",
  },
  {
    q: "When does onboarding start?",
    a: "Batch 1 is in private calibration now. Batch 2 onboarding rolls out through Q4 2026, in the order people join the waitlist (invites move you up).",
  },
  {
    q: "Does joining the waitlist cost anything?",
    a: "No. Joining is free and doesn't commit you to anything. We'll email you when your batch is ready to start onboarding.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-6 px-5 pb-20 sm:px-8 sm:pb-28">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-4 text-[32px] font-medium leading-[1.08] tracking-[-0.03em] sm:text-[40px]">
            Questions, <span className="font-serif-accent italic text-[#15803d]">answered.</span>
          </h2>
        </div>
        <div className="divide-y divide-zinc-200 border-y border-zinc-200">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-zinc-950 [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-300 group-open:rotate-45 group-open:text-[#15803d]" />
              </summary>
              <p className="mt-3 pr-8 text-[14px] leading-relaxed text-zinc-500">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA + footer                                                  */
/* ------------------------------------------------------------------ */

export function FinalCta() {
  return (
    <section className="px-3 sm:px-4">
      <div className="relative overflow-hidden rounded-[28px] bg-black px-6 pb-20 pt-24 text-center sm:rounded-[36px] sm:pt-32">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[70%]"
          style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(34,197,94,0.55), rgba(21,128,61,0.35) 30%, rgba(13,74,54,0.15) 55%, transparent 75%)" }}
        />
        <Reveal className="relative mx-auto flex max-w-xl flex-col items-center">
          <h2 className="text-balance text-[34px] font-medium leading-[1.05] tracking-[-0.03em] text-white sm:text-[52px]">
            Stop sending leads <span className="whitespace-nowrap font-serif-accent italic text-[#86efac]">to voicemail.</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
            Join the waitlist and we&apos;ll reach out when your onboarding batch opens.
          </p>
          <div className="mt-8 flex w-full justify-center">
            <WaitlistEmailForm tone="dark" id="waitlist-email-footer" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden px-3 pb-0 pt-4 sm:px-4">
      <div className="relative z-10 mx-auto max-w-5xl rounded-[24px] bg-white p-6 ring-1 ring-zinc-200 shadow-[0_20px_50px_-30px_rgba(24,24,27,0.3)] sm:p-9">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-500">
              The AI voice agent for real estate teams. Every lead called, qualified and booked.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-[13px] sm:gap-16">
            <div>
              <div className="font-medium text-zinc-950">Product</div>
              <ul className="mt-3 space-y-2 text-zinc-500">
                <li><Link href="/#how" className="hover:text-zinc-950">How it works</Link></li>
                <li><Link href="/#pricing" className="hover:text-zinc-950">Pricing</Link></li>
                <li><Link href="/waitlist" className="hover:text-zinc-950">Join the waitlist</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-zinc-950">Company</div>
              <ul className="mt-3 space-y-2 text-zinc-500">
                <li><Link href="/#about" className="hover:text-zinc-950">About</Link></li>
                <li><Link href="/#faq" className="hover:text-zinc-950">FAQ</Link></li>
                <li><Link href="/sign-in" className="hover:text-zinc-950">Sign in</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-zinc-100 pt-5 text-[12px] text-zinc-400 sm:flex-row">
          <span>© {new Date().getFullYear()} SpaciaOS. All rights reserved.</span>
          <span>Built for real estate teams</span>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none -mt-6 select-none text-center text-[23vw] font-semibold leading-[0.8] tracking-[-0.06em] text-transparent sm:-mt-10"
        style={{
          backgroundImage: "linear-gradient(to bottom, #e4e4e7, rgba(228,228,231,0))",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        SpaciaOS
      </div>
    </footer>
  );
}
