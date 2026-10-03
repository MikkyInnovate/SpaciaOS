"use client";

import { useSyncExternalStore } from "react";
import { useT } from "../i18n";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const getNow = () => Math.floor(Date.now() / 1000) * 1000;
const getServerNow = () => null;

function parts(ms: number, l: { days: string; hrs: string; min: string; sec: string }) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [
    { label: l.days, value: Math.floor(s / 86400) },
    { label: l.hrs, value: Math.floor((s % 86400) / 3600) },
    { label: l.min, value: Math.floor((s % 3600) / 60) },
    { label: l.sec, value: s % 60 },
  ];
}

export function PixelCountdown({ target }: { target: string }) {
  const now = useSyncExternalStore(subscribe, getNow, getServerNow);
  const t = useT().countdown;
  const units = parts(now === null ? 0 : new Date(target).getTime() - now, t);

  return (
    <div role="timer" aria-label={t.aria} className="inline-grid grid-cols-4 gap-px bg-zinc-300 p-px">
      {units.map((u) => (
        <div
          key={u.label}
          className="relative flex min-w-[68px] flex-col items-center bg-white px-3 py-3 sm:min-w-[84px]"
          style={{ backgroundImage: "radial-gradient(rgba(13,74,54,0.14) 1px, transparent 1px)", backgroundSize: "8px 8px" }}
        >
          <span className="font-mono text-[26px] font-medium tabular-nums leading-none tracking-tight text-zinc-950 sm:text-[32px]">
            {now === null ? "--" : String(u.value).padStart(2, "0")}
          </span>
          <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#15803d]">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
