"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useT } from "./i18n";

/* "Call connect" CTA: on hover or keyboard focus the label slides away and the button
   plays a live call — signal bars, CALLING 00:01 · 00:02, then CONNECTED ✓ in green.
   The timer writes straight to the DOM (no re-renders). Reduced motion skips straight
   to the connected state. Styles: .call-btn in globals.css. */

type Tone = "dark" | "light";

export function CallLink({
  href,
  className = "",
  tone = "dark",
  children,
}: {
  href: string;
  className?: string;
  tone?: Tone;
  children: React.ReactNode;
}) {
  const t = useT();
  const ref = useRef<HTMLAnchorElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const timeouts = useRef<number[]>([]);

  const clear = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  };
  const calling = (s: number) => `${t.common.calling} 00:0${s}`;

  const start = () => {
    const el = ref.current, timer = timerRef.current;
    if (!el || !timer) return;
    clear();
    el.classList.add("is-on");
    const connect = () => {
      el.classList.add("is-connected");
      timer.textContent = `${t.common.connected} ✓`;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return connect();
    timer.textContent = calling(0);
    timeouts.current = [
      window.setTimeout(() => (timer.textContent = calling(1)), 500),
      window.setTimeout(() => (timer.textContent = calling(2)), 1000),
      window.setTimeout(connect, 1450),
    ];
  };
  const stop = () => {
    clear();
    ref.current?.classList.remove("is-on", "is-connected");
  };

  useEffect(() => clear, []);

  return (
    <Link
      ref={ref}
      href={href}
      className={`call-btn ${tone === "light" ? "call-light" : ""} ${className}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && start()}
      onPointerLeave={stop}
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && start()}
      onBlur={stop}
    >
      <span className="call-face">{children}</span>
      <span className="call-line" aria-hidden="true">
        <span className="call-bars">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span ref={timerRef}>{calling(0)}</span>
      </span>
    </Link>
  );
}
