import { ClientRole } from "../../database/schema/roles.schema";

/**
 * Verified TenantContext established per authenticated request.
 * 
 * Authoritative source: Clerk JWT session claims.
 * - workspaceId: derived from token `org_id` (must match an existing provisioned workspace).
 * - userId: derived from token `sub`.
 * - role: resolved ClientRole mapped safely from Clerk `org_role`.
 * - permissions: granted permissions derived from DEFAULT_ROLE_PERMISSIONS.
 */
export interface TenantContext {
  workspaceId: string;
  userId: string;
  role: ClientRole;
  permissions: string[];
  orgSlug?: string;
  rawOrgRole?: string | null;
}
