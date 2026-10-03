import type { Metadata } from "next";
import { headers } from "next/headers";
import { MotionRoot } from "@/components/marketing/motion";
import { PixelFooter } from "@/components/variants/pixel/pixel-footer";
import {
  PixelFaqCta,
  PixelFeatures,
  PixelHero,
  PixelNav,
  PixelPricing,
  PixelProcess,
  PixelSystem,
} from "@/components/variants/pixel/sections";
import {
  PixelAudience,
  PixelBeforeAfter,
  PixelPerks,
} from "@/components/variants/pixel/sections-more";
import { IntegrationsMarquee } from "@/components/variants/pixel/integrations-marquee";
import { ProblemNotify } from "@/components/variants/pixel/problem-notify";
import { SmoothAnchors } from "@/components/variants/pixel/smooth-anchors";
import { PrivacyBento } from "@/components/variants/pixel/privacy/privacy-bento";
import { PixelShell } from "@/components/variants/pixel/i18n/pixel-shell";
import { currencyFromHeaders } from "@/components/variants/pixel/currency-region";
import { LandingIntro } from "@/components/variants/pixel/landing-intro";

export const metadata: Metadata = {
  title: { absolute: "Spacia · The AI Sales System for Real Estate" },
  description:
    "Spacia installs an AI sales system into your real estate business. It answers every enquiry in seconds, qualifies and scores buyers, follows up, books viewings and hands your best leads to your agents.",
  openGraph: {
    title: "Spacia · The AI Sales System for Real Estate",
    description: "Answer, qualify, follow up and book viewings for every lead, automatically. Your team closes."
  },
};

export default async function LandingPage() {
  // Pricing currency from the visitor's IP country (header set by Vercel/Cloudflare);
  // null in local dev, where the browser guesses instead.
  const currency = currencyFromHeaders(await headers());
  return (
    <PixelShell currency={currency}>
      <MotionRoot>
        <SmoothAnchors />
        <LandingIntro />
        <div className="min-h-screen bg-[#f4f4f2] text-zinc-950 selection:bg-[#15803d] selection:text-white">
          <PixelNav />
          <PixelHero />
          <IntegrationsMarquee />
          <ProblemNotify />
          <PixelSystem />
          <PixelProcess />
          <PixelBeforeAfter />
          <PixelAudience />
          <PixelFeatures />
          <PrivacyBento />
          <PixelPerks />
          <PixelPricing />
          <PixelFaqCta />
          <PixelFooter />
        </div>
      </MotionRoot>
    </PixelShell>
  );
}
