/* Server-safe currency lookup from the visitor's country. */

export type Currency = "NGN" | "USD" | "GBP" | "EUR";

export const EU = new Set(["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"]);

// Country headers are added by the hosting provider / CDN (Vercel, Cloudflare,
// CloudFront, or a proxy), never by the browser. Checked in this order.
const COUNTRY_HEADERS = ["x-vercel-ip-country", "cf-ipcountry", "cloudfront-viewer-country", "x-country-code"];

export function currencyFromHeaders(h: Headers): Currency | null {
  for (const name of COUNTRY_HEADERS) {
    const cc = h.get(name)?.trim().toUpperCase();
    // Cloudflare sends XX (unknown) and T1 (Tor) when it can't tell
    if (!cc || !/^[A-Z]{2}$/.test(cc) || cc === "XX" || cc === "T1") continue;
    if (cc === "NG") return "NGN";
    if (cc === "GB") return "GBP";
    if (EU.has(cc)) return "EUR";
    return "USD";
  }
  return null;
}
