import {
  pgTable,
  varchar,
  text,
  integer,
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
import { agents } from "./agents.schema";

export const conversationChannelEnum = pgEnum("conversation_channel", [
  "whatsapp",
  "web_chat",
  "voice_transcript",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "active_ai",
  "awaiting_prospect",
  "qualified",
  "viewing_booked",
  "human_takeover",
  "escalated",
  "closed",
]);

export const messageSenderTypeEnum = pgEnum("message_sender_type", [
  "ai_agent",
  "prospect",
  "human_broker",
  "system",
]);

export const messageDeliveryStatusEnum = pgEnum("message_delivery_status", [
  "sending",
  "sent",
  "delivered",
  "read",
]);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id"),
    propertyId: uuid("property_id"),
    assignedAgentId: uuid("assigned_agent_id"),
    channel: conversationChannelEnum("channel").notNull().default("whatsapp"),
    status: conversationStatusEnum("status").notNull().default("active_ai"),
    prospectName: varchar("prospect_name", { length: 255 }).notNull(),
    prospectPhone: varchar("prospect_phone", { length: 50 }).notNull(),
    prospectEmail: varchar("prospect_email", { length: 255 }),
    unreadCount: integer("unread_count").notNull().default(0),
    lastMessageText: text("last_message_text"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessageSender: messageSenderTypeEnum("last_message_sender"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_conversations_id_workspace").on(table.id, table.workspaceId),
    foreignKey({
      columns: [table.leadId],
      foreignColumns: [leads.id],
      name: "fk_conversations_lead",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.propertyId],
      foreignColumns: [properties.id],
      name: "fk_conversations_property",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.assignedAgentId],
      foreignColumns: [agents.id],
      name: "fk_conversations_agent",
    }).onDelete("set null"),
    index("idx_conversations_workspace_status").on(
      table.workspaceId,
      table.status
    ),
    index("idx_conversations_workspace_channel").on(
      table.workspaceId,
      table.channel
    ),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").notNull(),
    senderType: messageSenderTypeEnum("sender_type").notNull(),
    senderName: varchar("sender_name", { length: 255 }).notNull(),
    content: text("content").notNull(),
    deliveryStatus: messageDeliveryStatusEnum("delivery_status")
      .notNull()
      .default("sent"),
    artifact: jsonb("artifact"),
    aiMetadata: jsonb("ai_metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.conversationId, table.workspaceId],
      foreignColumns: [conversations.id, conversations.workspaceId],
      name: "fk_messages_conversation_ws",
    }).onDelete("cascade"),
    index("idx_messages_conversation_time").on(
      table.workspaceId,
      table.conversationId,
      table.createdAt
    ),
  ]
);

export type ConversationRecord = typeof conversations.$inferSelect;
export type NewConversationRecord = typeof conversations.$inferInsert;
export type MessageRecord = typeof messages.$inferSelect;
export type NewMessageRecord = typeof messages.$inferInsert;
