import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_METADATA_KEY = "rate_limit_options";

export interface RateLimitOptions {
  /** Maximum number of allowed requests in the duration window */
  points: number;
  /** Duration window in seconds */
  duration: number;
  /** Key prefix (e.g. 'ingest', 'chat', 'auth') */
  keyPrefix?: string;
  /** Custom error message when throttled */
  errorMessage?: string;
}

/**
 * Decorator to apply granular rate limits to controllers or route handlers.
 * Example: @RateLimit({ points: 10, duration: 60 }) // 10 reqs per minute
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_METADATA_KEY, options);
