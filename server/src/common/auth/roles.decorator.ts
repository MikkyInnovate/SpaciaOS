import { SetMetadata } from "@nestjs/common";
import { ClientRole } from "../../database/schema/roles.schema";

export const ROLES_KEY = "roles";

/**
 * Declares one or more roles allowed to access a route.
 * Evaluated against the verified database membership role (workspace_members.role).
 */
export const RequireRoles = (...roles: ClientRole[]) => SetMetadata(ROLES_KEY, roles);
