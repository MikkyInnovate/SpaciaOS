import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
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
import { INTRO_COOKIE, LandingIntro } from "@/components/variants/pixel/landing-intro";

export const metadata: Metadata = {
  title: { absolute: "SpaciaOS · The AI Sales System for Real Estate" },
  description:
    "SpaciaOS installs an AI sales system into your real estate business. It answers every enquiry in seconds, qualifies and scores buyers, follows up, books viewings and hands your best leads to your agents.",
  openGraph: {
    title: "SpaciaOS · The AI Sales System for Real Estate",
    description: "Answer, qualify, follow up and book viewings for every lead, automatically. Your team closes."
  },
};

export default async function LandingPage() {
  // Pricing currency from the visitor's IP country (header set by Vercel/Cloudflare);
  // null in local dev, where the browser guesses instead.
  const currency = currencyFromHeaders(await headers());
  const introSeen = (await cookies()).has(INTRO_COOKIE);
  return (
    <PixelShell currency={currency}>
      <MotionRoot>
        <SmoothAnchors />
        {!introSeen && <LandingIntro />}
        <div className="min-h-screen overflow-x-clip bg-[#f4f4f2] text-zinc-950 selection:bg-[#15803d] selection:text-white">
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
