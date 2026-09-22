export class LeadNormalizerUtils {
  /**
   * Normalizes a phone number into standardized E.164-compatible format.
   * Handles local Nigerian prefixes (070, 080, 081, 090, 091) -> +234...
   * Handles international numbers by stripping non-digit chars (except leading +).
   */
  static normalizePhone(rawPhone: string): string {
    if (!rawPhone) return "";

    // Strip spaces, dashes, dots, parentheses, and tabs
    let cleaned = rawPhone.trim().replace(/[\s\-\.\(\)]/g, "");

    // Handle Nigerian local format: starts with 0 followed by 10 digits (e.g., 08031234567)
    if (/^0[789][01]\d{8}$/.test(cleaned)) {
      return `+234${cleaned.substring(1)}`;
    }

    // Handle Nigerian format starting with 234 without plus (e.g., 2348031234567)
    if (/^234[789][01]\d{8}$/.test(cleaned)) {
      return `+${cleaned}`;
    }

    // If starts with +, keep + and strip any remaining non-digits
    if (cleaned.startsWith("+")) {
      return `+${cleaned.substring(1).replace(/\D/g, "")}`;
    }

    // Otherwise, ensure digits only and prefix with + if standard international format
    cleaned = cleaned.replace(/\D/g, "");
    return cleaned.length > 7 ? `+${cleaned}` : cleaned;
  }

  /**
   * Normalizes an email address: trims whitespace and lowercases.
   */
  static normalizeEmail(rawEmail?: string): string | undefined {
    if (!rawEmail) return undefined;
    const cleaned = rawEmail.trim().toLowerCase();
    return cleaned.length > 0 ? cleaned : undefined;
  }

  /**
   * Normalizes lead full name: trims whitespace and normalizes internal spaces.
   */
  static normalizeName(rawName: string): string {
    if (!rawName) return "";
    return rawName.trim().replace(/\s+/g, " ");
  }

  /**
   * Normalizes strings such as budget, location, or source.
   */
  static normalizeString(val?: string): string | undefined {
    if (!val) return undefined;
    const cleaned = val.trim();
    return cleaned.length > 0 ? cleaned : undefined;
  }
}
