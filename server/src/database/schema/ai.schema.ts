import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  uuid,
  jsonb,
  index,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";

export const aiAgents = pgTable(
  "ai_agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    role: varchar("role", { length: 100 }).notNull().default("lead_qualifier"),
    systemPrompt: text("system_prompt"),
    voiceId: varchar("voice_id", { length: 100 }),
    phoneNumber: varchar("phone_number", { length: 50 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_ai_agents_id_workspace").on(table.id, table.workspaceId),
    index("idx_ai_agents_workspace").on(table.workspaceId, table.isActive),
  ]
);

export const aiConfigurations = pgTable(
  "ai_configurations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    aiAgentId: uuid("ai_agent_id").notNull(),
    provider: varchar("provider", { length: 50 }).notNull().default("openai"),
    model: varchar("model", { length: 100 }).notNull().default("gpt-4o"),
    temperature: numeric("temperature", { precision: 3, scale: 2 })
      .notNull()
      .default("0.70"),
    maxTokens: integer("max_tokens").notNull().default(1000),
    qualificationRules: jsonb("qualification_rules").default({}),
    routingRules: jsonb("routing_rules").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_ai_configurations_id_workspace").on(
      table.id,
      table.workspaceId
    ),
    foreignKey({
      columns: [table.aiAgentId, table.workspaceId],
      foreignColumns: [aiAgents.id, aiAgents.workspaceId],
      name: "fk_ai_configurations_agent_ws",
    }).onDelete("cascade"),
    index("idx_ai_configurations_agent").on(
      table.workspaceId,
      table.aiAgentId
    ),
  ]
);

export type AiAgentRecord = typeof aiAgents.$inferSelect;
export type NewAiAgentRecord = typeof aiAgents.$inferInsert;
export type AiConfigurationRecord = typeof aiConfigurations.$inferSelect;
export type NewAiConfigurationRecord = typeof aiConfigurations.$inferInsert;
