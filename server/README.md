# Pacia Server: Backend Architecture & Implementation Documentation

This document records the foundational architecture, conventions, security policies, and verification results for the Pacia backend modular monolith located in `/server`.

---

# Day 1: Backend Architecture Foundation

## Objective
Establish an enterprise-grade modular monolith architecture for Pacia using NestJS and TypeScript, connected to Neon PostgreSQL via Drizzle ORM, with automated type-safe SQL migrations, global payload validation, a standardized API response and error envelope, and structured HTTP logging.

## Summary of Completed Work
1. **Modular Monolith in `/server`**: Isolated NestJS 11 application with Express adapter running on port `8000`. Global route prefix frozen at `/api/v1`.
2. **Environment Management**: Strongly typed configuration via Zod (`src/config/env.schema.ts`) and NestJS `ConfigModule`.
3. **Database Layer**: Neon PostgreSQL connection pool using `@neondatabase/serverless` and WebSocket transport (`ws`), managed via Drizzle ORM (`DRIZZLE_DATABASE` provider token).
4. **Validation & Envelopes**:
   - Standard success envelope (`TransformInterceptor`): `{ success: true, message, data, timestamp }`.
   - Standard error envelope (`HttpExceptionFilter`): `{ success: false, error: { code, message, details? }, timestamp, path }`.
   - Global `ValidationPipe` rejecting non-whitelisted properties (`whitelist: true`, `forbidNonWhitelisted: true`).
5. **Observability**: `LoggingInterceptor` logging method, path, HTTP status, client IP, and response latency.
6. **Health Probe**: `GET /api/v1/health` verifying application and Neon database connectivity.

---

# Day 2: Clerk-Native Multi-Tenant Architecture & Data Layer

## Objective
Establish a secure, Clerk-native multi-tenant architecture and tenant-scoped data access layer for Pacia. Tenant identity is derived authoritatively from verified Clerk session tokens (`org_id`), enforced via automated guards, mapped through a safe role hierarchy, and managed via `BaseTenantRepository<T>`.

## Summary of Completed Work
1. **Clerk Token Verification**: `ClerkService` verifying incoming JWT sessions via `@clerk/backend`.
2. **ClerkAuthGuard**: Enforcing active organization context (`org_id`), rejecting missing orgs with `403 NO_ACTIVE_WORKSPACE`, and optional `X-Workspace-Id` consistency validation (`WORKSPACE_MISMATCH`).
3. **BaseTenantRepository<T>**: Standard mandatory repository convention for all tenant-owned domain data, injecting `where: eq(table.workspaceId, workspaceId)` on all operations.
4. **Cascade Deletion vs Retention Policy**:
   - Operational data (`system_events`) uses `ON DELETE CASCADE`.
   - Compliance records (`audit_logs`) use `ON DELETE RESTRICT`.
5. **Automated Verification**: `npm run test:isolation` and `npm run test:e2e` passing 100% against live Neon PostgreSQL.

---

# Day 3: Server-Side Authorization & Database Membership Validation

## Objective
Establish strict, server-side authorization where permissions and access are governed authoritatively by the database membership in Neon PostgreSQL, executing the full chain:

$$\text{Clerk JWT} \longrightarrow \text{Backend verification} \longrightarrow \text{Active Clerk org} \longrightarrow \text{Neon workspace} \longrightarrow \text{DB membership} \longrightarrow \text{Pacia role} \longrightarrow \text{Permission} \longrightarrow \text{Authorized response}$$

---

## Architectural Principles & Strict Separation of Concerns

### 1. Auth $\neq$ Membership $\neq$ Provisioning
* **Clerk Authentication**: Authenticates user identity (`sub`) and requested organization context (`org_id`).
* **Neon Database Membership**: Checks whether the authenticated user has an explicit record in the `workspace_members` table for the active `workspaceId`.
  * **Strict Rejection**: If no record exists in `workspace_members`, the request is rejected with `403 Forbidden` (`code: "WORKSPACE_MEMBERSHIP_REQUIRED"`).
  * **No Implicit JIT Auto-Provisioning**: Normal authenticated requests **never** silently create users, workspaces, or memberships to authorize calls.
* **Separation of Roles**:
  * Clerk organization roles establish organization context within Clerk.
  * **Neon `workspace_members.role`** is the **sole authoritative source** for the user's Pacia application role (`owner`, `admin`, `sales_manager`, `sales_agent`).
  * Claims from Clerk are not blindly trusted to grant elevated Pacia application roles.

### 2. Pacia Application Roles & Permissions Model

| Pacia Role (`workspace_members.role`) | Permitted Actions | Description |
| :--- | :--- | :--- |
| **`owner`** | `*` (All permissions, workspace management, billing, team administration) | Agency Owner |
| **`admin`** | `workspace:manage`, `members:manage`, `leads:read`, `leads:write`, `calls:trigger`, `properties:manage`, `events:read` | Operations / Team Admin |
| **`sales_manager`**| `leads:read`, `leads:write`, `calls:trigger`, `properties:read`, `events:read` | Sales Team Manager |
| **`sales_agent`**  | `leads:read`, `leads:write`, `calls:trigger`, `properties:read` | Individual Broker / Agent |

* Unknown/invalid roles are rejected and never receive elevated access.

### 3. Reusable Authorization Utilities
Implemented in `src/common/auth/authorization.utils.ts`:
* `hasPermission(role: ClientRole, requiredPermission: string): boolean`
* `hasRole(userRole: ClientRole, allowedRoles: ClientRole[]): boolean`
* `assertPermission(role: ClientRole, requiredPermission: string): void` (throws `403 FORBIDDEN` if denied)
* `assertRole(userRole: ClientRole, allowedRoles: ClientRole[]): void` (throws `403 FORBIDDEN` if denied)
* `@RequireRoles(...roles: ClientRole[])` decorator to declare role-based access rules on route handlers.

### 4. Dedicated Provisioning & Sync Specification (`POST /api/v1/auth/sync`)
Treated as a standalone, explicit provisioning concern completely separated from the authentication guard:
* **Access Control**: Callable by authenticated users during explicit onboarding.
* **Role Safety**: Only organization administrators in Clerk can initialize a new workspace as `owner`. Joining an existing workspace defaults to `sales_agent` (or `admin` if designated).
* **Idempotency**: Implements database upserts (`onConflictDoUpdate`) to prevent duplicate records or race conditions.
* **Bypass Decorator**: Uses `@SkipMembershipCheck()` so un-onboarded users can hit this endpoint before their membership row exists.

---

## APIs & Endpoints

All endpoints are prefixed with `/api/v1`.

| Endpoint | Method | Access / Guard | Required Permission / Role | Description |
| :--- | :---: | :---: | :---: | :--- |
| `/health` | `GET` | `@Public()` | None | Liveness & database connectivity probe. |
| `/health/test-validation` | `POST` | `@Public()` | None | Global validation pipeline check. |
| `/auth/me` | `GET` | `ClerkAuthGuard`, `WorkspaceMemberGuard` | Active DB membership | Returns verified Clerk identity, DB workspace membership, Pacia application role, and permissions. |
| `/auth/sync` | `POST` | `ClerkAuthGuard`, `@SkipMembershipCheck()` | Valid Clerk token | Dedicated onboarding endpoint to provision or sync user and workspace in Neon. |
| `/workspaces/current` | `GET` | `ClerkAuthGuard`, `WorkspaceMemberGuard` | Active DB membership | Resolves current workspace and verified DB membership. |
| `/workspaces/system-events` | `GET` | `ClerkAuthGuard`, `WorkspaceMemberGuard` | `events:read` | Returns operational system events (owner, admin, sales_manager). |
| `/workspaces/system-events` | `POST` | `ClerkAuthGuard`, `WorkspaceMemberGuard` | Active DB membership | Emits an operational event strictly bound to the active tenant. |

---

## Verification & Automated Test Suites

### 1. Day 3 Server-Side Authorization Test Suite
- **Command**: `npm run test:auth`
- **File**: `server/test/day3-authorization.spec.ts`
- **12 Scenarios Verified Live Against Neon PostgreSQL**:
  1. Authenticated user + valid DB membership $\longrightarrow$ Authorized (`200 OK`).
  2. Authenticated user + no DB membership $\longrightarrow$ Blocked with `403 FORBIDDEN` (`WORKSPACE_MEMBERSHIP_REQUIRED`).
  3. User belonging to Workspace A cannot access Workspace B (`403 FORBIDDEN`).
  4. Owner permissions verified with wildcard `*` access.
  5. Admin permissions verified with `events:read` and `workspace:manage`.
  6. Sales Manager permissions verified with `events:read`.
  7. Sales Agent permissions verified with `leads:read`, and blocked from `events:read` (`403 FORBIDDEN`).
  8. Authorization utilities verified: `hasPermission`, `hasRole`, `assertPermission`, `assertRole`.
  9. Unknown/invalid role verified to receive zero elevated access.
  10. `/auth/me` returns complete verified DB-backed identity structure.
  11. Explicit provisioning (`POST /auth/sync`) successfully provisions workspace and owner membership.
  12. Day 1 public health check & Day 2 tenant event scoping regression checks verified.
- **Result**: `ALL DAY 3 AUTHORIZATION TESTS PASSED (100%)`.

### 2. Day 2 Tenant Isolation Test Suite
- **Command**: `npm run test:isolation`
- **Result**: `ALL TENANT ISOLATION & RETENTION TESTS PASSED (100%)`.

### 3. HTTP API & Tenant Guard E2E Suite
- **Command**: `npm run test:e2e`
- **Result**: `ALL HTTP API & TENANT GUARD E2E TESTS PASSED (100%)`.

### 4. Build & Type Safety
- **Type check**: `npm run type-check` (`tsc --noEmit`) $\longrightarrow$ Clean exit code 0.
- **Production Build**: `npm run build` (`nest build`) $\longrightarrow$ Clean compilation to `/server/dist`.

---

## Git & Repository Status
- All code is strictly confined to `/server`.
- The frontend Next.js application (`src/`) has not been modified.
- **All changes remain uncommitted** pending user instruction.
