"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BRAND_BUTTON } from "@/components/marketing/brand";
import { useWaitlist } from "./waitlist-context";

const AVATARS = ["/images/avatars/babatunde.jpg", "/images/avatars/victoria.jpg"];

export function WaitlistEmailForm({
  tone = "light",
  id,
}: {
  tone?: "light" | "dark";
  id?: string;
}) {
  const { join, joined } = useWaitlist();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const dark = tone === "dark";

  if (joined) return <JoinedPanel tone={tone} />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid work email.");
      return;
    }
    setPending(true);
    await join(email.trim(), honeypot);
    setPending(false);
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-[440px]" noValidate>
      <div
        className={cn(
          "flex items-center gap-2 rounded-full p-1.5 pl-5 transition-shadow",
          dark
            ? "bg-white/[0.06] ring-1 ring-white/15 backdrop-blur focus-within:ring-[#22c55e]/60"
            : "bg-white ring-1 ring-zinc-200 shadow-[0_10px_30px_-12px_rgba(24,24,27,0.18)] focus-within:ring-2 focus-within:ring-[#15803d]/50"
        )}
      >
        <label htmlFor={id ?? "waitlist-email"} className="sr-only">
          Work email
        </label>
        <input
          id={id ?? "waitlist-email"}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@brokerage.com"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm outline-none",
            dark ? "text-white placeholder:text-zinc-500" : "text-zinc-950 placeholder:text-zinc-400"
          )}
        />
        <input
          type="text"
          name="hp_field"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "group inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium transition-all disabled:opacity-70 cursor-pointer",
            dark
              ? "bg-white text-zinc-950 hover:bg-[#22c55e] hover:text-zinc-950"
              : BRAND_BUTTON
          )}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              Join waitlist
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function WaitlistSocialProof() {
  const { stats } = useWaitlist();
  const count = stats?.totalCount ?? 0;

  return (
    <div className="flex items-center gap-2.5 text-[13px] text-zinc-500">
      <div className="flex -space-x-2">
        {AVATARS.map((src) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover ring-2 ring-white"
          />
        ))}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#15803d] text-[10px] font-semibold text-white ring-2 ring-white">
          S
        </span>
      </div>
      {count > 0 ? (
        <span>
          Join <span className="font-medium text-zinc-900">{count.toLocaleString()}</span>{" "}
          {count === 1 ? "brokerage" : "brokerages"} already in line
        </span>
      ) : (
        <span>Be one of the first brokerages in line</span>
      )}
    </div>
  );
}

function JoinedPanel({ tone }: { tone: "light" | "dark" }) {
  const { joined } = useWaitlist();
  if (!joined) return null;
  const dark = tone === "dark";

  const link =
    typeof window !== "undefined" ? `${window.location.origin}/waitlist?ref=${joined.referralCode}` : "";
  const shareText = `I just joined the SpaciaOS waitlist, an AI voice agent that answers every real estate lead in seconds. Join with my invite: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied.");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  };

  if (dark) {
    return (
      <div className="flex w-full max-w-[440px] flex-col items-center gap-3 text-center">
        <p className="text-sm text-zinc-300">
          You&apos;re <span className="font-medium text-white">#{joined.position.toLocaleString()}</span> in line.
          Share your invite link with other teams.
        </p>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-medium text-zinc-950 transition-colors hover:bg-[#22c55e] cursor-pointer"
        >
          <Copy className="h-3.5 w-3.5" /> Copy invite link
        </button>
      </div>
    );
  }

  return (
    <div className="relative mt-8 w-full max-w-[460px]">
      {/* Peeks out from behind the card's top edge */}
      <Image
        src="/images/waitlist/blob-fingerguns.png"
        alt=""
        width={120}
        height={100}
        className="pointer-events-none absolute -top-[54px] right-6 w-[92px] select-none"
      />
      <div className="wl-rise relative rounded-[22px] bg-white p-5 pt-6 text-left ring-1 ring-zinc-200 shadow-[0_20px_50px_-20px_rgba(24,24,27,0.25)]">
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#15803d]">
        <Check className="h-3.5 w-3.5" />
        {joined.alreadyJoined ? "Already reserved" : "Spot reserved"}
      </div>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-medium tracking-tight text-zinc-950">You&apos;re in.</h3>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            Confirmation going to <span className="font-mono text-zinc-800">{joined.maskedEmail}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Position</div>
          <div className="font-mono text-3xl font-semibold tracking-tight text-zinc-950">
            #{joined.position.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100">
        <p className="text-[12px] text-zinc-500">Know a team that should join? Share your invite link.</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-full bg-white px-3 py-2 text-[12px] text-zinc-700 ring-1 ring-zinc-200">
            {link.replace(/^https?:\/\//, "")}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy invite link"
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full cursor-pointer ${BRAND_BUTTON}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2.5 flex gap-3 text-[12px] font-medium text-zinc-600">
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-950"
          >
            WhatsApp ↗
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-950"
          >
            LinkedIn ↗
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-950"
          >
            X ↗
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}
