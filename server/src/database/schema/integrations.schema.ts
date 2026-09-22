import {
  pgTable,
  varchar,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";
import { agents } from "./agents.schema";

export const calendarConnections = pgTable(
  "calendar_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id"),
    provider: varchar("provider", { length: 50 }).notNull(), // 'google' | 'outlook' | 'caldav'
    status: varchar("status", { length: 50 }).notNull().default("connected"), // 'connected' | 'disconnected' | 'error'
    calendarId: varchar("calendar_id", { length: 255 }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_calendar_connections_id_workspace").on(
      table.id,
      table.workspaceId
    ),
    foreignKey({
      columns: [table.agentId],
      foreignColumns: [agents.id],
      name: "fk_calendar_connections_agent",
    }).onDelete("set null"),
    index("idx_calendar_connections_workspace").on(table.workspaceId),
  ]
);

export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // 'mcp' | 'whatsapp' | 'termii' | 'webhook' | 'crm'
    name: varchar("name", { length: 150 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("active"), // 'active' | 'inactive' | 'error'
    config: jsonb("config").default({}),
    credentials: jsonb("credentials").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_integrations_id_workspace").on(table.id, table.workspaceId),
    index("idx_integrations_workspace_type").on(
      table.workspaceId,
      table.type
    ),
  ]
);

export type CalendarConnectionRecord = typeof calendarConnections.$inferSelect;
export type NewCalendarConnectionRecord = typeof calendarConnections.$inferInsert;
export type IntegrationRecord = typeof integrations.$inferSelect;
export type NewIntegrationRecord = typeof integrations.$inferInsert;
