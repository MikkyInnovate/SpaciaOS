"use client";

import { Plus } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion";

const FAQS = [
  {
    q: "How is SpaciaOS different from a chatbot?",
    a: "SpaciaOS is voice-first. It phones inbound buyers within seconds, qualifies them in natural conversation, and books inspections straight onto your brokers' calendars. No forms, no typing.",
  },
  {
    q: "Can my brokers take over a live call?",
    a: "Yes. Brokers can follow every call transcript in real time and transfer any ongoing call to their own phone in one tap. The client relationship always stays with your team.",
  },
  {
    q: "Which lead sources does it connect to?",
    a: "Website forms, listing portals, ad campaigns, WhatsApp and inbound webhooks. Qualified viewings sync to Google or Outlook calendars, and Growth and Scale plans add CRM integrations such as HubSpot.",
  },
  {
    q: "Will the agent sound like my brand?",
    a: "Every founding team gets a voice persona tuned to their portfolio: your listings, payment plans, terminology and the objections your buyers actually raise.",
  },
  {
    q: "How is client data protected?",
    a: "Conversations and financial details are encrypted, and integration credentials are stored server-side. They never reach the browser.",
  },
  {
    q: "What happens if we go over our plan's usage?",
    a: "Every plan includes a monthly AI usage allowance. Anything beyond it is billed pay-as-you-go, so calls never stop mid-campaign.",
  },
  {
    q: "When does onboarding start?",
    a: "Batch 1 is in private calibration. Batch 2 onboarding rolls out through Q4 2026 in the order teams join the waitlist.",
  },
  {
    q: "Does joining the waitlist cost anything?",
    a: "No. Joining is free and doesn't commit you to a plan. We'll reach out when your onboarding batch opens.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
        <Reveal className="lg:col-span-4 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full inline-block">
            FAQ
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
            Questions brokers ask us.
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Everything you need to know before reserving a founding cohort seat.
          </p>
        </Reveal>

        <Stagger className="lg:col-span-8 space-y-3" gap={0.05}>
          {FAQS.map((f) => (
            <StaggerItem key={f.q}>
              <details className="group rounded-3xl bg-zinc-50 border border-zinc-200/80 px-6 py-5 transition-[background-color,border-color,box-shadow] duration-300 open:bg-white open:border-[#15803d]/25 open:shadow-[0_24px_40px_-28px_rgba(13,74,54,0.35)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base sm:text-lg font-bold tracking-tight text-zinc-950 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-500 transition-all duration-300 group-open:rotate-45 group-open:bg-[#15803d] group-open:border-[#15803d] group-open:text-white">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-sm text-zinc-600 leading-relaxed">{f.a}</p>
              </details>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export default FaqSection;
