import {
  pgTable,
  varchar,
  integer,
  timestamp,
  uuid,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // 'pending' | 'completed' | 'failed'
    statusCode: integer("status_code"),
    responseBody: jsonb("response_body"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_idempotency_keys_workspace_key").on(
      table.workspaceId,
      table.key
    ),
    index("idx_idempotency_keys_expires").on(table.expiresAt),
    index("idx_idempotency_keys_workspace_status").on(
      table.workspaceId,
      table.status
    ),
  ]
);

export type IdempotencyKeyRecord = typeof idempotencyKeys.$inferSelect;
export type NewIdempotencyKeyRecord = typeof idempotencyKeys.$inferInsert;
