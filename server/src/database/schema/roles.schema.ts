import {
  pgTable,
  varchar,
  uuid,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const clientRoleEnum = pgEnum("client_role", [
  "owner",
  "admin",
  "sales_manager",
  "sales_agent",
  "viewer",
]);

export const internalRoleEnum = pgEnum("internal_role", [
  "super_admin",
  "operations",
  "support",
  "technical_admin",
]);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    role: clientRoleEnum("role").notNull(),
    permission: varchar("permission", { length: 100 }).notNull(),
  },
  (table) => [
    uniqueIndex("uq_role_permission").on(table.role, table.permission),
  ]
);

export type ClientRole = (typeof clientRoleEnum.enumValues)[number];
export type InternalRole = (typeof internalRoleEnum.enumValues)[number];
export type RolePermissionRecord = typeof rolePermissions.$inferSelect;
export type NewRolePermissionRecord = typeof rolePermissions.$inferInsert;

/**
 * Standard baseline permissions mapped per client role.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<ClientRole, string[]> = {
  owner: ["*"],
  admin: [
    "workspace:manage",
    "members:manage",
    "leads:read",
    "leads:write",
    "calls:trigger",
    "properties:manage",
    "events:read",
  ],
  sales_manager: [
    "leads:read",
    "leads:write",
    "calls:trigger",
    "properties:read",
    "events:read",
  ],
  sales_agent: [
    "leads:read",
    "leads:write",
    "calls:trigger",
    "properties:read",
  ],
  viewer: [
    "leads:read",
    "properties:read",
  ],
};

/**
 * Maps incoming Clerk organization roles to Pacia ClientRoles.
 * 
 * Safety Rule (Day 2 Adjustment):
 * - Known roles are mapped explicitly.
 * - Missing roles default to 'viewer' (read-only baseline).
 * - Unknown/unrecognized roles throw an error to prevent accidental privilege escalation.
 */
export function mapClerkRoleToClientRole(clerkRole?: string | null): ClientRole {
  if (!clerkRole) {
    // Documented intentional fallback: unassigned roles get read-only viewer access
    return "viewer";
  }

  const normalized = clerkRole.toLowerCase().trim();

  switch (normalized) {
    case "org:admin":
    case "admin":
      return "admin";
    case "org:member":
    case "member":
      return "sales_agent";
    case "owner":
    case "org:owner":
      return "owner";
    case "sales_manager":
    case "org:sales_manager":
      return "sales_manager";
    case "sales_agent":
    case "org:sales_agent":
      return "sales_agent";
    case "viewer":
    case "org:viewer":
      return "viewer";
    default:
      // Reject unknown roles rather than silently granting permissions
      throw new Error(`Unsupported or unrecognized organization role: '${clerkRole}'`);
  }
}
