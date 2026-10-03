"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWaitlist, type TeamSize } from "@/components/waitlist/waitlist-context";
import { fmt, useT } from "../i18n";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PixelWaitlistForm({ tone = "light", id }: { tone?: "light" | "dark"; id: string }) {
  const { join, joined } = useWaitlist();
  const t = useT().waitlistForm;
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dark = tone === "dark";

  if (joined) return dark ? <JoinedCompact /> : <JoinedPanel />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError(t.invalidEmail);
      return;
    }
    setError(null);
    setPending(true);
    await join(email.trim(), honeypot);
    setPending(false);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-[480px]">
      <div className={`flex flex-col gap-px sm:flex-row ${dark ? "bg-white/15" : "bg-zinc-300"} p-px`}>
        <label htmlFor={id} className="sr-only">
          {t.emailLabel}
        </label>
        <input
          id={id}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t.emailPlaceholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`min-w-0 flex-1 px-4 py-3.5 font-mono text-[13px] outline-none transition-shadow focus:shadow-[inset_0_0_0_2px_#15803d] ${
            dark ? "bg-[#0b2f24] text-white placeholder:text-emerald-100/40" : "bg-white text-zinc-950 placeholder:text-zinc-400"
          }`}
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
          className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 font-mono text-[12px] uppercase tracking-[0.12em] transition-colors disabled:opacity-70 cursor-pointer ${
            dark ? "bg-white text-[#0d4a36] hover:bg-[#22c55e]" : "bg-zinc-950 text-white hover:bg-[#15803d]"
          }`}
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.pending}
            </>
          ) : (
            <>
              {t.join} <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className={`mt-2 font-mono text-[11px] uppercase tracking-[0.08em] ${dark ? "text-red-300" : "text-red-600"}`}>
          {error}
        </p>
      )}
    </form>
  );
}

export function PixelSocialProof() {
  const { stats } = useWaitlist();
  const dict = useT();
  const t = dict.waitlistForm;
  const locale = dict.locale;
  const count = stats?.totalCount ?? 0;
  const [before, after] = (count === 1 ? t.socialCountOne : t.socialCount).split("{n}");
  return (
    <div className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.08em] text-zinc-500">
      <span className="grid grid-cols-3 gap-[2px]" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 ${i < Math.min(9, Math.max(1, Math.ceil(count / 10))) ? "bg-[#15803d]" : "bg-zinc-300"}`} />
        ))}
      </span>
      {/* show a number only once it means something; never a padded figure */}
      {count >= 10 ? (
        <span>
          {before}
          <span className="text-zinc-950">{count.toLocaleString(locale)}</span>
          {after}
        </span>
      ) : (
        <span>{t.socialFirst}</span>
      )}
    </div>
  );
}

function useInvite() {
  const { joined } = useWaitlist();
  const t = useT().waitlistForm;
  const link =
    joined && typeof window !== "undefined" ? `${window.location.origin}/waitlist?ref=${joined.referralCode}` : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t.copied);
    } catch {
      toast.error(t.copyFailed);
    }
  };
  return { joined, link, copy, t };
}

function JoinedPanel() {
  const { joined, link, copy, t } = useInvite();
  const locale = useT().locale;
  if (!joined) return null;
  const share = fmt(t.shareText, { link });

  return (
    <div className="relative mt-10 w-full max-w-[500px]">
      <Image
        src="/images/waitlist/blob-fingerguns.png"
        alt=""
        width={120}
        height={100}
        className="pointer-events-none absolute -top-[52px] right-6 w-[88px] select-none"
      />
      <div className="relative bg-white p-6 text-left ring-1 ring-zinc-300">
        <span className="absolute right-0 top-0 grid grid-cols-3" aria-hidden="true">
          {[1, 1, 1, 0, 1, 1, 0, 0, 1].map((on, n) => (
            <span key={n} className={`h-2 w-2 ${on ? "bg-[#15803d]" : ""}`} />
          ))}
        </span>
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#15803d]">
          [ {joined.alreadyJoined ? t.alreadyReserved : t.spotReserved} ]
        </div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-[26px] font-normal tracking-tight text-[#14231d]">{t.youreIn}</h3>
            <p className="mt-1 text-[13px] text-zinc-500">
              {t.confirmationTo} <span className="font-mono text-zinc-800">{joined.maskedEmail}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">{t.position}</div>
            <div className="font-mono text-[34px] font-medium leading-none tracking-tight text-zinc-950">
              #{joined.position.toLocaleString(locale)}
            </div>
          </div>
        </div>

        <TeamDetails />

        <div className="mt-5 border-t border-dashed border-zinc-300 pt-4">
          <p className="text-[12px] text-zinc-500">{t.inviteLine}</p>
          <div className="mt-2 flex gap-px bg-zinc-300 p-px">
            <code className="min-w-0 flex-1 truncate bg-zinc-50 px-3 py-2.5 font-mono text-[12px] text-zinc-700">
              {link.replace(/^https?:\/\//, "")}
            </code>
            <button
              type="button"
              onClick={copy}
              aria-label={t.copyAria}
              className="inline-flex items-center gap-1.5 bg-zinc-950 px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#15803d] cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" /> {t.copy}
            </button>
          </div>
          <div className="mt-3 flex gap-4 font-mono text-[11px] uppercase tracking-[0.1em] text-zinc-600">
            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#15803d]">
              WhatsApp ↗
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#15803d]">
              LinkedIn ↗
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#15803d]">
              X ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function JoinedCompact() {
  const { joined, copy, t } = useInvite();
  const locale = useT().locale;
  if (!joined) return null;
  const [before, after] = t.youreInLine.split("{n}");
  return (
    <div className="flex flex-wrap items-center gap-4">
      <p className="text-[14px] text-emerald-50/80">
        {before}
        <span className="font-mono text-white">#{joined.position.toLocaleString(locale)}</span>
        {after}{" "}
        <a href="#join" className="underline decoration-white/40 underline-offset-4 hover:text-white">
          {t.addDetails}
        </a>
      </p>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 bg-white px-4 py-3 font-mono text-[12px] uppercase tracking-[0.12em] text-[#0d4a36] transition-colors hover:bg-[#22c55e] cursor-pointer"
      >
        <Copy className="h-3.5 w-3.5" /> {t.copyInviteLink}
      </button>
    </div>
  );
}

const TEAM_SIZES: TeamSize[] = ["1-5", "6-20", "21-50", "50+"];
const DIAL_CODES = [
  { code: "+234", label: "NG +234" },
  { code: "+233", label: "GH +233" },
  { code: "+254", label: "KE +254" },
  { code: "+27", label: "ZA +27" },
  { code: "+225", label: "CI +225" },
  { code: "+221", label: "SN +221" },
  { code: "+44", label: "UK +44" },
  { code: "+1", label: "US/CA +1" },
  { code: "+971", label: "AE +971" },
];
const SELECT_ARROW =
  'cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%2371717a\'/%3E%3C/svg%3E")] bg-[position:right_10px_center] bg-no-repeat pr-7';

/** Combine a dial code and a local number into E.164 (drops a leading trunk 0). */
function toE164(dial: string, local: string) {
  const digits = local.replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `${dial}${digits}` : "";
}
const FIELD =
  "w-full bg-white px-3 py-2.5 font-mono text-[13px] text-zinc-950 placeholder:text-zinc-400 outline-none ring-1 ring-zinc-300 transition-shadow focus:shadow-[inset_0_0_0_2px_#15803d] aria-[invalid=true]:ring-red-500";
const FIELD_LABEL = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500";

/** Step 2: optional "about your team" details, collapsing to a thank-you line once saved. */
function TeamDetails() {
  const { saveProfile, profileSaved } = useWaitlist();
  const t = useT().waitlistForm;
  const [fullName, setFullName] = useState("");
  const [dial, setDial] = useState("+234");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [teamSize, setTeamSize] = useState<TeamSize | "">("");
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string; companyName?: string; companyWebsite?: string }>({});
  const [pending, setPending] = useState(false);

  if (profileSaved) {
    const first = profileSaved.fullName.split(/\s+/)[0];
    return (
      <p className="mt-5 flex items-start gap-2 border-t border-dashed border-zinc-300 pt-4 text-[13px] text-zinc-700">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#15803d]" />
        <span>
          {t.thanks.split(/(\{name\}|\{company\})/).map((part, i) =>
            part === "{name}" ? first : part === "{company}" ? <span key={i} className="text-zinc-950">{profileSaved.companyName}</span> : part,
          )}
        </span>
      </p>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (fullName.trim().length < 2) next.fullName = t.fullNameError;
    const e164 = toE164(dial, phone);
    if (!/^\+[1-9]\d{6,14}$/.test(e164)) next.phone = t.phoneError;
    if (companyName.trim().length < 2) next.companyName = t.companyNameError;
    const site = companyWebsite.trim();
    if (site && !/^(https?:\/\/)?[^\s/$.?#]+\.[^\s]{2,}$/i.test(site)) next.companyWebsite = t.companyWebsiteError;
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    await saveProfile({
      fullName: fullName.trim(),
      phone: e164,
      companyName: companyName.trim(),
      companyWebsite: site || undefined,
      teamSize: teamSize || undefined,
    });
    setPending(false);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-5 border-t border-dashed border-zinc-300 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-zinc-950">{t.profileTitle}</p>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">{t.thirtySec}</span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="wl-full-name" className={FIELD_LABEL}>
            {t.fullName} *
          </label>
          <input
            id="wl-full-name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            aria-invalid={!!errors.fullName}
            placeholder={t.fullNamePlaceholder}
            className={FIELD}
          />
          {errors.fullName && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-red-600">{errors.fullName}</p>}
        </div>
        <div>
          <label htmlFor="wl-phone" className={FIELD_LABEL}>
            {t.phone} *
          </label>
          <div className="flex gap-px bg-zinc-300 p-px">
            <label htmlFor="wl-dial" className="sr-only">
              {t.countryCode}
            </label>
            <select
              id="wl-dial"
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              className={`shrink-0 bg-white py-2.5 pl-2.5 font-mono text-[12px] text-zinc-950 outline-none focus:shadow-[inset_0_0_0_2px_#15803d] ${SELECT_ARROW}`}
            >
              {DIAL_CODES.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
            <input
              id="wl-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!errors.phone}
              placeholder={t.phonePlaceholder}
              className="min-w-0 flex-1 bg-white px-3 py-2.5 font-mono text-[13px] text-zinc-950 placeholder:text-zinc-400 outline-none transition-shadow focus:shadow-[inset_0_0_0_2px_#15803d] aria-[invalid=true]:shadow-[inset_0_0_0_1px_#ef4444]"
            />
          </div>
          {errors.phone && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label htmlFor="wl-company" className={FIELD_LABEL}>
            {t.companyName} *
          </label>
          <input
            id="wl-company"
            autoComplete="organization"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            aria-invalid={!!errors.companyName}
            placeholder={t.companyNamePlaceholder}
            className={FIELD}
          />
          {errors.companyName && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-red-600">{errors.companyName}</p>}
        </div>
        <div>
          <label htmlFor="wl-website" className={FIELD_LABEL}>
            {t.companyWebsite}
          </label>
          <input
            id="wl-website"
            inputMode="url"
            autoComplete="url"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            aria-invalid={!!errors.companyWebsite}
            placeholder={t.companyWebsitePlaceholder}
            className={FIELD}
          />
          {errors.companyWebsite && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-red-600">{errors.companyWebsite}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="wl-team-size" className={FIELD_LABEL}>
            {t.teamSize}
          </label>
          <select
            id="wl-team-size"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value as TeamSize | "")}
            className={`${FIELD} ${SELECT_ARROW}`}
          >
            <option value="">{t.teamSizeChoose}</option>
            {TEAM_SIZES.map((size) => (
              <option key={size} value={size}>
                {t.teamSizes[size]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex items-center gap-2 bg-zinc-950 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#15803d] disabled:opacity-70 cursor-pointer"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {pending ? t.saving : t.save}
      </button>
    </form>
  );
}
