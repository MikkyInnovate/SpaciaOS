"use client";

import { useSyncExternalStore } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [
    { label: "Days", value: Math.floor(s / 86400) },
    { label: "Hours", value: Math.floor((s % 86400) / 3600) },
    { label: "Minutes", value: Math.floor((s % 3600) / 60) },
    { label: "Seconds", value: s % 60 },
  ];
}

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const getNow = () => Math.floor(Date.now() / 1000) * 1000;
const getServerNow = () => null;

export function Countdown({ target }: { target: string }) {
  const now = useSyncExternalStore(subscribe, getNow, getServerNow);

  const units = parts(now === null ? 0 : new Date(target).getTime() - now);

  return (
    <div className="flex items-start gap-1 sm:gap-2" role="timer" aria-label="Time until Batch 2 onboarding">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-start gap-1 sm:gap-2">
          <div className="flex min-w-[52px] flex-col items-center">
            <span className="font-mono text-xl font-medium tabular-nums tracking-tight text-zinc-950 sm:text-2xl">
              {now === null ? "--" : String(u.value).padStart(2, "0")}
            </span>
            <span className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">{u.label}</span>
          </div>
          {i < units.length - 1 && <span className="pt-1 font-mono text-lg text-zinc-300">:</span>}
        </div>
      ))}
    </div>
  );
}
