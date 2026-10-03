"use client";

import { CountUp, Stagger, StaggerItem } from "@/components/marketing/motion";

const METRICS = [
  {
    value: 3,
    prefix: "<",
    suffix: "s",
    label: "Speed to Lead",
    sub: "Instant voice contact vs. 4-hour industry average",
  },
  {
    value: 94,
    suffix: "%",
    label: "BANT Accuracy",
    sub: "Liquid budget & authority verified before booking",
  },
  {
    value: 3.8,
    decimals: 1,
    suffix: "x",
    label: "Inspection Velocity",
    sub: "Confirmed physical appointments on broker calendars",
  },
  {
    value: 43,
    prefix: "₦",
    suffix: "B",
    label: "Pipeline Processed",
    sub: "High-ticket residential and commercial deal flow",
  },
];

export function LandingMetrics() {
  return (
    <section className="py-8 md:py-12 px-4 sm:px-6">
      <Stagger className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
        {METRICS.map((m, i) => (
          <StaggerItem
            key={m.label}
            className={`relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-3xl p-6 ${
              i === 0 ? "bg-[#0d4a36] text-white" : "bg-zinc-50 border border-zinc-200/70"
            }`}
          >
            {i === 0 && (
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-2xl"
                style={{ background: "radial-gradient(circle, rgba(34,197,94,0.6), transparent 70%)" }}
              />
            )}
            <div
              className={`relative whitespace-nowrap font-mono text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight ${
                i === 0 ? "text-white" : "text-zinc-950"
              }`}
            >
              <CountUp to={m.value} prefix={m.prefix} suffix={m.suffix} decimals={m.decimals} />
            </div>
            <div className="relative space-y-1">
              <div className={`text-xs font-semibold ${i === 0 ? "text-white" : "text-zinc-800"}`}>{m.label}</div>
              <div className={`text-[11px] leading-snug ${i === 0 ? "text-emerald-100/80" : "text-zinc-500"}`}>{m.sub}</div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
