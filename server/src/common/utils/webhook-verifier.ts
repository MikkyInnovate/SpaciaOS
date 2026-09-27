import * as crypto from "crypto";

export class WebhookVerifier {
  /**
   * Verifies an HMAC-SHA256 signature using timing-safe comparison.
   * Prevents timing attacks on signature validation.
   */
  static verifyHmacSha256(
    payload: string | Buffer | object,
    receivedSignature?: string | null,
    secret?: string | null
  ): boolean {
    if (!receivedSignature || !secret) {
      return false;
    }

    try {
      const payloadString =
        typeof payload === "string"
          ? payload
          : Buffer.isBuffer(payload)
          ? payload.toString("utf8")
          : JSON.stringify(payload);

      // Clean prefix if provided (e.g. 'sha256=', 'v1=', 't=...,v1=...')
      let cleanReceived = receivedSignature.trim();
      if (cleanReceived.startsWith("sha256=")) {
        cleanReceived = cleanReceived.slice(7);
      } else if (cleanReceived.startsWith("v1=")) {
        cleanReceived = cleanReceived.slice(3);
      }

      const computedHmac = crypto
        .createHmac("sha256", secret)
        .update(payloadString)
        .digest("hex");

      const receivedBuf = Buffer.from(cleanReceived, "hex");
      const computedBuf = Buffer.from(computedHmac, "hex");

      if (receivedBuf.length !== computedBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(receivedBuf, computedBuf);
    } catch {
      return false;
    }
  }

  /**
   * Generates a valid HMAC-SHA256 signature for testing or outbound webhooks.
   */
  static generateSignature(payload: string | Buffer | object, secret: string): string {
    const payloadString =
      typeof payload === "string"
        ? payload
        : Buffer.isBuffer(payload)
        ? payload.toString("utf8")
        : JSON.stringify(payload);

    return crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
  }
}
