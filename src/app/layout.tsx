import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { siteConfig } from "@/lib/config/site";
import { isClerkConfigured } from "@/lib/config/env";
import { Toaster } from "@/components/ui/sonner";
import { ClerkConfigMissing } from "@/components/shared/clerk-config-missing";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafaf9",
  width: "device-width",
  initialScale: 1,
};

const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "bottom" as const,
  },
  variables: {
    colorPrimary: "#0d4a36",
    colorText: "#18181b",
    colorTextSecondary: "#71717a",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#18181b",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    card: "border border-stone-200 shadow-sm rounded-xl",
    headerTitle: "font-display font-bold text-stone-900 tracking-tight",
    headerSubtitle: "text-xs text-stone-500",
    formButtonPrimary: "bg-[#0d4a36] hover:bg-[#093829] text-white font-medium text-xs shadow-2xs transition-colors",
    formFieldInput: "border-stone-200 focus:border-stone-400 focus:ring-stone-400 text-xs rounded-lg",
    footerActionLink: "text-[#0d4a36] hover:text-[#093829] font-medium text-xs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isClerkConfigured) {
    return (
      <html
        lang="en"
        className={`${inter.variable} ${manrope.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
          <ClerkConfigMissing />
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html
        lang="en"
        className={`${inter.variable} ${manrope.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-stone-200 selection:text-stone-900">
          {children}
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
