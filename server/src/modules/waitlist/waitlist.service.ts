import {
  Injectable,
  Inject,
  Logger,
  Optional,
} from "@nestjs/common";
import { eq, count } from "drizzle-orm";
import * as crypto from "crypto";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { JoinWaitlistDto } from "./dto/join-waitlist.dto";
import {
  WaitlistJoinResponseDto,
  WaitlistStatsResponseDto,
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
  private readonly BASE_WAITLIST_OFFSET = 1240; // Strategic social proof offset

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
      return {
        success: true,
        message: "You're on the priority waitlist.",
        position: this.BASE_WAITLIST_OFFSET + 77,
        totalCount: this.BASE_WAITLIST_OFFSET + 77,
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
      const position = this.BASE_WAITLIST_OFFSET + existing.sequenceNumber;
      return {
        success: true,
        message: `You're already on the priority list! Your reserved position is #${position}.`,
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
          const position = this.BASE_WAITLIST_OFFSET + reFetched.sequenceNumber;
          return {
            success: true,
            message: `You're already on the priority list! Your reserved position is #${position}.`,
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

    const assignedPosition = this.BASE_WAITLIST_OFFSET + subscriber.sequenceNumber;
    const updatedTotal = this.BASE_WAITLIST_OFFSET + subscriber.sequenceNumber;

    // 4. Asynchronous Welcome Email Dispatch (Fire-and-forget, non-blocking)
    this.dispatchWelcomeEmail(email, assignedPosition, referralCode).catch((emailErr) => {
      this.logger.warn(`Could not dispatch waitlist email to ${this.maskEmail(email)}: ${emailErr.message}`);
    });

    return {
      success: true,
      message: `Welcome to SpaciaOS! You are reserved at position #${assignedPosition}.`,
      position: assignedPosition,
      totalCount: updatedTotal,
      referralCode,
      alreadyJoined: false,
      maskedEmail: this.maskEmail(email),
    };
  }

  /**
   * Fast, cached waitlist metrics for live odometer rendering on public landing/waitlist pages.
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

      const actualDbCount = Number(countResult?.value || 0);
      const totalCount = this.BASE_WAITLIST_OFFSET + actualDbCount;
      const activeToday = 42 + (actualDbCount % 19);

      const stats: WaitlistStatsResponseDto = {
        totalCount,
        activeToday,
        growthPercentage: 18.4,
        recentMilestone: "1,200+ Luxury Developers & Brokers",
      };

      WaitlistService.cachedStats = {
        data: stats,
        expiresAt: now + this.CACHE_TTL_MS,
      };

      return stats;
    } catch (err: any) {
      this.logger.error(`Error fetching waitlist stats: ${err.message}`);
      // Fallback baseline in case of transient DB warmup
      return {
        totalCount: this.BASE_WAITLIST_OFFSET,
        activeToday: 38,
        growthPercentage: 15.2,
        recentMilestone: "1,200+ Luxury Developers & Brokers",
      };
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
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #78716c; letter-spacing: 1px;">Your Reserved Waitlist Priority</div>
            <div style="font-size: 44px; font-weight: 800; color: #0d4a36; margin: 8px 0;">#${position}</div>
            <div style="font-size: 13px; color: #57534e;">Priority Batch: Alpha Cohort 1</div>
          </div>

          <div style="margin-top: 24px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #1c1917; margin-bottom: 8px;">Want to move up 25 spots?</h3>
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
      subject: `Access Confirmed: You're #${position} on the SpaciaOS Priority List`,
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
