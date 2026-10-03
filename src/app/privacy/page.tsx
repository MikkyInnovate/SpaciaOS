import type { Metadata } from "next";
import { PixelShell } from "@/components/variants/pixel/i18n/pixel-shell";
import { PrivacyContent } from "./privacy-content";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy · Spacia" },
  description: "How Spacia collects, uses and protects personal data on our website, waitlist and AI sales system.",
};

export default function PrivacyPage() {
  return (
    <PixelShell>
      <PrivacyContent />
    </PixelShell>
  );
}
