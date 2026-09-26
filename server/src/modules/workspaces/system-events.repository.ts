import { Injectable, Inject } from "@nestjs/common";
import { BaseTenantRepository } from "../../common/tenant/base-tenant.repository";
import { systemEvents, SystemEventRecord, NewSystemEventRecord } from "../../database/schema/system-events.schema";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";

/**
 * Tenant-scoped repository for operational system events.
 * 
 * Demonstrates standard mandatory convention:
 * Inherits BaseTenantRepository, strictly scoping all queries, inserts, and deletions
 * by workspaceId.
 */
@Injectable()
export class SystemEventsRepository extends BaseTenantRepository<
  typeof systemEvents,
  SystemEventRecord,
  NewSystemEventRecord
> {
  constructor(@Inject(DRIZZLE_DATABASE) db: DrizzleDb) {
    super(db, systemEvents);
  }
}
