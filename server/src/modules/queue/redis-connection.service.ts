import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
} from "@nestjs/common";
import Redis, { RedisOptions } from "ioredis";
import { EnvService } from "../../config/env.service";

/**
 * REDIS CONNECTION SERVICE
 * 
 * Manages the authoritative Redis connection for BullMQ queue operations.
 * Enforces strict connection visibility: surfaces infrastructure failures
 * rather than concealing them.
 */
@Injectable()
export class RedisConnectionService
  implements OnApplicationShutdown, OnModuleDestroy
{
  private readonly logger = new Logger(RedisConnectionService.name);
  private client: Redis | null = null;

  constructor(private readonly envService: EnvService) {}

  /**
   * Returns standardized ioredis options suitable for BullMQ.
   * Note: BullMQ requires `maxRetriesPerRequest: null`.
   */
  getConnectionOptions(): RedisOptions {
    const baseOptions: RedisOptions = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        // Stop retrying after 2 attempts in test to fail fast
        if (this.envService.nodeEnv === "test" && times > 2) {
          return null;
        }
        return Math.min(times * 500, 3000);
      },
    };

    if (this.envService.redisUrl) {
      try {
        const parsed = new URL(this.envService.redisUrl);
        return {
          ...baseOptions,
          host: parsed.hostname,
          port: parseInt(parsed.port || (parsed.protocol === "rediss:" ? "6380" : "6379"), 10),
          password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
          tls: parsed.protocol === "rediss:" ? {} : undefined,
        };
      } catch (err: any) {
        this.logger.error(`Failed to parse REDIS_URL: ${err.message}`);
      }
    }

    return {
      ...baseOptions,
      host: this.envService.redisHost,
      port: this.envService.redisPort,
      password: this.envService.redisPassword || undefined,
    };
  }

  /**
   * Returns or instantiates the singleton Redis client.
   */
  getClient(): Redis {
    if (this.client) {
      return this.client;
    }

    const options = this.getConnectionOptions();
    if (this.envService.redisUrl) {
      this.client = new Redis(this.envService.redisUrl, options);
    } else {
      this.client = new Redis(options);
    }

    this.client.on("connect", () => {
      this.logger.log("Redis connection established successfully.");
    });

    this.client.on("error", (err) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
    });

    return this.client;
  }

  /**
   * Verifies whether Redis is currently reachable via a lightweight, bounded PING probe.
   * Surfaces failure explicitly without hanging or silent fallbacks.
   */
  async isAvailable(): Promise<boolean> {
    const options = this.getConnectionOptions();
    const probe = new Redis({
      ...options,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 1000,
      retryStrategy: () => null, // Immediate exit, do not retry probe
    });

    probe.on("error", () => {
      // Suppress unhandled event emitter warning on probe failure
    });

    try {
      await Promise.race([
        (async () => {
          await probe.connect();
          const pong = await probe.ping();
          return pong === "PONG";
        })(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error("Connection probe timed out")), 1200)
        ),
      ]);
      await probe.quit().catch(() => probe.disconnect());
      return true;
    } catch (err: any) {
      this.logger.warn(
        `Redis is unavailable at ${this.envService.redisHost}:${this.envService.redisPort}: ${err.message}`
      );
      probe.disconnect();
      return false;
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async onApplicationShutdown() {
    await this.disconnect();
  }

  private async disconnect() {
    if (this.client) {
      this.logger.log("Closing Redis connection...");
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
      this.client = null;
    }
  }
}
