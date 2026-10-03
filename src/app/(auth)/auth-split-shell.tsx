"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SpaciaLogo } from "@/components/brand/spacia-logo";

export interface AuthSplitShellProps {
  children: React.ReactNode;
}

const HEADLINES = [
  "Every viewing booked, qualified and ready for your team.",
  "Every property lead, called in seconds.",
  "Your agents close. Spacia does the chasing.",
];

/** Typed headline. The full line reserves its space invisibly, so typing never reflows or clips. */
function AuthTypewriterHeadline() {
  const [index, setIndex] = React.useState(0);
  const [displayedText, setDisplayedText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const currentFullText = HEADLINES[index];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayedText.length < currentFullText.length) {
        timer = setTimeout(() => setDisplayedText(currentFullText.slice(0, displayedText.length + 1)), 40);
      } else {
        timer = setTimeout(() => setIsDeleting(true), 3200);
      }
    } else if (displayedText.length > 0) {
      timer = setTimeout(() => setDisplayedText(currentFullText.slice(0, displayedText.length - 1)), 18);
    } else {
      timer = setTimeout(() => {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % HEADLINES.length);
      }, 200);
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, index]);

  return (
    <h1 className="font-display relative text-[clamp(30px,2.8vw,44px)] font-light leading-[1.08] tracking-[-0.035em] text-white">
      {/* reserve the height of the longest line */}
      <span aria-hidden="true" className="invisible block">
        {HEADLINES.reduce((a, b) => (b.length > a.length ? b : a))}
      </span>
      <span className="absolute inset-0">
        <span className="sr-only">{HEADLINES[0]}</span>
        <span aria-hidden="true">{displayedText}</span>
        <span
          aria-hidden="true"
          className="ml-1 inline-block h-[0.85em] w-[2px] translate-y-[0.1em] animate-pulse bg-[#86efac]"
        />
      </span>
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
          const emailInput = container.querySelector<HTMLInputElement>('input[type="email"], input[name="identifier"]');
          if (emailInput && emailInput.value.trim()) {
            localStorage.setItem("spacia_last_auth_email", emailInput.value.trim().toLowerCase());
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
    <div className="flex min-h-screen w-full flex-col bg-[#f4f4f2] font-sans text-zinc-950 lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Left: full-bleed photo with the Pixel scanline veil */}
      <div className="relative hidden h-full w-1/2 overflow-hidden bg-[#0d4a36] lg:block">
        <Image
          src="/images/auth-real-estate.jpg"
          alt="Two real estate agents in front of a modern villa"
          fill
          preload
          sizes="50vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50 mix-blend-multiply"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(13,74,54,0.3) 0 1px, transparent 1px 4px)" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06140f]/95 via-[#06140f]/35 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 z-10 px-12 pb-14 xl:px-16 xl:pb-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 bg-white/10 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white ring-1 ring-white/20 backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse bg-[#86efac]" />
              The AI sales system for real estate
            </span>
            <div className="mt-6">
              <AuthTypewriterHeadline />
            </div>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
              Every enquiry called in seconds, qualified, and booked straight onto your calendar.
            </p>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex w-full flex-1 flex-col px-5 py-5 sm:px-10 lg:h-full lg:w-1/2 lg:overflow-y-auto lg:px-14 xl:px-20">
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 pb-5">
          <Link href="/" aria-label="Spacia home">
            <SpaciaLogo className="text-[19px]" />
          </Link>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <Lock className="h-3 w-3 text-[#15803d]" aria-hidden="true" />
            Secure sign-in
          </span>
        </header>

        <main className="mx-auto my-auto w-full max-w-[420px] py-10">
          {/* sign in / sign up switch */}
          <div className="mb-9 grid grid-cols-2 border-b border-zinc-200 font-mono text-[11px] uppercase tracking-[0.14em]">
            {[
              { href: "/sign-in", label: "Sign in", on: isSignIn },
              { href: "/sign-up", label: "Sign up", on: isSignUp },
            ].map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={tab.on ? "page" : undefined}
                className={cn(
                  "-mb-px border-b-2 pb-3 text-center transition-colors duration-200",
                  tab.on ? "border-[#15803d] text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-950"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <div ref={formRef} className="w-full">
            {children}
          </div>
        </main>

        <footer className="flex shrink-0 items-center justify-between border-t border-zinc-200 pt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
          <span>
            © {new Date().getFullYear()} Spacia ·{" "}
            <Link href="/privacy" className="underline-offset-4 hover:text-[#15803d] hover:underline">
              Privacy
            </Link>
          </span>
          <span className="hidden sm:inline">AI sales system for real estate</span>
        </footer>
      </div>
    </div>
  );
}
