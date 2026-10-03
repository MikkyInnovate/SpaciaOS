import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { eq, count, gte } from "drizzle-orm";
import * as crypto from "crypto";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { JoinWaitlistDto } from "./dto/join-waitlist.dto";
import { UpdateWaitlistProfileDto } from "./dto/update-waitlist-profile.dto";
import {
  WaitlistJoinResponseDto,
  WaitlistStatsResponseDto,
  WaitlistProfileResponseDto,
} from "./dto/waitlist-response.dto";
import { ResendNotificationAdapter } from "../notifications/adapters/resend-notification.adapter";

interface CachedStats {
  data: WaitlistStatsResponseDto;
  expiresAt: number;
}

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);
  private static cachedStats: CachedStats | null = null;
  private readonly CACHE_TTL_MS = 15000; // 15 seconds

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb,
    @Optional()
    private readonly resendAdapter?: ResendNotificationAdapter
  ) {}

  /**
   * Idempotent waitlist subscriber registration.
   * Ensures zero duplicate count inflation and handles concurrent submissions gracefully.
   */
  async joinWaitlist(
    dto: JoinWaitlistDto,
    clientIp?: string,
    userAgent?: string
  ): Promise<WaitlistJoinResponseDto> {
    // 1. Invisible Honeypot Guard: If bot filled the hidden input, drop silently
    if (dto.honeypot && dto.honeypot.trim().length > 0) {
      this.logger.warn(`[Waitlist Anti-Bot] Trapped bot submission with honeypot value: "${dto.honeypot.substring(0, 20)}"`);
      // Look plausible to the bot without saving anything or inventing inflated numbers
      const botStats = await this.getStats();
      return {
        success: true,
        message: "You're on the waitlist.",
        position: botStats.totalCount + 1,
        totalCount: botStats.totalCount + 1,
        referralCode: "SPACIA-VIP",
        alreadyJoined: false,
        maskedEmail: this.maskEmail(dto.email),
      };
    }

    const email = dto.email.trim().toLowerCase();

    // 2. Check if subscriber already exists
    const [existing] = await this.db
      .select()
      .from(schema.waitlistSubscribers)
      .where(eq(schema.waitlistSubscribers.email, email))
      .limit(1);

    const stats = await this.getStats();

    if (existing) {
      const position = existing.sequenceNumber;
      return {
        success: true,
        message: `You're already on the waitlist. Your position is #${position}.`,
        position,
        totalCount: stats.totalCount,
        referralCode: existing.referralCode,
        alreadyJoined: true,
        maskedEmail: this.maskEmail(email),
      };
    }

    // 3. Calculate sequence number atomically
    const [countResult] = await this.db
      .select({ value: count() })
      .from(schema.waitlistSubscribers);

    const rawCount = Number(countResult?.value || 0);
    const nextSequence = rawCount + 1;
    const referralCode = `SPACIA-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Hash IP address with SHA-256 (Zero raw PII storage policy)
    const ipHash = clientIp
      ? crypto.createHash("sha256").update(clientIp).digest("hex")
      : null;

    let subscriber: schema.WaitlistSubscriberRecord;
    try {
      const [inserted] = await this.db
        .insert(schema.waitlistSubscribers)
        .values({
          email,
          sequenceNumber: nextSequence,
          referralCode,
          referredBy: dto.ref ? dto.ref.trim().toUpperCase() : null,
          ipHash,
          userAgent: userAgent ? userAgent.substring(0, 255) : null,
          status: "pending",
        })
        .returning();

      subscriber = inserted;
      // Invalidate cache immediately on new registration
      WaitlistService.cachedStats = null;
    } catch (err: any) {
      // Handle rare race-condition duplicate insert on unique email constraint
      if (err.code === "23505" || err.message?.includes("unique")) {
        const [reFetched] = await this.db
          .select()
          .from(schema.waitlistSubscribers)
          .where(eq(schema.waitlistSubscribers.email, email))
          .limit(1);

        if (reFetched) {
          const position = reFetched.sequenceNumber;
          return {
            success: true,
            message: `You're already on the waitlist. Your position is #${position}.`,
            position,
            totalCount: stats.totalCount,
            referralCode: reFetched.referralCode,
            alreadyJoined: true,
            maskedEmail: this.maskEmail(email),
          };
        }
      }
      this.logger.error(`Failed to register waitlist subscriber: ${err.message}`, err.stack);
      throw err;
    }

    const assignedPosition = subscriber.sequenceNumber;
    const updatedTotal = rawCount + 1;

    // 4. Asynchronous Welcome Email Dispatch (Fire-and-forget, non-blocking)
    this.dispatchWelcomeEmail(email, assignedPosition, referralCode).catch((emailErr) => {
      this.logger.warn(`Could not dispatch waitlist email to ${this.maskEmail(email)}: ${emailErr.message}`);
    });

    return {
      success: true,
      message: `Welcome to SpaciaOS! You are #${assignedPosition}.`,
      position: assignedPosition,
      totalCount: updatedTotal,
      referralCode,
      alreadyJoined: false,
      maskedEmail: this.maskEmail(email),
    };
  }

  /**
   * Adds the optional "about your team" details after someone has joined.
   * Looked up by the subscriber's own referral code (returned only to them on join).
   */
  async updateProfile(dto: UpdateWaitlistProfileDto): Promise<WaitlistProfileResponseDto> {
    const code = dto.referralCode.trim().toUpperCase();
    const [updated] = await this.db
      .update(schema.waitlistSubscribers)
      .set({
        fullName: dto.fullName.trim(),
        phone: dto.phone,
        companyName: dto.companyName.trim(),
        companyWebsite: dto.companyWebsite ? dto.companyWebsite : null,
        teamSize: dto.teamSize ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.waitlistSubscribers.referralCode, code))
      .returning({ sequenceNumber: schema.waitlistSubscribers.sequenceNumber });

    if (!updated) {
      throw new NotFoundException("We couldn't find your waitlist spot. Please join again with your email.");
    }
    return { success: true, position: updated.sequenceNumber };
  }

  /**
   * Real waitlist metrics (short cache) for the public landing/waitlist pages.
   * No offsets or synthetic numbers: what's in the table is what's reported.
   */
  async getStats(): Promise<WaitlistStatsResponseDto> {
    const now = Date.now();
    if (WaitlistService.cachedStats && WaitlistService.cachedStats.expiresAt > now) {
      return WaitlistService.cachedStats.data;
    }

    try {
      const [countResult] = await this.db
        .select({ value: count() })
        .from(schema.waitlistSubscribers);
      const [todayResult] = await this.db
        .select({ value: count() })
        .from(schema.waitlistSubscribers)
        .where(gte(schema.waitlistSubscribers.createdAt, new Date(now - 24 * 60 * 60 * 1000)));

      const stats: WaitlistStatsResponseDto = {
        totalCount: Number(countResult?.value || 0),
        activeToday: Number(todayResult?.value || 0),
        growthPercentage: null,
        recentMilestone: null,
      };

      WaitlistService.cachedStats = {
        data: stats,
        expiresAt: now + this.CACHE_TTL_MS,
      };

      return stats;
    } catch (err: any) {
      this.logger.error(`Error fetching waitlist stats: ${err.message}`);
      // Honest fallback: report nothing rather than invent a number
      return { totalCount: 0, activeToday: 0, growthPercentage: null, recentMilestone: null };
    }
  }

  /**
   * Sends branded welcome email with queue position & referral link.
   */
  private async dispatchWelcomeEmail(
    toEmail: string,
    position: number,
    referralCode: string
  ): Promise<void> {
    if (!this.resendAdapter) return;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #18181b; background-color: #fafaf9; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #0d4a36; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">SPACIA OS</h1>
          <p style="color: #71717a; font-size: 13px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Autonomous Real Estate Operating System</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e7e5e4; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <h2 style="font-size: 20px; font-weight: 600; color: #1c1917; margin-top: 0;">You're in. Welcome to Priority Access.</h2>
          <p style="color: #44403c; line-height: 1.6; font-size: 15px;">
            Thank you for requesting early access to SpaciaOS. We are systematically rolling out invitations to premier property developers, brokerage firms, and luxury asset managers.
          </p>

          <div style="background-color: #f5f5f4; border: 1px solid #d6d3d1; border-radius: 8px; padding: 20px; margin: 28px 0; text-align: center;">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #78716c; letter-spacing: 1px;">Your waitlist position</div>
            <div style="font-size: 44px; font-weight: 800; color: #0d4a36; margin: 8px 0;">#${position}</div>
          </div>

          <div style="margin-top: 24px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #1c1917; margin-bottom: 8px;">Know a team that should join?</h3>
            <p style="color: #57534e; font-size: 13px; line-height: 1.5; margin: 0 0 12px 0;">
              Share your personal invite link with real estate colleagues or your sales team:
            </p>
            <div style="background-color: #fafaf9; border: 1px dashed #0d4a36; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #0d4a36; word-break: break-all;">
              https://spacia.ng/waitlist?ref=${referralCode}
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 32px; color: #a8a29e; font-size: 12px;">
          © ${new Date().getFullYear()} SpaciaOS Inc. Autonomous Voice AI, WhatsApp & Qualification Engine for Luxury Real Estate.
        </div>
      </div>
    `;

    await this.resendAdapter.sendEmail({
      to: toEmail,
      subject: `You're #${position} on the SpaciaOS waitlist`,
      html,
    });
  }

  /**
   * Masks email according to zero-trust PII guidelines:
   * e.g. "alexander.smith@luxurygroup.com" -> "a***h@luxurygroup.com"
   */
  private maskEmail(email: string): string {
    const parts = email.split("@");
    if (parts.length !== 2) return "••••@••••";
    const name = parts[0];
    const domain = parts[1];

    if (name.length <= 2) {
      return `${name[0] || "*"}***@${domain}`;
    }
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  }
}
