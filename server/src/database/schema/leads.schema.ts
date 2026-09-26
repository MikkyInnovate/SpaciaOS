import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  index,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";
import { properties } from "./properties.schema";
import { agents } from "./agents.schema";

export const leadStatusEnum = pgEnum("lead_status", [
  "New",
  "Contacting",
  "In Conversation",
  "Qualified",
  "Follow-up",
  "Viewing Booked",
  "Human Managed",
  "Nurture",
  "Lost",
]);

export const leadScoreCategoryEnum = pgEnum("lead_score_category", [
  "HOT",
  "WARM",
  "COLD",
]);

export const leadIntentEnum = pgEnum("lead_intent", [
  "Purchase",
  "Rental",
  "Investment",
]);

export const leadManagementModeEnum = pgEnum("lead_management_mode", [
  "ai_autonomous",
  "human_managed",
  "nurture",
  "lost",
]);

export const leadActivityTypeEnum = pgEnum("lead_activity_type", [
  "inbound_capture",
  "ai_voice_call",
  "whatsapp_message",
  "viewing_scheduled",
  "human_note",
  "status_change",
]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id"),
    assignedAgentId: uuid("assigned_agent_id"),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }),
    inboundNotes: text("inbound_notes"),
    locationPreference: varchar("location_preference", { length: 255 }),
    budget: varchar("budget", { length: 100 }),
    score: integer("score").notNull().default(0),
    scoreCategory: leadScoreCategoryEnum("score_category")
      .notNull()
      .default("COLD"),
    status: leadStatusEnum("status").notNull().default("New"),
    intent: leadIntentEnum("intent").notNull().default("Purchase"),
    timeline: varchar("timeline", { length: 100 }),
    source: varchar("source", { length: 100 }).notNull().default("website"),
    nextAction: text("next_action"),
    managementMode: leadManagementModeEnum("management_mode")
      .notNull()
      .default("ai_autonomous"),
    isAiStopped: boolean("is_ai_stopped").notNull().default(false),
    aiStoppedReason: text("ai_stopped_reason"),
    lossReason: varchar("loss_reason", { length: 100 }),
    lossNotes: text("loss_notes"),
    externalId: varchar("external_id", { length: 255 }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_leads_id_workspace").on(table.id, table.workspaceId),
    unique("uq_leads_workspace_external_id").on(
      table.workspaceId,
      table.externalId
    ),
    foreignKey({
      columns: [table.propertyId],
      foreignColumns: [properties.id],
      name: "fk_leads_property",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.assignedAgentId],
      foreignColumns: [agents.id],
      name: "fk_leads_agent",
    }).onDelete("set null"),
    index("idx_leads_workspace_status").on(table.workspaceId, table.status),
    index("idx_leads_workspace_score").on(
      table.workspaceId,
      table.scoreCategory,
      table.score
    ),
    index("idx_leads_workspace_phone").on(table.workspaceId, table.phone),
    index("idx_leads_workspace_email").on(table.workspaceId, table.email),
  ]
);

export const leadEvents = pgTable(
  "lead_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").notNull(),
    type: leadActivityTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    channel: varchar("channel", { length: 50 }),
    actorType: varchar("actor_type", { length: 50 }).notNull().default("system"),
    actorId: varchar("actor_id", { length: 64 }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.leadId, table.workspaceId],
      foreignColumns: [leads.id, leads.workspaceId],
      name: "fk_lead_events_lead_ws",
    }).onDelete("cascade"),
    index("idx_lead_events_lead_time").on(
      table.workspaceId,
      table.leadId,
      table.createdAt
    ),
  ]
);

export const leadScores = pgTable(
  "lead_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").notNull(),
    score: integer("score").notNull(),
    scoreCategory: leadScoreCategoryEnum("score_category").notNull(),
    budgetScore: integer("budget_score").default(0),
    authorityScore: integer("authority_score").default(0),
    needScore: integer("need_score").default(0),
    timelineScore: integer("timeline_score").default(0),
    propertyFitScore: integer("property_fit_score").default(0),
    factors: jsonb("factors").default({}),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.leadId, table.workspaceId],
      foreignColumns: [leads.id, leads.workspaceId],
      name: "fk_lead_scores_lead_ws",
    }).onDelete("cascade"),
    index("idx_lead_scores_lead").on(table.workspaceId, table.leadId),
  ]
);

export type LeadRecord = typeof leads.$inferSelect;
export type NewLeadRecord = typeof leads.$inferInsert;
export type LeadEventRecord = typeof leadEvents.$inferSelect;
export type NewLeadEventRecord = typeof leadEvents.$inferInsert;
export type LeadScoreRecord = typeof leadScores.$inferSelect;
export type NewLeadScoreRecord = typeof leadScores.$inferInsert;
