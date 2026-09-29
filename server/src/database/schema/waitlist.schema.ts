import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const waitlistSubscribers = pgTable(
  "waitlist_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    sequenceNumber: integer("sequence_number").notNull(),
    referralCode: varchar("referral_code", { length: 24 }).notNull().unique(),
    referredBy: varchar("referred_by", { length: 24 }),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: varchar("user_agent", { length: 255 }),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_waitlist_email").on(table.email),
    uniqueIndex("uq_waitlist_referral").on(table.referralCode),
    index("idx_waitlist_sequence").on(table.sequenceNumber),
    index("idx_waitlist_created").on(table.createdAt),
  ]
);

export type WaitlistSubscriberRecord = typeof waitlistSubscribers.$inferSelect;
export type NewWaitlistSubscriberRecord = typeof waitlistSubscribers.$inferInsert;
