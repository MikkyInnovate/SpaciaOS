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

export const systemEventStatusEnum = pgEnum("system_event_status", [
  "emitted",
  "processing",
  "completed",
  "failed",
]);

export const systemEvents = pgTable(
  "system_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    eventName: varchar("event_name", { length: 100 }).notNull(),
    aggregateType: varchar("aggregate_type", { length: 50 }).notNull(),
    aggregateId: varchar("aggregate_id", { length: 64 }).notNull(),
    payload: jsonb("payload").default({}).notNull(),
    status: systemEventStatusEnum("status").notNull().default("emitted"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_system_events_tenant_timeline").on(table.workspaceId, table.createdAt),
    index("idx_system_events_aggregate").on(table.workspaceId, table.aggregateType, table.aggregateId),
  ]
);

export type SystemEventRecord = typeof systemEvents.$inferSelect;
export type NewSystemEventRecord = typeof systemEvents.$inferInsert;
