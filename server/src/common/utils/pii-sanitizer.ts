/**
 * PII SANITIZER & SENSITIVE DATA REDACTOR
 * 
 * Protects customer Personally Identifiable Information (PII) and secret credentials
 * from leaking into system logs, diagnostic outputs, and audit records.
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "secret",
  "clientsecret",
  "client_secret",
  "webhooksecret",
  "webhook_secret",
  "token",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "apikey",
  "api_key",
  "authorization",
  "privatekey",
  "private_key",
  "credential",
  "credentials",
  "creditcard",
  "cvv",
  "ssn",
]);

export class PiiSanitizer {
  /**
   * Masks email address: 'tunde.bakare@spacia.ng' -> 't***e@spacia.ng'
   */
  static maskEmail(email?: string | null): string {
    if (!email || !email.includes("@")) return "[REDACTED_EMAIL]";
    const [local, domain] = email.split("@");
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  /**
   * Masks telephone number: '+2348011223344' -> '+234••••••3344'
   */
  static maskPhone(phone?: string | null): string {
    if (!phone) return "[REDACTED_PHONE]";
    const clean = phone.trim();
    if (clean.length < 8) return "[REDACTED_PHONE]";
    const prefix = clean.slice(0, 4);
    const suffix = clean.slice(-4);
    return `${prefix}••••••${suffix}`;
  }

  /**
   * Masks secrets/keys: 'whsec_live_1234567890abcdef' -> '••••••••••••cdef'
   */
  static maskSecret(secret?: string | null): string {
    if (!secret) return "••••••••••••";
    const clean = secret.trim();
    if (clean.length <= 8) return "••••••••";
    const suffix = clean.slice(-4);
    return `••••••••••••${suffix}`;
  }

  /**
   * Recursively sanitizes data payloads, masking any recognized sensitive fields.
   */
  static sanitizePayload<T = any>(data: T, maxDepth = 5): T {
    if (data === null || data === undefined) return data;
    if (maxDepth <= 0) return "[MAX_DEPTH]" as any;

    if (typeof data === "string") {
      // Check if string looks like an authorization header
      if (data.toLowerCase().startsWith("bearer ")) {
        return "Bearer ••••••••••••" as any;
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizePayload(item, maxDepth - 1)) as any;
    }

    if (typeof data === "object") {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");

        if (typeof value === "object" && value !== null) {
          sanitized[key] = this.sanitizePayload(value, maxDepth - 1);
        } else if (SENSITIVE_KEYS.has(normalizedKey)) {
          sanitized[key] = typeof value === "string" ? this.maskSecret(value) : "[REDACTED]";
        } else if (normalizedKey === "email" && typeof value === "string") {
          sanitized[key] = this.maskEmail(value);
        } else if (normalizedKey === "phone" && typeof value === "string") {
          sanitized[key] = this.maskPhone(value);
        } else {
          sanitized[key] = this.sanitizePayload(value, maxDepth - 1);
        }
      }
      return sanitized as T;
    }

    return data;
  }
}
