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
      "Spacia Viewings <notifications@spacia.io>";

    if (apiKey && provider !== "mock") {
      this.resendClient = new Resend(apiKey);
      this.isMockMode = false;
      this.logger.log("[Resend Adapter] Initialized live Resend provider");
    } else {
      this.isMockMode = true;
      this.logger.log("[Resend Adapter] Initialized deterministic mock provider (MOCK_MODE=true)");
    }
  }

  /**
   * Dispatches email via Resend or mock fallback
   */
  async sendEmail(
    options: SendEmailOptions
  ): Promise<{ id: string; status: NotificationDeliveryStatus }> {
    const toRecipients = Array.isArray(options.to) ? options.to : [options.to];
    const fromAddress = options.from || this.defaultFrom;

    if (!this.isMockMode && this.resendClient) {
      try {
        const { data, error } = await this.resendClient.emails.send({
          from: fromAddress,
          to: toRecipients,
          subject: options.subject,
          html: options.html,
          text: options.text,
          replyTo: options.replyTo,
        });

        if (error) {
          this.logger.error(`[Resend Error] Failed to send email to ${toRecipients.join(", ")}: ${error.message}`);
          throw new Error(`Resend dispatch failure: ${error.message}`);
        }

        const messageId = data?.id || `resend_${randomUUID()}`;
        this.logger.log(`[Resend Sent] Message [${messageId}] delivered to ${toRecipients.join(", ")}`);
        return { id: messageId, status: "delivered" };
      } catch (err) {
        this.logger.error(`[Resend Exception] Falling back to recorded delivery: ${(err as Error).message}`);
        // Return gracefully so flow is never blocked
        return { id: `resend_err_${randomUUID().slice(0, 8)}`, status: "failed" };
      }
    }

    // Deterministic Mock Mode
    const mockId = `resend_mock_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    this.logger.log(
      `[Resend MOCK] Simulated email to [${toRecipients.join(", ")}] — Subject: "${options.subject}" (MsgID: ${mockId})`
    );

    return { id: mockId, status: "mock_delivered" };
  }
}
