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
import { leads } from "./leads.schema";
import { properties } from "./properties.schema";

export const callOutcomeEnum = pgEnum("call_outcome", [
  "viewing_booked",
  "qualified",
  "callback_requested",
  "nurture",
  "voicemail",
  "escalated_takeover",
]);

export const callRecordingStateEnum = pgEnum("call_recording_state", [
  "ready",
  "processing",
  "live",
  "failed",
  "no_audio",
]);

export type CallOutcome = (typeof callOutcomeEnum.enumValues)[number];
export type CallRecordingState = (typeof callRecordingStateEnum.enumValues)[number];

export const calls = pgTable(
  "calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id"),
    propertyId: uuid("property_id"),
    leadName: varchar("lead_name", { length: 255 }).notNull(),
    leadPhone: varchar("lead_phone", { length: 50 }).notNull(),
    outcome: callOutcomeEnum("outcome"),
    recordingState: callRecordingStateEnum("recording_state")
      .notNull()
      .default("ready"),
    recordingUrl: text("recording_url"),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    callScore: integer("call_score"),
    isEscalated: boolean("is_escalated").notNull().default(false),
    isLive: boolean("is_live").notNull().default(false),
    agentPersona: varchar("agent_persona", { length: 100 }),
    metrics: jsonb("metrics").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_calls_id_workspace").on(table.id, table.workspaceId),
    foreignKey({
      columns: [table.leadId],
      foreignColumns: [leads.id],
      name: "fk_calls_lead",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.propertyId],
      foreignColumns: [properties.id],
      name: "fk_calls_property",
    }).onDelete("set null"),
    index("idx_calls_workspace_outcome").on(table.workspaceId, table.outcome),
    index("idx_calls_workspace_created").on(table.workspaceId, table.createdAt),
  ]
);

export const transcripts = pgTable(
  "transcripts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    callId: uuid("call_id").notNull(),
    turns: jsonb("turns").default([]).notNull(),
    fullText: text("full_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_transcripts_call_workspace").on(table.callId, table.workspaceId),
    foreignKey({
      columns: [table.callId, table.workspaceId],
      foreignColumns: [calls.id, calls.workspaceId],
      name: "fk_transcripts_call_ws",
    }).onDelete("cascade"),
  ]
);

export const callSummaries = pgTable(
  "call_summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    callId: uuid("call_id").notNull(),
    synthesis: text("synthesis").notNull(),
    keyTakeaways: jsonb("key_takeaways").$type<string[]>().default([]).notNull(),
    objectionsRaised: jsonb("objections_raised").$type<string[]>().default([]).notNull(),
    actionItems: jsonb("action_items").$type<string[]>().default([]).notNull(),
    suggestedNextStep: text("suggested_next_step"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_call_summaries_call_workspace").on(table.callId, table.workspaceId),
    foreignKey({
      columns: [table.callId, table.workspaceId],
      foreignColumns: [calls.id, calls.workspaceId],
      name: "fk_call_summaries_call_ws",
    }).onDelete("cascade"),
  ]
);

export type CallRecord = typeof calls.$inferSelect;
export type NewCallRecord = typeof calls.$inferInsert;
export type TranscriptRecord = typeof transcripts.$inferSelect;
export type NewTranscriptRecord = typeof transcripts.$inferInsert;
export type CallSummaryRecord = typeof callSummaries.$inferSelect;
export type NewCallSummaryRecord = typeof callSummaries.$inferInsert;
