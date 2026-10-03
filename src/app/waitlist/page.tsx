import type { Metadata } from "next";
import { MotionRoot } from "@/components/marketing/motion";
import { PixelFooter } from "@/components/variants/pixel/pixel-footer";
import { PixelWaitlistProvider } from "@/components/variants/pixel/waitlist/pixel-waitlist-provider";
import { PixelNav } from "@/components/variants/pixel/sections";
import { PixelPerks } from "@/components/variants/pixel/sections-more";
import {
  PixelTeamNote,
  PixelWaitlistCta,
  PixelWaitlistFaq,
  PixelWaitlistHero,
  PixelWaitlistSteps,
} from "@/components/variants/pixel/waitlist/sections";
import { SmoothAnchors } from "@/components/variants/pixel/smooth-anchors";
import { PixelShell } from "@/components/variants/pixel/i18n/pixel-shell";

export const metadata: Metadata = {
  title: { absolute: "Join the Waitlist · SpaciaOS AI Voice Agent for Real Estate" },
  description:
    "Get early access to SpaciaOS, the AI voice agent that calls every property lead in seconds and books inspections for you. Free to join, no commitment.",
  openGraph: {
    title: "Never let a lead go cold | SpaciaOS waitlist",
    description: "Early access to the AI voice agent for real estate teams. Free to join.",
  },
};

const LINKS = [
  { href: "#how", key: "howItWorks" },
  { href: "#perks", key: "whatYouGet" },
  { href: "#faq", key: "faq" },
  { href: "/", key: "product" },
] as const;

export default function WaitlistPage() {
  return (
    <PixelShell>
      <MotionRoot>
        <SmoothAnchors />
        <PixelWaitlistProvider>
          <div className="min-h-screen bg-[#f4f4f2] text-zinc-950 selection:bg-[#15803d] selection:text-white">
            <PixelNav links={LINKS} ctaHref="#join" />
            <PixelWaitlistHero />
            <PixelWaitlistSteps />
            <div id="perks" className="scroll-mt-4">
              <PixelPerks />
            </div>
            <PixelTeamNote />
            <PixelWaitlistFaq />
            <PixelWaitlistCta />
            <PixelFooter />
          </div>
        </PixelWaitlistProvider>
      </MotionRoot>
    </PixelShell>
  );
}
