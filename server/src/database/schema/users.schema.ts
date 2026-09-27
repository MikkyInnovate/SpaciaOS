import {
  pgTable,
  varchar,
  text,
  timestamp,
  uuid,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";

export const workspaceRoleEnum = pgEnum("workspace_role", [
  "owner",
  "admin",
  "sales_manager",
  "sales_agent",
]);

export const workspaceMemberStatusEnum = pgEnum("workspace_member_status", [
  "active",
  "invited",
  "pending",
  "suspended",
]);

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(), // Clerk user_id (e.g. user_2aX...)
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("sales_agent"),
    status: varchar("status", { length: 50 }).notNull().default("active"),
    invitedEmail: varchar("invited_email", { length: 255 }),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_workspace_members_member").on(table.workspaceId, table.userId),
    index("idx_workspace_members_workspace").on(table.workspaceId),
    index("idx_workspace_members_user").on(table.userId),
    index("idx_workspace_members_status").on(table.workspaceId, table.status),
  ]
);

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;
export type WorkspaceMemberRecord = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMemberRecord = typeof workspaceMembers.$inferInsert;
export type WorkspaceRole = (typeof workspaceRoleEnum.enumValues)[number];
export type WorkspaceMemberStatus = "active" | "invited" | "pending" | "suspended";
