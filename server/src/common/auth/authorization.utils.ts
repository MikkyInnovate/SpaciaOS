import { ForbiddenException } from "@nestjs/common";
import { ClientRole, DEFAULT_ROLE_PERMISSIONS } from "../../database/schema/roles.schema";

/**
 * Checks whether a given Pacia application role has the required permission.
 * Wildcard '*' grants all permissions.
 */
export function hasPermission(role: ClientRole, requiredPermission: string): boolean {
  if (!role) {
    return false;
  }

  const permissions = DEFAULT_ROLE_PERMISSIONS[role];
  if (!permissions) {
    return false;
  }

  if (permissions.includes("*")) {
    return true;
  }

  return permissions.includes(requiredPermission);
}

/**
 * Checks whether a user's role matches any of the allowed roles.
 */
export function hasRole(userRole: ClientRole, allowedRoles: ClientRole[]): boolean {
  if (!userRole || !allowedRoles || allowedRoles.length === 0) {
    return false;
  }

  return allowedRoles.includes(userRole);
}

/**
 * Asserts that a role has the required permission, throwing 403 Forbidden if denied.
 */
export function assertPermission(role: ClientRole, requiredPermission: string): void {
  if (!hasPermission(role, requiredPermission)) {
    throw new ForbiddenException({
      code: "FORBIDDEN",
      message: `Role '${role}' lacks required permission '${requiredPermission}'.`,
    });
  }
}

/**
 * Asserts that a user has one of the allowed roles, throwing 403 Forbidden if denied.
 */
export function assertRole(userRole: ClientRole, allowedRoles: ClientRole[]): void {
  if (!hasRole(userRole, allowedRoles)) {
    throw new ForbiddenException({
      code: "FORBIDDEN",
      message: `Role '${userRole}' is not authorized. Allowed roles: ${allowedRoles.join(", ")}.`,
    });
  }
}
