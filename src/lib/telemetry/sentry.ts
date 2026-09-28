/**
 * SPACIA FRONTEND CLIENT TELEMETRY & SENTRY INTEGRATION
 * 
 * Production-ready client error and event monitoring abstraction.
 * Safely collects uncaught exceptions, error boundary digests, and user actions
 * while ensuring recursive PII scrubbing (emails, Nigerian phone numbers, tokens).
 */

export interface TelemetryContext {
  workspaceId?: string;
  userId?: string;
  route?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

export interface Breadcrumb {
  category: "navigation" | "action" | "api" | "ui";
  message: string;
  data?: Record<string, unknown>;
  timestamp?: number;
}

class TelemetryClient {
  private dsn: string | null = null;
  private environment: string = "production";
  private breadcrumbs: Breadcrumb[] = [];
  private readonly MAX_BREADCRUMBS = 50;

  constructor() {
    if (typeof window !== "undefined") {
      this.dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || null;
      this.environment = process.env.NODE_ENV || "production";
      this.setupGlobalHandlers();
    }
  }

  /**
   * Initializes client telemetry if not already mounted.
   */
  public init(dsn?: string): void {
    if (dsn) {
      this.dsn = dsn;
    }
  }

  /**
   * Captures an error or exception with optional context and breadcrumbs.
   */
  public captureException(error: Error | unknown, context?: TelemetryContext): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sanitizedContext = this.sanitize(context || {});
    const rawMessage = error instanceof Error ? error.message : String(error);
    const errorMessage = this.scrubString(rawMessage);
    const stack = error instanceof Error && error.stack ? this.scrubString(error.stack) : undefined;

    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Telemetry] Captured exception [${errorId}]:`, errorMessage, {
        context: sanitizedContext,
        breadcrumbs: this.breadcrumbs.slice(-5),
      });
    }

    // In a live environment with NEXT_PUBLIC_SENTRY_DSN configured, dispatch via beacon or Sentry API
    if (this.dsn && typeof window !== "undefined") {
      try {
        const payload = JSON.stringify({
          errorId,
          message: errorMessage,
          stack,
          context: sanitizedContext,
          breadcrumbs: this.breadcrumbs,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });

        // Use sendBeacon for non-blocking telemetry delivery
        if (navigator.sendBeacon) {
          navigator.sendBeacon(this.dsn, payload);
        }
      } catch {
        // Silently preserve stability if reporting fails
      }
    }

    return errorId;
  }

  /**
   * Records a user or system breadcrumb leading up to an event.
   */
  public addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now(),
      data: breadcrumb.data ? (this.sanitize(breadcrumb.data) as Record<string, unknown>) : undefined,
    });

    if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Captures an informational or warning message.
   */
  public captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
    this.addBreadcrumb({
      category: "ui",
      message: `[${level.toUpperCase()}] ${message}`,
    });
  }

  /**
   * Recursive PII scrubbing utility:
   * Masks emails, Nigerian phone numbers (+234 / 080 / etc), bearer tokens.
   */
  public sanitize<T>(data: T): T {
    if (!data) return data;
    if (typeof data === "string") {
      return this.scrubString(data) as unknown as T;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item)) as unknown as T;
    }
    if (typeof data === "object") {
      const sanitizedObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes("password") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("token") ||
          lowerKey.includes("key")
        ) {
          sanitizedObj[key] = "[REDACTED_SECRET]";
        } else {
          sanitizedObj[key] = this.sanitize(value);
        }
      }
      return sanitizedObj as unknown as T;
    }
    return data;
  }

  private scrubString(str: string): string {
    // Scrub email addresses
    let result = str.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[REDACTED_EMAIL]");
    // Scrub Nigerian phone formats: +234..., 080..., 090..., 070..., 081...
    result = result.replace(/(?:\+234|0)[789][01]\d{8}/g, "[REDACTED_PHONE]");
    // Scrub API keys / tokens (sk_live_..., whsec_...)
    result = result.replace(/(?:sk|whsec|key|token)_[a-zA-Z0-9_-]+/gi, "[REDACTED_SECRET]");
    return result;
  }

  private setupGlobalHandlers(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event) => {
      this.captureException(event.error || event.message, {
        route: window.location.pathname,
        action: "uncaught_window_error",
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.captureException(event.reason, {
        route: window.location.pathname,
        action: "unhandled_promise_rejection",
      });
    });
  }
}

export const telemetry = new TelemetryClient();
