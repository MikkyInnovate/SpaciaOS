"use client";

import { useEffect } from "react";
import { animate } from "motion/react";

/** Same-page #anchor links glide to their section with an eased scroll instead of jumping. */
export function SmoothAnchors({ offset = 16 }: { offset?: number }) {
  useEffect(() => {
    let stop: (() => void) | undefined;

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      // capture phase + stopPropagation: we run before Next's <Link>, which would jump instantly
      e.preventDefault();
      e.stopPropagation();
      const to = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
      history.pushState(null, "", url.hash);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, to);
        return;
      }
      stop?.();
      const from = window.scrollY;
      const distance = Math.abs(to - from);
      const controls = animate(from, to, {
        duration: Math.min(1.6, 0.7 + distance / 4000),
        ease: [0.65, 0, 0.35, 1],
        onUpdate: (v) => window.scrollTo(0, v),
      });
      stop = () => controls.stop();
      // let the user take over by scrolling themselves
      const cancel = () => stop?.();
      window.addEventListener("wheel", cancel, { once: true, passive: true });
      window.addEventListener("touchstart", cancel, { once: true, passive: true });
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      stop?.();
    };
  }, [offset]);

  return null;
}
