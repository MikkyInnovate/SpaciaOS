import {
  pgTable,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  uuid,
  pgEnum,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";
import { leads } from "./leads.schema";
import { properties } from "./properties.schema";
import { agents } from "./agents.schema";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointmentTypeEnum = pgEnum("appointment_type", [
  "property_viewing",
  "virtual_tour",
  "contract_signing",
  "followup_meeting",
]);

export const followUpChannelEnum = pgEnum("follow_up_channel", [
  "call",
  "whatsapp",
  "email",
]);

export const followUpCadenceEnum = pgEnum("follow_up_cadence", [
  "once",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
]);

export const followUpStatusEnum = pgEnum("follow_up_status", [
  "pending",
  "completed",
  "cancelled",
]);

export const priorityLevelEnum = pgEnum("priority_level", [
  "immediate",
  "scheduled",
  "routine",
]);

export type FollowUpChannel = (typeof followUpChannelEnum.enumValues)[number];
export type FollowUpCadence = (typeof followUpCadenceEnum.enumValues)[number];
export type FollowUpStatus = (typeof followUpStatusEnum.enumValues)[number];
export type PriorityLevel = (typeof priorityLevelEnum.enumValues)[number];

export const followUps = pgTable(
  "follow_ups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    channel: followUpChannelEnum("channel").notNull().default("call"),
    cadence: followUpCadenceEnum("cadence").notNull().default("once"),
    status: followUpStatusEnum("status").notNull().default("pending"),
    priority: priorityLevelEnum("priority").notNull().default("scheduled"),
    directive: text("directive"),
    notes: text("notes"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    metadata: jsonb("metadata").default({}),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.leadId, table.workspaceId],
      foreignColumns: [leads.id, leads.workspaceId],
      name: "fk_follow_ups_lead_ws",
    }).onDelete("cascade"),
    index("idx_follow_ups_workspace_time").on(
      table.workspaceId,
      table.scheduledAt
    ),
    index("idx_follow_ups_workspace_status").on(
      table.workspaceId,
      table.status
    ),
  ]
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id"),
    propertyId: uuid("property_id"),
    assignedAgentId: uuid("assigned_agent_id"),
    title: varchar("title", { length: 255 }).notNull(),
    type: appointmentTypeEnum("type").notNull().default("property_viewing"),
    status: appointmentStatusEnum("status").notNull().default("scheduled"),
    scheduledStartAt: timestamp("scheduled_start_at", {
      withTimezone: true,
    }).notNull(),
    scheduledEndAt: timestamp("scheduled_end_at", {
      withTimezone: true,
    }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    meetingUrl: text("meeting_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.leadId],
      foreignColumns: [leads.id],
      name: "fk_appointments_lead",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.propertyId],
      foreignColumns: [properties.id],
      name: "fk_appointments_property",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.assignedAgentId],
      foreignColumns: [agents.id],
      name: "fk_appointments_agent",
    }).onDelete("set null"),
    index("idx_appointments_workspace_time").on(
      table.workspaceId,
      table.scheduledStartAt
    ),
    index("idx_appointments_workspace_status").on(
      table.workspaceId,
      table.status
    ),
  ]
);

export type FollowUpRecord = typeof followUps.$inferSelect;
export type NewFollowUpRecord = typeof followUps.$inferInsert;
export type AppointmentRecord = typeof appointments.$inferSelect;
export type NewAppointmentRecord = typeof appointments.$inferInsert;
