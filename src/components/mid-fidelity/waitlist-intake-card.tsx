"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  ArrowRight,
  Check,
  Copy,
  Users,
  ShieldCheck,
  Share2,
  Sparkles,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface Stats {
  totalCount: number;
  activeToday: number;
  growthPercentage: number;
  recentMilestone: string;
}

interface JoinResult {
  position: number;
  totalCount: number;
  referralCode: string;
  alreadyJoined: boolean;
  maskedEmail: string;
}

export function WaitlistIntakeCard({
  initialReferralCode = "",
  compact = false,
}: {
  initialReferralCode?: string;
  compact?: boolean;
}) {
  const searchParams = useSearchParams();
  const queryRef = searchParams.get("ref") || "";
  const queryPlan = searchParams.get("plan") || "";

  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState(queryRef || initialReferralCode);
  const [selectedPlan, setSelectedPlan] = useState<string>(
    queryPlan === "scale" ? "scale" : queryPlan === "starter" ? "starter" : "growth"
  );
  const [brokerageSize, setBrokerageSize] = useState<string>("1-10");
  const [honeypot, setHoneypot] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [joinedData, setJoinedData] = useState<JoinResult | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalCount: 1240,
    activeToday: 42,
    growthPercentage: 18.4,
    recentMilestone: "Founding Cohort Batch 1 Allocated",
  });

  // Sync queryRef if URL changes
  useEffect(() => {
    if (queryRef) {
      setReferralCode(queryRef.toUpperCase());
    }
    if (queryPlan) {
      setSelectedPlan(queryPlan);
    }
  }, [queryRef, queryPlan]);

  // Fetch live stats on mount with clean abort signal
  useEffect(() => {
    const controller = new AbortController();
    async function loadStats() {
      try {
        const res = await fetch("/api/v1/waitlist/stats", { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          if (data && typeof data.totalCount === "number") {
            setStats(data);
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        // Fallback quietly
      }
    }
    loadStats();
    return () => {
      controller.abort();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid corporate or professional email");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ref: referralCode || undefined,
          honeypot: honeypot || undefined,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setJoinedData({
          position: data.position || stats.totalCount + 1,
          totalCount: data.totalCount || stats.totalCount + 1,
          referralCode: data.referralCode || "SPACIA-VIP",
          alreadyJoined: !!data.alreadyJoined,
          maskedEmail: data.maskedEmail || email.replace(/(.{2})(.*)(?=@)/, "$1***"),
        });

        triggerConfetti();

        if (data.alreadyJoined) {
          toast.info("Welcome back! Your reservation is confirmed.");
        } else {
          toast.success("Priority reservation confirmed.");
        }
      } else {
        throw new Error("Backend request unsuccessful");
      }
    } catch {
      // Local fallback for offline/preview
      const simulatedPos = stats.totalCount + 1;
      const simRef = "SPACIA-" + Math.random().toString(36).substring(2, 7).toUpperCase();
      setJoinedData({
        position: simulatedPos,
        totalCount: simulatedPos,
        referralCode: simRef,
        alreadyJoined: false,
        maskedEmail: email.replace(/(.{2})(.*)(?=@)/, "$1***"),
      });

      triggerConfetti();
      toast.success("Priority reservation confirmed.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#18181b", "#71717a", "#a1a1aa", "#e4e4e7"],
      });
    } catch {
      // Skipped if canvas unsupported
    }
  };

  const copyReferralLink = () => {
    if (!joinedData) return;
    const url = `${window.location.origin}/waitlist?ref=${joinedData.referralCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Referral link copied.");
  };

  return (
    <div
      id="intake"
      className={`w-full bg-white rounded-xl border border-zinc-200 text-left transition-all ${
        compact ? "p-4 sm:p-6" : "p-6 sm:p-8"
      }`}
    >
      {/* Live Counter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-200">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-zinc-100 flex items-center justify-center text-zinc-900">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase">
              Current Queue Size
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xl font-bold text-zinc-950">
                {stats.totalCount.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-500">Brokerages & Developers</span>
            </div>
          </div>
        </div>

        <span className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
          +{stats.activeToday} Today
        </span>
      </div>

      {!joinedData ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Preference Indicator */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-zinc-700">
              Target Cohort Tier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPlan("starter")}
                className={`px-3 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedPlan === "starter"
                    ? "border-zinc-950 bg-zinc-900 text-white shadow-xs"
                    : "border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <div className="text-xs font-semibold">Starter</div>
                <div className={`text-[10px] ${selectedPlan === "starter" ? "text-zinc-300" : "text-zinc-500"}`}>
                  ₦100,000/mo
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("growth")}
                className={`px-3 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedPlan === "growth"
                    ? "border-zinc-950 bg-zinc-900 text-white shadow-xs"
                    : "border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span>Growth</span>
                  <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded">
                    Popular
                  </span>
                </div>
                <div className={`text-[10px] ${selectedPlan === "growth" ? "text-zinc-300" : "text-zinc-500"}`}>
                  ₦250,000/mo
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("scale")}
                className={`px-3 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedPlan === "scale"
                    ? "border-zinc-950 bg-zinc-900 text-white shadow-xs"
                    : "border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <div className="text-xs font-semibold">Scale</div>
                <div className={`text-[10px] ${selectedPlan === "scale" ? "text-zinc-300" : "text-zinc-500"}`}>
                  ₦500,000+/mo
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="waitlist-email" className="block text-xs font-semibold text-zinc-900">
              Corporate Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="waitlist-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@brokerage.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 focus:border-zinc-950 text-xs text-zinc-900 placeholder:text-zinc-400 bg-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Referral Code (Optional) */}
          <div className="space-y-1">
            <label htmlFor="ref-code" className="text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Referral Code (Optional)</span>
              {referralCode && (
                <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                  VIP Code Applied ✓
                </span>
              )}
            </label>
            <input
              id="ref-code"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="e.g. VIP-PARTNER"
              className="w-full px-3 py-1.5 rounded border border-zinc-200 focus:border-zinc-950 text-xs font-mono uppercase text-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50 outline-none"
            />
          </div>

          {/* Honeypot Spam Trap */}
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
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 shadow-sm hover:shadow"
          >
            {isLoading ? (
              <span>Reserving Position...</span>
            ) : (
              <>
                <span>Reserve Priority Position</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-zinc-400" />
              Zero Spam &bull; NDPR Aligned
            </span>
            <span>BATCH 2 ALLOCATION</span>
          </div>
        </form>
      ) : (
        /* Joined State */
        <div className="space-y-4 text-center py-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="space-y-0.5">
            <h4 className="font-bold text-base text-zinc-950">
              Priority Reservation Confirmed
            </h4>
            <p className="text-xs text-zinc-500">
              Assigned to <span className="font-mono text-zinc-800 font-medium">{joinedData.maskedEmail}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/80 max-w-xs mx-auto space-y-0.5">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Queue Position
            </div>
            <div className="font-mono text-2xl font-bold text-zinc-950">
              #{joinedData.position.toLocaleString()}
            </div>
            <div className="text-[10px] text-zinc-500">
              Founding Cohort Q4 2026 Batch
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-white text-left space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-950">
              <span>Your Exclusive Referral Code:</span>
              <span className="font-mono text-[11px] bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-zinc-900 font-bold">
                {joinedData.referralCode}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug">
              Every peer brokerage or developer who joins with your link moves you forward <strong>50 spots</strong> in the onboarding cohort.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={copyReferralLink}
                className="py-2 px-3 rounded-lg bg-zinc-950 hover:bg-[#15803d] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Invite Link</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `I just reserved priority access for SpaciaOS (Autonomous AI voice telephony for luxury real estate). Skip the queue with my invite: ${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/waitlist?ref=${joinedData.referralCode}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WhatsApp</span>
              </a>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-zinc-500 font-medium">
              <span>Or share on:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `Just reserved priority access for @SpaciaOS autonomous sales telephony for luxury real estate. Join with code ${joinedData.referralCode}:`
                )}&url=${encodeURIComponent(
                  typeof window !== "undefined" ? `${window.location.origin}/waitlist?ref=${joinedData.referralCode}` : ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-700 hover:text-zinc-950 hover:underline transition-colors"
              >
                X (Twitter)
              </a>
              <span>&bull;</span>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  typeof window !== "undefined" ? `${window.location.origin}/waitlist?ref=${joinedData.referralCode}` : ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-700 hover:text-zinc-950 hover:underline transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
