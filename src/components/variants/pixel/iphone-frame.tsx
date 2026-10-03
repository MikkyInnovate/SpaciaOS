"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/** Where the screen sits inside an exported mockup PNG, in % of the image box. */
export type ScreenInset = { left: string; top: string; width: string; height: string; radius: string };

const ASPECT = 71.6 / 146.6; // iPhone 15 Pro body
const BAND = 2.1; // titanium band, in % of phone width (cqw)
const BEZEL = 3.1; // black bezel, in % of phone width (cqw)

/**
 * A modern iPhone (titanium frame, thin even bezels, dynamic island, side
 * buttons) drawn in CSS. `screen` is designed at `screenWidth` px wide and is
 * scaled to fit the glass, so the phone can be any size.
 *
 * Pass `mockupSrc` (+ `screenInset`) to use an exported PNG mockup instead of
 * the CSS frame; the screen is then laid over the PNG's glass.
 */
export function IPhoneFrame({
  screen,
  screenWidth = 300,
  mockupSrc,
  mockupAspect = ASPECT,
  screenInset,
  className = "",
}: {
  screen: React.ReactNode;
  screenWidth?: number;
  mockupSrc?: string;
  mockupAspect?: number;
  screenInset?: ScreenInset;
  className?: string;
}) {
  const glassRef = useRef<HTMLDivElement>(null);
  const [glass, setGlass] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = glassRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setGlass({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = glass.w ? glass.w / screenWidth : 0;
  const content = (
    <div
      style={{
        width: screenWidth,
        height: scale ? glass.h / scale : "100%",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        opacity: scale ? 1 : 0,
      }}
    >
      {screen}
    </div>
  );

  if (mockupSrc && screenInset) {
    return (
      <div className={`relative ${className}`} style={{ aspectRatio: mockupAspect }}>
        <div
          ref={glassRef}
          className="absolute overflow-hidden bg-[#0b2f24]"
          style={{ left: screenInset.left, top: screenInset.top, width: screenInset.width, height: screenInset.height, borderRadius: screenInset.radius }}
        >
          {content}
        </div>
        <Image src={mockupSrc} alt="" fill sizes="400px" loading="eager" className="pointer-events-none object-contain" />
      </div>
    );
  }

  return (
    <div className={`relative [container-type:inline-size] ${className}`} style={{ aspectRatio: ASPECT }}>
      {/* soft contact shadow on the ground */}
      <div
        aria-hidden="true"
        className="absolute -bottom-[5%] left-1/2 h-[6%] w-[88%] -translate-x-1/2 rounded-[50%] bg-[#06140f]/30 blur-2xl"
      />

      {/* side buttons: action + volume (left), power (right) */}
      {[
        { side: "left", top: 17.5, h: 4.2 },
        { side: "left", top: 24.5, h: 7.8 },
        { side: "left", top: 33.5, h: 7.8 },
        { side: "right", top: 26, h: 12 },
      ].map((b, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute w-[1.6cqw] rounded-[1cqw]"
          style={{
            top: `${b.top}%`,
            height: `${b.h}%`,
            [b.side]: "-1.1cqw",
            background: "linear-gradient(90deg, #4b4e52, #a7aaae 45%, #5a5d61)",
            boxShadow: "inset 0 0 0 0.3cqw rgba(0,0,0,0.25)",
          }}
        />
      ))}

      {/* titanium body */}
      <div
        className="relative h-full w-full"
        style={{
          borderRadius: "17cqw",
          padding: `${BAND}cqw`,
          background:
            "linear-gradient(150deg, #b9bcc0 0%, #5c5f63 18%, #8e9196 38%, #3d3f43 62%, #7d8085 82%, #c7cacd 100%)",
          boxShadow:
            "inset 0 0 0 0.35cqw rgba(255,255,255,0.35), inset 0 0 0 0.7cqw rgba(0,0,0,0.35), 0 50px 90px -35px rgba(6,20,15,0.55), 0 18px 36px -18px rgba(6,20,15,0.35)",
        }}
      >
        {/* black bezel */}
        <div className="h-full w-full bg-black" style={{ borderRadius: `${17 - BAND}cqw`, padding: `${BEZEL}cqw` }}>
          {/* glass */}
          <div
            ref={glassRef}
            className="relative h-full w-full overflow-hidden bg-[#0b2f24]"
            style={{ borderRadius: `${17 - BAND - BEZEL}cqw` }}
          >
            {content}
            {/* dynamic island */}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-[2.4%] h-[4.4%] w-[33%] -translate-x-1/2 rounded-full bg-black"
            >
              <span className="absolute right-[12%] top-1/2 h-[42%] aspect-square -translate-y-1/2 rounded-full bg-[#1b2433] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
            </span>
            {/* glass reflection */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(118deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 30%, transparent 48%)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
