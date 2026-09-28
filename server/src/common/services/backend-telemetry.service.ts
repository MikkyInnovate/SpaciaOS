import { Injectable, Logger } from "@nestjs/common";
import { EnvService } from "../../config/env.service";
import { PiiSanitizer } from "../utils/pii-sanitizer";

export interface ErrorContext {
  workspaceId?: string;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  extra?: Record<string, unknown>;
}

@Injectable()
export class BackendTelemetryService {
  private readonly logger = new Logger(BackendTelemetryService.name);
  private readonly dsn?: string;

  constructor(private readonly envService: EnvService) {
    this.dsn = this.envService.sentryDsn;
  }

  /**
   * Captures an exception, scrubs PII, records an error correlation ID,
   * and optionally transmits to Sentry HTTP endpoint.
   */
  captureException(error: unknown, context?: ErrorContext): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sanitizedContext = PiiSanitizer.sanitizePayload(context || {});
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    // In production with SENTRY_DSN configured, forward event
    if (this.dsn && this.envService.isProduction) {
      try {
        const payload = JSON.stringify({
          event_id: errorId,
          timestamp: new Date().toISOString(),
          platform: "node",
          environment: this.envService.nodeEnv,
          level: "error",
          exception: {
            values: [
              {
                type: error instanceof Error ? error.constructor.name : "Error",
                value: errorMessage,
                stacktrace: stack ? { frames: stack.split("\n") } : undefined,
              },
            ],
          },
          extra: sanitizedContext,
        });

        // Fire-and-forget non-blocking fetch
        fetch(this.dsn, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        }).catch((err) => {
          this.logger.warn(`Failed to dispatch telemetry to Sentry: ${err.message}`);
        });
      } catch {
        // Suppress transmission failures to protect main execution thread
      }
    }

    return errorId;
  }

  /**
   * Captures informational or security messages.
   */
  captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: ErrorContext): string {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    if (this.envService.isProduction && this.dsn && level === "error") {
      this.captureException(new Error(message), context);
    }
    return messageId;
  }
}
