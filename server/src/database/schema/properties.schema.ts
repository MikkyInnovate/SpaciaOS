import {
  pgTable,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  index,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";

export const propertyAvailabilityEnum = pgEnum("property_availability", [
  "Available",
  "Under Offer",
  "Sold",
  "Reserved",
  "Unavailable",
]);

export const propertyVerificationStatusEnum = pgEnum(
  "property_verification_status",
  ["Verified", "Pending Verification", "Unverified"]
);

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    estateName: varchar("estate_name", { length: 255 }),
    location: varchar("location", { length: 255 }).notNull(),
    city: varchar("city", { length: 100 }).notNull().default("Lagos"),
    state: varchar("state", { length: 100 }).notNull().default("Lagos State"),
    propertyType: varchar("property_type", { length: 100 }).notNull(),
    price: numeric("price", { precision: 15, scale: 2 }).notNull(),
    formattedPrice: varchar("formatted_price", { length: 50 }).notNull(),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    squareMeters: integer("square_meters"),
    parkingSpaces: integer("parking_spaces"),
    developmentStage: varchar("development_stage", { length: 100 }),
    availability: propertyAvailabilityEnum("availability")
      .notNull()
      .default("Available"),
    verificationStatus: propertyVerificationStatusEnum("verification_status")
      .notNull()
      .default("Pending Verification"),
    titleDeedType: varchar("title_deed_type", { length: 150 }),
    registryNumber: varchar("registry_number", { length: 100 }),
    featuredImage: text("featured_image"),
    images: jsonb("images").$type<string[]>().default([]).notNull(),
    description: text("description"),
    developerOrOwner: varchar("developer_or_owner", { length: 255 }),
    commercialTerms: jsonb("commercial_terms").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_properties_id_workspace").on(table.id, table.workspaceId),
    unique("uq_properties_slug_workspace").on(table.workspaceId, table.slug),
    index("idx_properties_workspace_status").on(
      table.workspaceId,
      table.availability
    ),
    index("idx_properties_workspace_price").on(table.workspaceId, table.price),
  ]
);

export const propertyFeatures = pgTable(
  "property_features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 64 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").notNull(),
    feature: varchar("feature", { length: 150 }).notNull(),
    category: varchar("category", { length: 50 }).default("amenity"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.propertyId, table.workspaceId],
      foreignColumns: [properties.id, properties.workspaceId],
      name: "fk_property_features_property_ws",
    }).onDelete("cascade"),
    index("idx_property_features_property").on(
      table.workspaceId,
      table.propertyId
    ),
  ]
);

export type PropertyRecord = typeof properties.$inferSelect;
export type NewPropertyRecord = typeof properties.$inferInsert;
export type PropertyFeatureRecord = typeof propertyFeatures.$inferSelect;
export type NewPropertyFeatureRecord = typeof propertyFeatures.$inferInsert;
