import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  uuid,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";
import { users } from "./users.schema";

export const agentStatusEnum = pgEnum("agent_status", [
  "active",
  "busy",
  "offline",
]);

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 64 }).references(() => users.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    avatarUrl: text("avatar_url"),
    roleTitle: varchar("role_title", { length: 100 })
      .notNull()
      .default("Sales Executive"),
    status: agentStatusEnum("status").notNull().default("active"),
    maxConcurrentLeads: integer("max_concurrent_leads").notNull().default(50),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_agents_id_workspace").on(table.id, table.workspaceId),
    index("idx_agents_workspace_status").on(table.workspaceId, table.status),
    index("idx_agents_workspace_email").on(table.workspaceId, table.email),
  ]
);

export type AgentRecord = typeof agents.$inferSelect;
export type NewAgentRecord = typeof agents.$inferInsert;
export type AgentStatus = (typeof agentStatusEnum.enumValues)[number];
