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
  foreignKey,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";
import { leads } from "./leads.schema";
import { calls } from "./calls.schema";

export const buyerIntentCategoryEnum = pgEnum("buyer_intent_category", [
  "high_purchase_intent",
  "investment_yield_seeking",
  "luxury_relocation",
  "exploratory",
  "unqualified",
]);

export const decisionReadinessStageEnum = pgEnum("decision_readiness_stage", [
  "immediate_close",
  "evaluating_shortlist",
  "spousal_board_review",
  "asset_liquidation",
  "exploratory",
]);

export const qualificationResults = pgTable(
  "qualification_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").notNull(),
    callId: uuid("call_id"),
    confidenceScore: integer("confidence_score").notNull(),
    buyerIntent: buyerIntentCategoryEnum("buyer_intent").notNull(),
    decisionReadiness: decisionReadinessStageEnum("decision_readiness").notNull(),
    motivation: text("motivation"),
    timelineWindow: varchar("timeline_window", { length: 100 }),
    timelineUrgency: varchar("timeline_urgency", { length: 50 }).default(
      "near_term"
    ),
    budgetDeclared: varchar("budget_declared", { length: 100 }),
    budgetVerifiedLiquidity: varchar("budget_verified_liquidity", { length: 100 }),
    paymentStructure: varchar("payment_structure", { length: 50 }).default(
      "Outright"
    ),
    budgetStretchCategory: varchar("budget_stretch_category", { length: 50 }),
    objections: jsonb("objections").default([]).notNull(),
    intentSignals: jsonb("intent_signals").default([]).notNull(),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.leadId, table.workspaceId],
      foreignColumns: [leads.id, leads.workspaceId],
      name: "fk_qualifications_lead_ws",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.callId],
      foreignColumns: [calls.id],
      name: "fk_qualifications_call",
    }).onDelete("set null"),
    index("idx_qualifications_lead").on(table.workspaceId, table.leadId),
    index("idx_qualifications_intent").on(
      table.workspaceId,
      table.buyerIntent
    ),
  ]
);

export type QualificationResultRecord = typeof qualificationResults.$inferSelect;
export type NewQualificationResultRecord = typeof qualificationResults.$inferInsert;
