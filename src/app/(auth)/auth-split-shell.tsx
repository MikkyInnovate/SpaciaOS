"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { siteConfig } from "@/lib/config/site";

export interface AuthSplitShellProps {
  children: React.ReactNode;
}

const HEADLINES = [
  "Every viewing booked, qualified, and closed in real time.",
  "Autonomous AI voice agents for premier property developments.",
  "Instant prospect qualification and automated viewing pipeline.",
];

function AuthTypewriterHeadline() {
  const [index, setIndex] = React.useState(0);
  const [displayedText, setDisplayedText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const currentFullText = HEADLINES[index];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayedText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
        }, 40);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 3200);
      }
    } else {
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length - 1));
        }, 18);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % HEADLINES.length);
        }, 200);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, index]);

  return (
    <h1 className="font-display text-2xl xl:text-3xl font-semibold tracking-tight text-white leading-snug min-h-[4rem] xl:min-h-[4.75rem] flex items-baseline">
      <span>{displayedText}</span>
      <span className="inline-block w-[2px] h-[0.9em] bg-emerald-400 ml-1.5 translate-y-[2px] animate-pulse shrink-0" />
    </h1>
  );
}

export function AuthSplitShell({ children }: AuthSplitShellProps) {
  const pathname = usePathname();
  const isSignIn = pathname.startsWith("/sign-in");
  const isSignUp = pathname.startsWith("/sign-up");

  const formRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = formRef.current;
    if (!container) return;

    const rearrange = () => {
      const form = container.querySelector<HTMLElement>(".cl-form");
      const social = container.querySelector<HTMLElement>(".cl-socialButtonsRoot, .cl-socialButtons");
      const divider = container.querySelector<HTMLElement>(".cl-dividerRow");

      if (form && social && divider && form.parentNode) {
        // If social buttons are positioned before the form, place them after the form
        if (social.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING) {
          form.after(divider);
          divider.after(social);
        }
      }
    };

    rearrange();
    const observer = new MutationObserver(rearrange);
    observer.observe(container, { childList: true, subtree: true });

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const googleBtn = target.closest(
        'button[data-provider="google"], .cl-socialButtonsBlockButton__google, [data-localization-key*="google"]'
      );
      if (googleBtn) {
        try {
          localStorage.setItem("spacia_last_auth_provider", "google");
          const emailInput = container.querySelector<HTMLInputElement>(
            'input[type="email"], input[name="identifier"]'
          );
          if (emailInput && emailInput.value.trim()) {
            localStorage.setItem(
              "spacia_last_auth_email",
              emailInput.value.trim().toLowerCase()
            );
          }
        } catch {
          // ignore
        }
      }
    };

    container.addEventListener("click", handleClick);

    return () => {
      observer.disconnect();
      container.removeEventListener("click", handleClick);
    };
  }, [pathname]);

  return (
    <div className="h-screen max-h-screen w-full flex flex-col lg:flex-row bg-white font-sans text-stone-900 overflow-hidden">
      {/* Left Column: Full-Bleed Edge-to-Edge Image (50% Width) */}
      <div className="hidden lg:block relative h-full max-h-screen w-full lg:w-1/2 bg-stone-950 overflow-hidden">
        <Image
          src="/images/auth-real-estate.jpg"
          alt="Spacia Real Estate Advisory"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center brightness-95"
        />

        {/* Editorial Headline & Statement */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/40 to-transparent flex flex-col justify-end p-12 xl:p-16 text-white z-10">
          <div className="space-y-4 max-w-xl xl:max-w-2xl">
            {/* Badge: No Corner Radius, Dotted Edges */}
            <div className="inline-flex items-center gap-2 rounded-none bg-stone-900/80 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-emerald-300 border border-dotted border-white/40 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-none bg-emerald-400 animate-pulse" />
              Autonomous Real Estate Intelligence
            </div>

            {/* H1 with Typing Effect Animation */}
            <AuthTypewriterHeadline />

            <p className="text-xs xl:text-sm text-stone-300 leading-relaxed font-normal">
              Autonomous voice agents, prospect qualification, and instant pipeline velocity engineered for modern luxury real-estate developers.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Edge-to-Edge Form Container (50% Width) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between h-full max-h-screen px-6 py-4 sm:px-10 sm:py-5 lg:px-12 xl:px-16 border-l border-stone-200 bg-white overflow-hidden">
        {/* Top: Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0d4a36] text-white shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-200" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm tracking-tight text-stone-900">
                {siteConfig.name}
              </span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60">
                OS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
            <span>Enterprise Security</span>
          </div>
        </div>

        {/* Center: Auth Form Container with comfortable top breathing room */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto pt-5 sm:pt-6 pb-2">
          {/* Restrained Segmented Switcher */}
          <div className="grid grid-cols-2 p-0.5 mb-6 sm:mb-7 rounded-md bg-stone-100 border border-stone-200 text-xs font-medium text-stone-500">
            <Link
              href="/sign-in"
              className={cn(
                "py-1.5 text-center rounded-sm transition-all duration-150",
                isSignIn
                  ? "bg-white text-stone-900 font-semibold shadow-xs"
                  : "hover:text-stone-800"
              )}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className={cn(
                "py-1.5 text-center rounded-sm transition-all duration-150",
                isSignUp
                  ? "bg-white text-stone-900 font-semibold shadow-xs"
                  : "hover:text-stone-800"
              )}
            >
              Sign up
            </Link>
          </div>

          {/* Form Content */}
          <div ref={formRef} className="w-full">
            {children}
          </div>
        </div>

        {/* Bottom: Clean Operational Footer */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
          <span>© {new Date().getFullYear()} {siteConfig.name} OS</span>
          <span>Real-Estate AI Sales System</span>
        </div>
      </div>
    </div>
  );
}
