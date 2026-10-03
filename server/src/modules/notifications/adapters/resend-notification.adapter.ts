import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { randomUUID } from "crypto";
import {
  NotificationDeliveryStatus,
  SendEmailOptions,
} from "../interfaces/notification.interface";

@Injectable()
export class ResendNotificationAdapter {
  private readonly logger = new Logger(ResendNotificationAdapter.name);
  private resendClient: Resend | null = null;
  private readonly defaultFrom: string;
  private readonly isMockMode: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    const provider = this.configService.get<string>("NOTIFICATION_PROVIDER") || "mock";
    this.defaultFrom =
      this.configService.get<string>("RESEND_FROM_EMAIL") ||
      "SpaciaOS <onboarding@resend.dev>";

    if (apiKey && apiKey.trim().length > 0 && provider === "resend") {
      this.resendClient = new Resend(apiKey.trim());
      this.isMockMode = false;
      this.logger.log("[Notifications Engine] Initialized live Resend provider for real email dispatch");
    } else {
      this.isMockMode = true;
      if (provider === "resend" && (!apiKey || apiKey.trim().length === 0)) {
        this.logger.warn(
          "[Notifications Engine] NOTIFICATION_PROVIDER is set to 'resend' but RESEND_API_KEY is not configured. Running in safe simulation fallback."
        );
      } else {
        this.logger.log("[Notifications Engine] Initialized deterministic mock provider (simulation mode)");
      }
    }
  }

  /**
   * Dispatches email via Resend or mock fallback
   */
  async sendEmail(
    options: SendEmailOptions
  ): Promise<{ id: string; status: NotificationDeliveryStatus }> {
    const rawRecipients = Array.isArray(options.to) ? options.to : [options.to];
    const testRecipient = this.configService.get<string>("RESEND_TEST_RECIPIENT");
    const isSandboxRedirect = Boolean(testRecipient && testRecipient.trim().length > 0);
    const toRecipients = isSandboxRedirect ? [testRecipient!.trim()] : rawRecipients;
    const fromAddress = options.from || this.defaultFrom;

    if (isSandboxRedirect) {
      this.logger.log(
        `[Notifications Engine] Sandbox active: email intended for ${rawRecipients.join(", ")} redirected to verified account ${toRecipients.join(", ")} (onboarding@resend.dev free domain restriction).`
      );
    }

    if (!this.isMockMode && this.resendClient) {
      try {
        let finalHtml = options.html;
        let finalSubject = options.subject;

        if (isSandboxRedirect && finalHtml) {
          finalSubject = `[For: ${rawRecipients.join(", ")}] ${options.subject}`;
          const banner = `
            <div style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 10px 14px; border-radius: 8px; font-size: 11px; margin-bottom: 20px; font-family: -apple-system, sans-serif; line-height: 1.4;">
              <strong>Resend Sandbox Notice:</strong> This email was intended for <strong>${rawRecipients.join(", ")}</strong>. Because the system is using the free <code>onboarding@resend.dev</code> domain, Resend strictly allows deliveries only to the verified account owner (<code>${toRecipients.join(", ")}</code>). To deliver to any address, verify a custom domain at resend.com/domains.
            </div>
          `;
          finalHtml = banner + finalHtml;
        }

        const { data, error } = await this.resendClient.emails.send({
          from: fromAddress,
          to: toRecipients,
          subject: finalSubject,
          html: finalHtml,
          text: options.text,
          replyTo: options.replyTo,
        });

        if (error) {
          this.logger.warn(`[Notifications Engine] Delivery error to ${toRecipients.join(", ")}: ${error.message}`);
          throw new Error(`Dispatch failure: ${error.message}`);
        }

        const messageId = data?.id || `resend_${randomUUID()}`;
        this.logger.log(`[Notifications Engine] Message [${messageId}] delivered to ${toRecipients.join(", ")} (Subject: "${options.subject}")`);
        return { id: messageId, status: "delivered" };
      } catch (err) {
        this.logger.error(`[Notifications Engine] Live dispatch exception: ${(err as Error).message}`);
        // Return gracefully so appointment creation is never blocked
        return { id: `notif_err_${randomUUID().slice(0, 8)}`, status: "failed" };
      }
    }

    // Deterministic Mock Mode
    const mockId = `resend_mock_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    this.logger.log(
      `[Notifications Engine] Simulated dispatch to [${toRecipients.join(", ")}] — Subject: "${options.subject}" (MsgID: ${mockId})`
    );

    return { id: mockId, status: "mock_delivered" };
  }
}
