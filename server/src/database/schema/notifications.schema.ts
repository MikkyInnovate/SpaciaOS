import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  uuid,
  jsonb,
  index,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";
import { users } from "./users.schema";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 64 }).references(() => users.id, {
      onDelete: "cascade",
    }),
    type: varchar("type", { length: 50 }).notNull(), // 'lead_qualified' | 'viewing_booked' | 'escalation' | 'call_completed'
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    entityType: varchar("entity_type", { length: 50 }), // 'lead' | 'call' | 'appointment'
    entityId: uuid("entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_notifications_id_workspace").on(table.id, table.workspaceId),
    index("idx_notifications_user_read").on(
      table.workspaceId,
      table.userId,
      table.isRead
    ),
  ]
);

export type NotificationRecord = typeof notifications.$inferSelect;
export type NewNotificationRecord = typeof notifications.$inferInsert;
