"use client";

import { useId } from "react";

const STAR =
  "M0,-66 C5,-30 22,-7 54,0 C22,7 5,30 0,66 C-6,30 -30,7 -74,0 C-30,-7 -6,-30 0,-66 Z";

/** The Spacia star mark. Inherits color via `currentColor`; the cuts are true gaps. */
export function SpaciaMark({ className = "h-6 w-6", title }: { className?: string; title?: string }) {
  const mask = useId();
  return (
    <svg
      viewBox="-80 -70 140 140"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <mask id={mask}>
          <rect x="-90" y="-80" width="160" height="160" fill="#fff" />
          <path d="M1.5,-72 L1.5,4" stroke="#000" strokeWidth="3.2" />
          <path d="M1.5,4 C14,3 30,-1 56,-2" stroke="#000" strokeWidth="3" fill="none" />
        </mask>
      </defs>
      <path d={STAR} fill="currentColor" mask={`url(#${mask})`} />
    </svg>
  );
}

/** Mark + "Spacia" wordmark. Size with `className` (font-size drives everything). */
export function SpaciaLogo({ className = "text-[18px]", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.4em] font-display font-medium leading-none tracking-[-0.02em] ${
        tone === "light" ? "text-white" : "text-zinc-950"
      } ${className}`}
    >
      <SpaciaMark className="h-[1.35em] w-[1.35em] shrink-0" />
      Spacia
    </span>
  );
}
