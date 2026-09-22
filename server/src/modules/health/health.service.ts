import { Injectable, Inject, Logger } from "@nestjs/common";
import { NEON_POOL } from "../../database/database.provider";
import type { Pool } from "@neondatabase/serverless";

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@Inject(NEON_POOL) private readonly pool: Pool) {}

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
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      ...(databaseLatencyMs !== null ? { databaseLatencyMs } : {}),
      ...(databaseDetails ? { databaseDetails } : {}),
    };
  }
}
