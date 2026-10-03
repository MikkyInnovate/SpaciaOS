import "server-only";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

/* Waitlist API for the standalone (Cloudflare) deployment. Mirrors the NestJS
   waitlist module (server/src/modules/waitlist) so the frontend works unchanged:
   same routes, same request bodies, same { success, data } / { error } envelopes,
   same table (waitlist_subscribers). Counts are real: no offsets. */

export const TEAM_SIZES = ["1-5", "6-20", "21-50", "50+"] as const;

const db = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
};

/* ---------- envelopes ---------- */

export const ok = (data: unknown, status = 200) => Response.json({ success: true, data }, { status });

export const fail = (status: number, message: string, details?: string[]) =>
  Response.json({ success: false, error: { message, ...(details ? { details } : {}) } }, { status });

export function fromZod(err: z.ZodError) {
  return fail(400, err.issues[0]?.message ?? "Invalid request", err.issues.map((i) => i.message));
}

/* ---------- validation (ports of the NestJS DTOs) ---------- */

export const joinSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .max(255)
    .pipe(z.email({ message: "Please provide a valid corporate or professional email" })),
  ref: z.string().trim().toUpperCase().max(24).optional(),
  honeypot: z.string().optional(),
});

const normaliseWebsite = (v: unknown) => {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s) return undefined;
  return /^https?:\/\//i.test(s) ? s.replace(/^http:\/\//i, "https://") : `https://${s}`;
};

export const profileSchema = z.object({
  referralCode: z.string({ message: "Referral code is required" }).trim().toUpperCase().min(1, "Referral code is required").max(24),
  fullName: z.string({ message: "Please enter your full name" }).trim().min(2, "Please enter your full name").max(120, "Please enter your full name"),
  phone: z
    .string({ message: "Please enter your phone number" })
    .min(1, "Please enter your phone number")
    .transform((v) => {
      const digits = v.replace(/[\s\-().]/g, "");
      return digits.startsWith("+") ? digits : `+${digits.replace(/^00/, "")}`;
    })
    .pipe(z.string().regex(/^\+[1-9]\d{6,14}$/, "Please enter a valid phone number with country code")),
  companyName: z.string({ message: "Please enter your company name" }).trim().min(2, "Please enter your company name").max(160, "Please enter your company name"),
  companyWebsite: z.preprocess(
    normaliseWebsite,
    z
      .url({ protocol: /^https$/, hostname: z.regexes.domain, message: "Please enter a valid website, e.g. yourcompany.com" })
      .max(255)
      .optional()
  ),
  teamSize: z.enum(TEAM_SIZES, { message: "Please choose a team size" }).optional(),
});

/* ---------- helpers ---------- */

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "••••@••••";
  if (name.length <= 2) return `${name[0] || "*"}***@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

function newReferralCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `SPACIA-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------- stats ---------- */

let cached: { data: Stats; expiresAt: number } | null = null;
type Stats = { totalCount: number; activeToday: number; growthPercentage: null; recentMilestone: null };

export async function getStats(): Promise<Stats> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.data;
  const sql = db();
  const [row] = await sql`
    select count(*)::int as total,
           count(*) filter (where created_at >= now() - interval '24 hours')::int as today
    from waitlist_subscribers`;
  const data: Stats = { totalCount: row?.total ?? 0, activeToday: row?.today ?? 0, growthPercentage: null, recentMilestone: null };
  cached = { data, expiresAt: now + 15_000 };
  return data;
}

/* ---------- join ---------- */

export async function joinWaitlist(input: z.infer<typeof joinSchema>, meta: { ip?: string; userAgent?: string }) {
  const { email } = input;

  // Honeypot: look plausible to bots without saving anything
  if (input.honeypot && input.honeypot.trim()) {
    const s = await getStats();
    return {
      created: false,
      result: {
        success: true,
        message: "You're on the waitlist.",
        position: s.totalCount + 1,
        totalCount: s.totalCount + 1,
        referralCode: "SPACIA-VIP",
        alreadyJoined: false,
        maskedEmail: maskEmail(email),
      },
    };
  }

  const sql = db();
  const existing = async () => {
    const [row] = await sql`select sequence_number, referral_code from waitlist_subscribers where email = ${email} limit 1`;
    return row as { sequence_number: number; referral_code: string } | undefined;
  };
  const already = (row: { sequence_number: number; referral_code: string }, total: number) => ({
    created: false,
    result: {
      success: true,
      message: `You're already on the waitlist. Your position is #${row.sequence_number}.`,
      position: row.sequence_number,
      totalCount: total,
      referralCode: row.referral_code,
      alreadyJoined: true,
      maskedEmail: maskEmail(email),
    },
  });

  const found = await existing();
  if (found) return already(found, (await getStats()).totalCount);

  const [{ total }] = (await sql`select count(*)::int as total from waitlist_subscribers`) as { total: number }[];
  const position = total + 1;
  const referralCode = newReferralCode();
  const ipHash = meta.ip ? await sha256(meta.ip) : null;

  const inserted = await sql`
    insert into waitlist_subscribers (email, sequence_number, referral_code, referred_by, ip_hash, user_agent, status)
    values (${email}, ${position}, ${referralCode}, ${input.ref || null}, ${ipHash}, ${meta.userAgent?.slice(0, 255) ?? null}, 'pending')
    on conflict (email) do nothing
    returning sequence_number`;

  if (inserted.length === 0) {
    // Concurrent duplicate submission: report the existing spot
    const row = await existing();
    if (row) return already(row, (await getStats()).totalCount);
    throw new Error("Waitlist insert failed");
  }

  cached = null;
  return {
    created: true,
    result: {
      success: true,
      message: `Welcome to SpaciaOS! You are #${position}.`,
      position,
      totalCount: position,
      referralCode,
      alreadyJoined: false,
      maskedEmail: maskEmail(email),
    },
  };
}

/* ---------- profile ---------- */

export async function updateProfile(input: z.infer<typeof profileSchema>) {
  const sql = db();
  const rows = await sql`
    update waitlist_subscribers
    set full_name = ${input.fullName}, phone = ${input.phone}, company_name = ${input.companyName},
        company_website = ${input.companyWebsite ?? null}, team_size = ${input.teamSize ?? null}, updated_at = now()
    where referral_code = ${input.referralCode}
    returning sequence_number`;
  const row = rows[0] as { sequence_number: number } | undefined;
  return row ? { success: true, position: row.sequence_number } : null;
}

/* ---------- welcome email (Resend HTTP API; skipped when not configured) ---------- */

export async function sendWelcomeEmail(to: string, position: number, referralCode: string, origin: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const from = process.env.RESEND_FROM_EMAIL || "SpaciaOS <onboarding@resend.dev>";
  const invite = `${origin}/waitlist?ref=${encodeURIComponent(referralCode)}`;
  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#14231d;background:#f4f4f2;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:24px;font-weight:300;letter-spacing:-0.5px;color:#14231d;">SpaciaOS</div>
      <div style="color:#71717a;font-size:11px;margin-top:6px;text-transform:uppercase;letter-spacing:2px;font-family:ui-monospace,Menlo,monospace;">The AI sales system for real estate</div>
    </div>
    <div style="background:#ffffff;padding:32px;border:1px solid #e4e4e7;">
      <h2 style="font-size:20px;font-weight:400;margin:0 0 12px;">You're on the list.</h2>
      <p style="color:#52525b;line-height:1.6;font-size:15px;margin:0;">
        Thanks for joining the SpaciaOS waitlist. We're onboarding real estate teams a few at a time, and we'll email you when your spot opens.
      </p>
      <div style="background:#f4f4f2;border:1px solid #e4e4e7;padding:20px;margin:28px 0;text-align:center;">
        <div style="font-size:11px;text-transform:uppercase;color:#71717a;letter-spacing:2px;font-family:ui-monospace,Menlo,monospace;">Your place in line</div>
        <div style="font-size:44px;font-weight:300;color:#15803d;margin:8px 0;">#${position}</div>
      </div>
      <p style="color:#52525b;font-size:13px;line-height:1.5;margin:0 0 10px;">Know a team that should join? Share your invite link:</p>
      <div style="background:#fafafa;border:1px dashed #15803d;padding:12px;font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#15803d;word-break:break-all;">${invite}</div>
    </div>
    <div style="text-align:center;margin-top:28px;color:#a1a1aa;font-size:12px;">© ${new Date().getFullYear()} SpaciaOS</div>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: `You're #${position} on the SpaciaOS waitlist`, html }),
  });
  if (!res.ok) console.error(`[waitlist] welcome email not sent (${res.status})`);
}
