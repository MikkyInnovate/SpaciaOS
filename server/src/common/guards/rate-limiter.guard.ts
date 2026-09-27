import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request, Response } from "express";
import {
  RATE_LIMIT_METADATA_KEY,
  RateLimitOptions,
} from "./rate-limit.decorator";

interface RateLimitEntry {
  timestamps: number[];
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly logger = new Logger(RateLimiterGuard.name);
  private static readonly memoryStore = new Map<string, RateLimitEntry>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If route doesn't specify options and isn't globally bound, allow
    if (!options) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: { id?: string }; tenantContext?: { workspaceId?: string } }>();
    const res = http.getResponse<Response>();

    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const userId = req.user?.id;
    const workspaceId =
      req.tenantContext?.workspaceId ||
      (req.headers["x-workspace-id"] as string) ||
      (req.headers["x-tenant-id"] as string);

    const identifier = userId
      ? `user:${userId}`
      : workspaceId
      ? `ws:${workspaceId}:${clientIp}`
      : `ip:${clientIp}`;

    const keyPrefix = options.keyPrefix || req.route?.path || req.path || "general";
    const bucketKey = `rl:${keyPrefix}:${identifier}`;

    const now = Date.now();
    const windowMs = options.duration * 1000;
    const windowStart = now - windowMs;

    let entry = RateLimiterGuard.memoryStore.get(bucketKey);
    if (!entry) {
      entry = { timestamps: [] };
      RateLimiterGuard.memoryStore.set(bucketKey, entry);
    }

    // Prune entries outside sliding window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    const currentUsage = entry.timestamps.length;
    const oldestTimestamp = entry.timestamps[0] || now;
    const resetTime = Math.ceil((oldestTimestamp + windowMs) / 1000);
    const retryAfter = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));

    if (currentUsage >= options.points) {
      if (res && typeof res.setHeader === "function") {
        res.setHeader("X-RateLimit-Limit", options.points.toString());
        res.setHeader("X-RateLimit-Remaining", "0");
        res.setHeader("X-RateLimit-Reset", resetTime.toString());
        res.setHeader("Retry-After", retryAfter.toString());
      }

      this.logger.warn(
        `[RATE LIMIT EXCEEDED] Key: ${bucketKey}, Usage: ${currentUsage}/${options.points}, Retry-After: ${retryAfter}s`
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: "Too Many Requests",
          message:
            options.errorMessage ||
            `Too many requests. Rate limit of ${options.points} requests per ${options.duration}s exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    entry.timestamps.push(now);
    const remaining = Math.max(0, options.points - entry.timestamps.length);

    // Standard rate limit response headers
    if (res && typeof res.setHeader === "function") {
      res.setHeader("X-RateLimit-Limit", options.points.toString());
      res.setHeader("X-RateLimit-Remaining", remaining.toString());
      res.setHeader("X-RateLimit-Reset", resetTime.toString());
    }

    return true;
  }

  /**
   * Helper for tests to reset in-memory buckets
   */
  static resetStore() {
    RateLimiterGuard.memoryStore.clear();
  }
}
