import {
  Injectable,
  Inject,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { eq, and, sql } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import {
  idempotencyKeys,
  IdempotencyKeyRecord,
} from "../../../database/schema/idempotency.schema";

export type IdempotencyReservationResult =
  | { isNew: true }
  | {
      isNew: false;
      isCompleted: true;
      statusCode: number;
      responseBody: any;
    };

@Injectable()
export class LeadIdempotencyService {
  private readonly logger = new Logger(LeadIdempotencyService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb) {}

  /**
   * Concurrency-safe atomic key reservation utilizing PostgreSQL UNIQUE(workspace_id, key).
   * Safe against race conditions and self-recovering from stuck pending reservations via expires_at.
   */
  async reserveKey(
    workspaceId: string,
    key: string,
    ttlSeconds: number = 86400 // 24 hours
  ): Promise<IdempotencyReservationResult> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // Atomic insert with recovery for expired/failed reservations
    const reserved = await this.db
      .insert(idempotencyKeys)
      .values({
        workspaceId,
        key,
        status: "pending",
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [idempotencyKeys.workspaceId, idempotencyKeys.key],
        set: {
          status: "pending",
          expiresAt,
          updatedAt: new Date(),
        },
        where: sql`${idempotencyKeys.expiresAt} < now() OR ${idempotencyKeys.status} = 'failed'`,
      })
      .returning();

    if (reserved.length > 0) {
      return { isNew: true };
    }

    // A conflict occurred on an active, non-expired key
    const existing = await this.db
      .select()
      .from(idempotencyKeys)
      .where(
        and(
          eq(idempotencyKeys.workspaceId, workspaceId),
          eq(idempotencyKeys.key, key)
        )
      )
      .limit(1);

    const record: IdempotencyKeyRecord | undefined = existing[0];

    if (!record) {
      // Extremely rare edge case: retry reservation
      return { isNew: true };
    }

    if (record.status === "completed") {
      this.logger.log(
        `Replaying cached idempotent response for key: ${key} (workspace: ${workspaceId})`
      );
      return {
        isNew: false,
        isCompleted: true,
        statusCode: record.statusCode ?? 200,
        responseBody: record.responseBody,
      };
    }

    // Key is currently in-flight (pending)
    this.logger.warn(
      `Concurrent request in progress for key: ${key} (workspace: ${workspaceId})`
    );
    throw new ConflictException({
      code: "CONCURRENT_REQUEST_IN_PROGRESS",
      message: `A request with idempotency key '${key}' is currently in progress. Please wait before retrying.`,
    });
  }

  /**
   * Finalizes the idempotency record with the HTTP status code and response payload.
   */
  async completeReservation(
    workspaceId: string,
    key: string,
    statusCode: number,
    responseBody: any,
    executor?: any
  ): Promise<void> {
    const dbContext = executor || this.db;
    await dbContext
      .update(idempotencyKeys)
      .set({
        status: "completed",
        statusCode,
        responseBody,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(idempotencyKeys.workspaceId, workspaceId),
          eq(idempotencyKeys.key, key)
        )
      );
  }

  /**
   * Marks a failed reservation so future attempts can be retried.
   */
  async failReservation(
    workspaceId: string,
    key: string,
    executor?: any
  ): Promise<void> {
    const dbContext = executor || this.db;
    await dbContext
      .update(idempotencyKeys)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(idempotencyKeys.workspaceId, workspaceId),
          eq(idempotencyKeys.key, key)
        )
      );
  }
}
