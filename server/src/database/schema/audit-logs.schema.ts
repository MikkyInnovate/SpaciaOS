import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";

export const auditActorTypeEnum = pgEnum("audit_actor_type", [
  "user",
  "system",
  "api_key",
  "ai_agent",
]);

export const auditSeverityEnum = pgEnum("audit_severity", [
  "info",
  "warning",
  "critical",
]);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Compliance & Retention protection: audit logs must not be blindly cascaded on workspace deletion
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    actorId: varchar("actor_id", { length: 64 }).notNull(),
    actorType: auditActorTypeEnum("actor_type").notNull().default("user"),
    severity: auditSeverityEnum("severity").notNull().default("info"),
    action: varchar("action", { length: 100 }).notNull(),
    resource: varchar("resource", { length: 100 }).notNull(),
    metadata: jsonb("metadata").default({}),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_audit_logs_workspace").on(table.workspaceId, table.createdAt),
  ]
);

export type AuditLogRecord = typeof auditLogs.$inferSelect;
export type NewAuditLogRecord = typeof auditLogs.$inferInsert;
