import { Injectable, Inject, Logger, ServiceUnavailableException } from "@nestjs/common";
import { NEON_POOL } from "../../database/database.provider";
import type { Pool } from "@neondatabase/serverless";
import { RedisConnectionService } from "../queue/redis-connection.service";
import { EnvService } from "../../config/env.service";

export interface SystemReadiness {
  status: "ready" | "degraded" | "unhealthy";
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  subsystems: {
    database: {
      status: "connected" | "disconnected";
      latencyMs: number | null;
      error?: string;
    };
    redis: {
      status: "connected" | "offline" | "disabled";
      latencyMs: number | null;
    };
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject(NEON_POOL) private readonly pool: Pool,
    private readonly redisService: RedisConnectionService,
    private readonly envService: EnvService
  ) {}

  /**
   * Fast Liveness Probe: Verifies whether the process is alive.
   */
  async check() {
    let databaseStatus = "disconnected";
    let databaseLatencyMs: number | null = null;
    let databaseDetails: string | undefined = undefined;

    const start = Date.now();
    try {
      await this.pool.query("SELECT 1");
      databaseStatus = "connected";
      databaseLatencyMs = Date.now() - start;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Neon database connection probe failed: ${errorMsg}`);
      databaseDetails = errorMsg;
    }

    return {
      status: databaseStatus === "connected" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      ...(databaseLatencyMs !== null ? { databaseLatencyMs } : {}),
      ...(databaseDetails ? { databaseDetails } : {}),
    };
  }

  /**
   * Deep Production Readiness Probe:
   * Verifies database, queue/redis, memory bounds, and returns HTTP 503 if critical infra is down.
   */
  async checkReadiness(): Promise<SystemReadiness> {
    const startDb = Date.now();
    let dbStatus: "connected" | "disconnected" = "disconnected";
    let dbLatency: number | null = null;
    let dbError: string | undefined;

    try {
      await this.pool.query("SELECT 1");
      dbStatus = "connected";
      dbLatency = Date.now() - startDb;
    } catch (err: any) {
      dbError = err?.message || String(err);
      this.logger.error(`Database readiness check failed: ${dbError}`);
    }

    // Check Redis availability
    const startRedis = Date.now();
    let redisStatus: "connected" | "offline" | "disabled" = "offline";
    let redisLatency: number | null = null;

    try {
      const isAvailable = await this.redisService.isAvailable();
      if (isAvailable) {
        redisStatus = "connected";
        redisLatency = Date.now() - startRedis;
      }
    } catch {
      redisStatus = "offline";
    }

    const mem = process.memoryUsage();
    const memory = {
      rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
    };

    const overallStatus: "ready" | "degraded" | "unhealthy" =
      dbStatus === "connected" ? (redisStatus === "connected" ? "ready" : "degraded") : "unhealthy";

    const readiness: SystemReadiness = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: this.envService.nodeEnv,
      subsystems: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
          ...(dbError ? { error: dbError } : {}),
        },
        redis: {
          status: redisStatus,
          latencyMs: redisLatency,
        },
        memory,
      },
    };

    if (overallStatus === "unhealthy") {
      throw new ServiceUnavailableException({
        success: false,
        message: "Pacia API unavailable: Core database connection failed.",
        data: readiness,
      });
    }

    return readiness;
  }
}
