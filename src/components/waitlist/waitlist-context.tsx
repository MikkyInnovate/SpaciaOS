"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export interface WaitlistStats {
  totalCount: number;
  activeToday: number;
}

export interface WaitlistJoinResult {
  position: number;
  totalCount: number;
  referralCode: string;
  alreadyJoined: boolean;
  maskedEmail: string;
}

export type TeamSize = "1-5" | "6-20" | "21-50" | "50+";

export interface WaitlistProfile {
  fullName: string;
  /** E.164, e.g. +2348012345678 */
  phone: string;
  companyName: string;
  companyWebsite?: string;
  teamSize?: TeamSize;
}

interface WaitlistContextValue {
  stats: WaitlistStats | null;
  joined: WaitlistJoinResult | null;
  join: (email: string, honeypot?: string) => Promise<boolean>;
  /** Step 2: optional "about your team" details, saved against the join's referral code. */
  saveProfile: (profile: WaitlistProfile) => Promise<boolean>;
  profileSaved: WaitlistProfile | null;
}

/** Pull a readable message out of the API's error envelope ({ error: { message, details } }). */
function apiError(json: unknown): string | undefined {
  const err = (json as { error?: { message?: string; details?: unknown } } | null)?.error;
  if (Array.isArray(err?.details) && typeof err.details[0] === "string") return err.details[0];
  return err?.message ?? (json as { message?: string } | null)?.message;
}

/** Toast copy, overridable for translated pages. */
export const WAITLIST_MESSAGES = {
  joinError: "We couldn't save your spot. Please try again.",
  joined: "You're on the list.",
  alreadyJoined: "Welcome back, you're already in line.",
  profileError: "We couldn't save your details. Please try again.",
  profileSaved: "Thanks, your details are saved.",
  networkError: "Network error. Check your connection and try again.",
  /** Show the API's own (English) error text when it sends one. */
  useApiErrors: true,
};
export type WaitlistMessages = typeof WAITLIST_MESSAGES;

const WaitlistContext = createContext<WaitlistContextValue | null>(null);

export function WaitlistProvider({ children, messages = WAITLIST_MESSAGES }: { children: React.ReactNode; messages?: WaitlistMessages }) {
  const msg = useRef(messages);
  useEffect(() => {
    msg.current = messages;
  }, [messages]);
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [joined, setJoined] = useState<WaitlistJoinResult | null>(null);
  const [profileSaved, setProfileSaved] = useState<WaitlistProfile | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/waitlist/stats", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json?.data || json;
        if (data && typeof data.totalCount === "number") {
          setStats({ totalCount: data.totalCount, activeToday: data.activeToday ?? 0 });
        }
      })
      .catch(() => {
        // Counter simply stays hidden when the backend is unreachable
      });
    return () => controller.abort();
  }, []);

  const join = useCallback(
    async (email: string, honeypot?: string) => {
      const referralCode = (new URLSearchParams(window.location.search).get("ref") || "").toUpperCase();
      try {
        const res = await fetch("/api/v1/waitlist/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            ref: referralCode || undefined,
            honeypot: honeypot || undefined,
          }),
          signal: AbortSignal.timeout(8000),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error((msg.current.useApiErrors && apiError(json)) || msg.current.joinError);
          return false;
        }

        const data = json?.data || json;
        const result: WaitlistJoinResult = {
          position: data.position,
          totalCount: data.totalCount,
          referralCode: data.referralCode,
          alreadyJoined: !!data.alreadyJoined,
          maskedEmail: data.maskedEmail,
        };
        setJoined(result);
        setStats((prev) => ({
          totalCount: result.totalCount,
          activeToday: prev?.activeToday ?? 0,
        }));

        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.55 },
            colors: ["#18181b", "#71717a", "#a1a1aa", "#15803d"],
          });
        } catch {
          // Canvas unsupported
        }

        toast.success(result.alreadyJoined ? msg.current.alreadyJoined : msg.current.joined);
        return true;
      } catch {
        toast.error(msg.current.networkError);
        return false;
      }
    },
    []
  );

  const saveProfile = useCallback(
    async (profile: WaitlistProfile) => {
      if (!joined) return false;
      try {
        const res = await fetch("/api/v1/waitlist/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: joined.referralCode, ...profile, companyWebsite: profile.companyWebsite || undefined }),
          signal: AbortSignal.timeout(8000),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error((msg.current.useApiErrors && apiError(json)) || msg.current.profileError);
          return false;
        }
        setProfileSaved(profile);
        toast.success(msg.current.profileSaved);
        return true;
      } catch {
        toast.error(msg.current.networkError);
        return false;
      }
    },
    [joined]
  );

  return (
    <WaitlistContext.Provider value={{ stats, joined, join, saveProfile, profileSaved }}>
      {children}
    </WaitlistContext.Provider>
  );
}

export function useWaitlist() {
  const ctx = useContext(WaitlistContext);
  if (!ctx) throw new Error("useWaitlist must be used inside <WaitlistProvider>");
  return ctx;
}
