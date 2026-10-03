"use client";

import React, { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// ============================================================================
// 1. Helper Components
// ============================================================================

export interface MIconProps {
  name: string;
  size?: number;
  weight?: number;
  fill?: number;
  grade?: number;
  opticalSize?: number;
  className?: string;
}

export function MIcon({
  name,
  size = 20,
  weight = 400,
  fill = 0,
  grade = 0,
  opticalSize = 24,
  className,
}: MIconProps) {
  if (name === "check") {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("select-none leading-none shrink-0", className)}
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (name === "close") {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("select-none leading-none shrink-0", className)}
        aria-hidden="true"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }

  return (
    <span
      className={cn("material-symbols-outlined select-none leading-none", className)}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
      }}
    >
      {name}
    </span>
  );
}

export interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export interface SpotlightBorderProps {
  children: React.ReactNode;
  className?: string;
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  size?: number;
  intensity?: number;
}

export function SpotlightBorder({
  children,
  className,
  radius = "2xl",
  size = 520,
  intensity = 0.5,
}: SpotlightBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({
    x: -9999,
    y: -9999,
  });

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setCoords({ x: -9999, y: -9999 });
  }, []);

  const radiusClass = radius === "2xl" ? "rounded-2xl" : `rounded-${radius}`;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("group/spotlight relative", radiusClass, className)}
      style={
        {
          "--spot-x": `${coords.x}px`,
          "--spot-y": `${coords.y}px`,
          "--size": `${size}px`,
          "--intensity": intensity,
        } as React.CSSProperties
      }
    >
      {/* Outer base border ring */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 border border-white/10",
          radiusClass
        )}
      />

      {/* Layer 1: Cursor Spotlight border ring using CSS mask */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 p-[1px] transition-opacity duration-300",
          radiusClass
        )}
        style={{
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
          background: `radial-gradient(circle var(--size) at var(--spot-x) var(--spot-y), rgba(255, 255, 255, var(--intensity)), transparent 60%)`,
        }}
      />

      {/* Layer 2: Inner highlight ring - thinner, brighter on hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 p-[1px] opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100",
          radiusClass
        )}
        style={{
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
          background: `radial-gradient(circle calc(var(--size) * 0.7) at var(--spot-x) var(--spot-y), rgba(255, 255, 255, calc(var(--intensity) * 1.5)), transparent 50%)`,
        }}
      />

      {/* Inner Content (Pointer events on inner content only) */}
      <div className="relative h-full w-full pointer-events-auto flex flex-col">
        {children}
      </div>
    </div>
  );
}

export function AnimatedText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-block overflow-hidden leading-none", className)}>
      <span className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] translate-y-full group-hover:translate-y-0 select-none"
      >
        {children}
      </span>
    </span>
  );
}

export interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export function PrimaryButton({
  children,
  href,
  size = "sm",
  className,
  onClick,
}: ButtonProps) {
  const sizeClasses =
    size === "sm" ? "h-8 px-4 text-sm" : size === "lg" ? "h-12 px-6 text-base" : "h-10 px-5 text-sm";
  const commonClasses = cn(
    "group inline-flex items-center justify-center rounded-full font-inter leading-none cursor-pointer select-none transition-colors",
    "bg-white/80 hover:bg-white text-black font-medium",
    sizeClasses,
    className
  );

  if (href) {
    return (
      <Link href={href} className={commonClasses} onClick={onClick}>
        <AnimatedText>{children}</AnimatedText>
      </Link>
    );
  }

  return (
    <button type="button" className={commonClasses} onClick={onClick}>
      <AnimatedText>{children}</AnimatedText>
    </button>
  );
}

export function SecondaryButton({
  children,
  href,
  size = "sm",
  className,
  onClick,
}: ButtonProps) {
  const sizeClasses =
    size === "sm" ? "h-8 px-4 text-sm" : size === "lg" ? "h-12 px-6 text-base" : "h-10 px-5 text-sm";
  const commonClasses = cn(
    "group inline-flex items-center justify-center rounded-full font-inter leading-none cursor-pointer select-none transition-colors",
    "bg-landing-surface hover:bg-landing-surface-hover border border-landing-border text-foreground backdrop-blur-[2.5px] font-medium",
    sizeClasses,
    className
  );

  if (href) {
    return (
      <Link href={href} className={commonClasses} onClick={onClick}>
        <AnimatedText>{children}</AnimatedText>
      </Link>
    );
  }

  return (
    <button type="button" className={commonClasses} onClick={onClick}>
      <AnimatedText>{children}</AnimatedText>
    </button>
  );
}

// ============================================================================
// 2. Plans Data (Official SpaciaOS Real Estate Sales Automation Pricing)
// ============================================================================

export type Feature = { text: string; included: boolean };

export type Plan = {
  name: string;
  price: string;
  originalPrice?: string;
  period?: string;
  description: string;
  planId: string;
  features: Feature[];
  featured?: boolean;
  badge?: string;
  bg: string;
};

export const plans: Plan[] = [
  {
    name: "Starter",
    price: "₦100,000",
    period: "/month",
    description: "Designed for smaller real-estate teams beginning to automate their sales process.",
    planId: "starter",
    bg: "#141414",
    features: [
      { text: "Website lead capture", included: true },
      { text: "AI Sales Agent & autonomous calling", included: true },
      { text: "Lead qualification & scoring", included: true },
      { text: "Automated follow-up", included: true },
      { text: "Call transcripts, summaries & history", included: true },
      { text: "Human handoff & real-time alerts", included: true },
      { text: "Calendar integration & viewing booking", included: true },
      { text: "Email notifications & sales dashboard", included: true },
      { text: "Basic analytics & property database sync", included: true },
      { text: "Standard integrations, setup & maintenance", included: true },
      { text: "Monthly AI usage allowance (PAYG overage)", included: true },
    ],
  },
  {
    name: "Growth",
    price: "₦250,000",
    period: "/month",
    description: "Designed for growing real-estate businesses with larger sales teams and higher lead volume.",
    planId: "growth",
    featured: true,
    badge: "Most Popular",
    bg: "#1c1c1c",
    features: [
      { text: "Includes everything in Starter, plus:", included: true },
      { text: "Higher AI usage allowance (PAYG overage)", included: true },
      { text: "Multiple sales agents & team calendars", included: true },
      { text: "Advanced lead routing & qualification", included: true },
      { text: "Custom qualification rules & logic", included: true },
      { text: "Advanced multi-touch follow-up", included: true },
      { text: "CRM & backend database integrations", included: true },
      { text: "Advanced analytics & AI performance tuning", included: true },
      { text: "Priority support, onboarding & maintenance", included: true },
    ],
  },
  {
    name: "Scale",
    price: "₦500,000+",
    period: "/month",
    description: "Designed for larger real-estate organizations with complex operations across teams & locations.",
    planId: "scale",
    badge: "Enterprise",
    bg: "#141414",
    features: [
      { text: "High-volume AI calling & multiple AI agents", included: true },
      { text: "Multiple sales teams, locations & calendars", included: true },
      { text: "Multiple business systems & complex integrations", included: true },
      { text: "Advanced routing & custom business rules", included: true },
      { text: "Advanced analytics & continuous AI optimization", included: true },
      { text: "Dedicated support, implementation & maintenance", included: true },
      { text: "Custom usage & architecture (Property count is not a metric)", included: true },
    ],
  },
];

// ============================================================================
// 3. Pricing Card Component
// ============================================================================

export function PricingCard({ plan }: { plan: Plan }) {
  return (
    <SpotlightBorder
      radius="2xl"
      size={460}
      intensity={0.5}
      className="relative h-full p-2"
    >
      <div
        className={cn(
          "relative flex h-full flex-col rounded-2xl border p-6 sm:p-7 transition-all",
          plan.featured ? "border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.06)]" : "border-white/10"
        )}
        style={{ backgroundColor: plan.bg }}
      >
        {plan.badge && (
          <div
            className={cn(
              "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border px-3 py-0.5 text-[11px] font-semibold tracking-wide",
              plan.featured
                ? "border-emerald-400/40 bg-emerald-500 text-white shadow-sm"
                : "border-white/15 bg-white text-black"
            )}
          >
            {plan.badge}
          </div>
        )}

        <FadeUp delay={0}>
          <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/60 font-mono font-medium">
            {plan.name}
          </div>
        </FadeUp>
        <div className="mt-3 border-t border-white/10" />

        <FadeUp delay={0.1}>
          <div className="mt-8 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-3xl sm:text-[2.5rem] leading-none font-semibold tracking-tight text-foreground">
              {plan.price}
            </span>
            <span className="text-xs text-foreground/50 font-mono">
              {plan.period || "/month"}
            </span>
            {plan.originalPrice && (
              <span className="text-base text-foreground/40 line-through ml-1">
                {plan.originalPrice}
              </span>
            )}
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-foreground/60 min-h-[38px]">
            {plan.description}
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div className="mt-6">
            {plan.featured ? (
              <PrimaryButton href={`/waitlist?plan=${plan.planId}`} size="sm" className="w-full">
                Reserve Cohort Seat
              </PrimaryButton>
            ) : (
              <SecondaryButton href={`/waitlist?plan=${plan.planId}`} size="sm" className="w-full">
                Reserve Cohort Seat
              </SecondaryButton>
            )}
          </div>
        </FadeUp>

        <FadeUp delay={0.4}>
          <ul className="mt-6 flex flex-1 flex-col gap-1.5">
            {plan.features.map((f, i) => (
              <li
                key={f.text}
                className={cn(
                  "flex items-start gap-2.5 py-2.5 text-xs sm:text-[13px] leading-snug",
                  i !== 0 && "border-t border-white/5",
                  f.included ? "text-foreground/85" : "text-foreground/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border mt-0.5",
                    f.included
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-transparent text-foreground/40"
                  )}
                >
                  {f.included ? (
                    <MIcon name="check" size={11} className="text-emerald-400" />
                  ) : (
                    <MIcon
                      name="close"
                      size={11}
                      className="text-foreground/40"
                    />
                  )}
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </FadeUp>
      </div>
    </SpotlightBorder>
  );
}

// ============================================================================
// 4. Main Section Component — PricingSection
// ============================================================================

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative w-full bg-background py-16 sm:py-20 font-inter text-foreground selection:bg-white/20 [--background:0_0%_0%] [--foreground:0_0%_98%] scroll-mt-24"
      style={{ backgroundColor: "#000000" }}
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-14 flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <FadeUp>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-landing-surface border border-white/10 px-3 py-1 text-xs text-foreground/80 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Founding Cohort Plans
              </span>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.02em] leading-[1.08] text-foreground">
                Predictable plans
                <br className="hidden sm:block" /> that scale with deal flow.
              </h2>
            </FadeUp>
          </div>
          <FadeUp delay={0.2}>
            <p className="max-w-md text-xs sm:text-sm text-foreground/60 leading-relaxed">
              Founding Cohort rates locked in for Q4 2026 onboarding.
              Includes full implementation, continuous AI optimization, and sub-second telephony.
              Property count is not the pricing metric.
            </p>
          </FadeUp>
        </div>

        {/* CARDS — 3 Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((p) => (
            <PricingCard key={p.name} plan={p} />
          ))}
        </div>

        {/* USAGE & PRICING TRANSPARENCY NOTE */}
        <FadeUp delay={0.3}>
          <div className="mt-12 text-center text-xs text-foreground/45 max-w-2xl mx-auto space-y-1">
            <p>
              * All tiers include a defined monthly AI usage allowance. Additional usage is PAYG.
            </p>
            <p>
              Custom infrastructure, multi-branch routing, and bespoke telephony models available upon request.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

export default PricingSection;
