import { pgTable, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const workspaceTierEnum = pgEnum("workspace_tier", [
  "starter",
  "growth",
  "enterprise",
]);

export const workspaces = pgTable("workspaces", {
  id: varchar("id", { length: 64 }).primaryKey(), // Clerk org_id (e.g. org_2bg...)
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  tier: workspaceTierEnum("tier").notNull().default("starter"),
  primaryMarket: varchar("primary_market", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WorkspaceRecord = typeof workspaces.$inferSelect;
export type NewWorkspaceRecord = typeof workspaces.$inferInsert;
export type WorkspaceTier = (typeof workspaceTierEnum.enumValues)[number];
