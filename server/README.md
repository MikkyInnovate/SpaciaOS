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

# Day 4: Core Domain Database Schemas & Migrations

## Objective
Establish the core domain schemas and multi-tenant foreign key relationships in Neon PostgreSQL for the Spacia real-estate AI sales platform. The schema covers the complete operational lifecycle from property listings and inbound prospect management to telephony, AI qualification, broker scheduling, integrations, and in-app alerts.

---

## 19 Domain Tables Implemented & Live

| Category | Table | Description |
| :--- | :--- | :--- |
| **Properties** | `properties` | Luxury property listings, inventory, addresses, pricing, commercial specs, and verification status. |
| | `property_features` | Normalized features/amenities linked to properties (e.g., Waterfront, Private Jetty, Smart Home). |
| **Agents** | `agents` | Sales broker profiles, territory assignments, active quotas, and direct contact numbers. |
| **Leads & Pipeline** | `leads` | Core prospect entity with multi-channel attribution, lifecycle stages, assigned agent, and target property. |
| | `lead_events` | Immutable chronological audit log of all lead touchpoints (inbound forms, calls, brochures, status changes). |
| | `lead_scores` | 0–100 explainable BANT underwriting scores with 5-point breakdowns and positive/negative catalysts. |
| **Conversations** | `conversations` | Multi-channel conversation threads (WhatsApp, SMS, Web Chat) tied to leads and workspaces. |
| | `messages` | Inbound and outbound message records with sender attribution (`prospect`, `ai_agent`, `human_broker`, `system`). |
| **Telephony** | `calls` | Voice telephony session records with provider call ID (Vapi), recording URLs, duration, and outcomes. |
| | `transcripts` | Speaker-turn transcripts with millisecond timestamps, speaker labels, and sentiment indicators. |
| | `call_summaries` | AI-generated executive summaries, buyer intent synthesis, and operational next directives. |
| **Qualification** | `qualification_results` | Structured BANT underwriting evaluations, declared budgets, liquidity verifications, and objection logs. |
| **Scheduling** | `follow_ups` | Scheduled sales broker reminders, priority tiers, and SLA deadline tracking. |
| | `appointments` | In-person property inspection bookings with start/end timestamptz windows and host assignments. |
| **Integrations** | `calendar_connections` | Agent Google Calendar and Microsoft Outlook OAuth synchronization states. |
| | `integrations` | External CRM connectors, webhooks, and Model Context Protocol (MCP) integrations. |
| **AI Sales Fleet** | `ai_agents` | Autonomous AI sales personas, voice engine settings, operating hours, and DNC guardrails. |
| | `ai_configurations` | LLM model hyperparameters, prompt templates, temperature controls, and tool bindings. |
| **Notifications** | `notifications` | In-app operational broker alerts, priority indicators, and read states. |

---

## Key Architectural Safeguards

1. **Composite Foreign Key Multi-Tenant Isolation**:
   - Critical child tables enforce composite foreign keys `(id, workspace_id)` or `(lead_id, workspace_id)` matching the parent's `(id, workspace_id)`.
   - Physically prevents cross-workspace referencing at the PostgreSQL storage engine level, making data leaks structurally impossible.
2. **Lifecycle Deletion Strategy (Cascade vs. Set Null)**:
   - **Retention**: Deleting a property does NOT delete historical leads (`ON DELETE SET NULL` on `leads.property_id`). Deleting a lead retains call audio records for compliance (`ON DELETE SET NULL` on `calls.lead_id`).
   - **Cascading**: Deleting a lead safely purges owned ephemeral child records (`lead_events`, `lead_scores`) via `ON DELETE CASCADE`.
3. **Database Migrations**:
   - Applied cleanly to Neon PostgreSQL via Drizzle migrations:
     - `server/drizzle/0002_stale_talisman.sql`
     - `server/drizzle/0003_orange_texas_twister.sql`

---

## Verification & Automated Test Suite

- **Command**: `npm run test:schema`
- **File**: `server/test/day4-domain-schema.spec.ts`
- **Results**: 11 out of 11 testing phases passed 100% against live Neon PostgreSQL (covering properties, agents, leads, conversations, telephony, qualification, appointments, integrations, composite FK cross-tenant blocks, and cascade rules).

---

# Day 5: Lead Ingestion Engine & Workflow Pipeline

## Objective
Implement an enterprise-grade, concurrency-safe lead ingestion engine (`POST /api/v1/leads/ingest`) that autonomously processes inbound web and marketing inquiries, validates and normalizes payloads, authoritatively resolves the target workspace, enforces database-level idempotency, detects duplicate prospects, logs timeline events, emits durable system events via a transactional outbox, and queues automated qualification workflows.

---

## Ingestion Architecture & Pipeline Stages

```text
Inbound Webhook / Payload
         │
         ▼
[1. Payload Validation & Sanitization] (DTO + class-transformer)
         │
         ▼
[2. Authoritative Workspace Resolution] (Headers > Body precedence)
         │
         ▼
[3. Concurrency-Safe Idempotency Check] (PostgreSQL atomic reservation)
         │
         ├── Completed Key ──> Replay cached response (X-Idempotent-Replay: true)
         ├── In-Progress Key ─> Reject concurrent duplicate (409 Conflict)
         │
         ▼
[4. Field Normalization] (E.164 phone + lowercased email)
         │
         ▼
[5. Tenant-Scoped Deduplication] (Match by external_id, phone, or email)
         │
         ├── Existing Lead ──> Append re-engagement event, update notes & timestamps
         └── New Lead ───────> Insert new lead record in Neon
         │
         ▼
[6. Inbound Capture Event Logging] (lead_events table)
         │
         ▼
[7. Durable Event Outbox Emission] (system_events table: 'NewLead')
         │
         ▼
[8. In-Process Workflow Dispatch] (Non-blocking qualification trigger)
         │
         ▼
Standardized Success Response (HTTP 201 Created)
```

---

## Key Capabilities Built

### 1. Ingestion Endpoint
- **Route**: `POST /api/v1/leads/ingest`
- **Access**: `@Public()` route with optional authenticated tenant context inspection.
- **Authoritative Workspace Resolution Precedence**:
  1. `X-Workspace-Id` (UUID header)
  2. `X-Workspace-Slug` (Slug header)
  3. `body.workspaceSlug`
  4. `body.workspaceId`
- **Security Guardrail**: Authenticated callers are strictly bound to their verified `tenantContext.workspaceId`. Any conflicting header or body identifier is blocked with `403 WORKSPACE_CONTEXT_MISMATCH`.
- **Property Validation**: Validates that any attached `propertyId` exists and belongs strictly to the resolved workspace, rejecting cross-tenant attachments with `400 PROPERTY_NOT_FOUND_IN_WORKSPACE`.

### 2. Payload Validation & Sanitization
- Implemented in `src/modules/leads/dto/lead-ingest.dto.ts`.
- Uses `class-transformer` (`@Transform`) to sanitize raw incoming data before validation:
  - Phone: Cleanses leading/trailing whitespace, dashes, and parentheses.
  - Email: Lowercases and trims input (`  CHIEF@GMAIL.COM  ` $\rightarrow$ `chief@gmail.com`).
  - Budget: Parses strings or numbers into clean numeric values.

### 3. Canonical Phone & Field Normalization
- Implemented in `src/modules/leads/utils/lead-normalizer.utils.ts`.
- Converts local Nigerian telephone formats (`0803...`, `070...`, `090...`) into international E.164 standard (`+234803...`).
- Preserves valid existing international E.164 numbers.

### 4. Concurrency-Safe Database Idempotency
- Managed via the `idempotency_keys` table (`src/database/schema/idempotency.schema.ts`) with a database-level `UNIQUE(workspace_id, key)` constraint and 24-hour expiration TTL.
- Uses atomic reservation:
  ```sql
  INSERT INTO idempotency_keys (workspace_id, key, status, expires_at)
  VALUES ($1, $2, 'pending', now() + interval '24 hours')
  ON CONFLICT (workspace_id, key) DO UPDATE
    SET status = 'pending', expires_at = now() + interval '24 hours'
    WHERE idempotency_keys.expires_at < now()
  RETURNING *;
  ```
- **Replay**: Completed keys immediately return the original cached response with the `X-Idempotent-Replay: true` HTTP response header.
- **Concurrency Locking**: Simultaneous incoming requests with the same key receive `409 Conflict` (`IDEMPOTENCY_CONFLICT`), preventing double insertions during high-concurrency bursts.

### 5. Tenant-Scoped Deduplication & Re-Engagement
- Implemented in `src/modules/leads/services/lead-deduplication.service.ts`.
- Scopes lookup strictly by `workspace_id`.
- Checks matching candidate against:
  1. `external_id` (Client Lead ID)
  2. Normalized E.164 `phone`
  3. Lowercased `email`
- **Re-Engagement Logic**: If a prospect already exists, the engine does NOT create duplicate lead rows. Instead, it:
  - Appends an `inbound_capture` event to the lead's activity timeline (`lead_events`).
  - Updates the lead's inquiry notes and `updated_at` timestamp.
  - Bumps the transaction intent or target property if new details are provided.

### 6. Transactional Outbox & Workflow Queue
- Implemented in `src/modules/leads/services/lead-workflow-queue.service.ts`.
- **Durable Outbox**: Emits a `NewLead` event to the `system_events` table within PostgreSQL, recording `leadId`, `phone`, `propertyId`, and `source`.
- **In-Process Dispatcher**: Dispatches the lead to the autonomous qualification workflow asynchronously without blocking the client's HTTP response.

---

## Verification & Automated Test Suites

### 1. Day 5 Lead Ingestion Test Suite
- **Command**: `npm run test:ingestion`
- **File**: `server/test/day5-lead-ingestion.spec.ts`
- **9 Verification Scenarios Verified Live Against Neon PostgreSQL**:
  1. Standard public ingestion with E.164 phone normalization and transactional outbox emission.
  2. Workspace resolution precedence (`X-Workspace-Slug` > `body.workspaceSlug`).
  3. Rejection of missing (`400`) and non-existent (`404`) workspaces.
  4. Cross-tenant property attachment rejection (`400 PROPERTY_NOT_FOUND_IN_WORKSPACE`).
  5. Idempotent replay caching with `X-Idempotent-Replay: true` header (0 duplicate rows).
  6. Duplicate detection by phone with timeline re-engagement logging (0 duplicate rows).
  7. Client / external lead ID matching.
  8. Concurrent idempotency execution under simulated parallel load (`[201, 409]`).
  9. Authenticated tenant context immutability and mismatch rejection (`403 WORKSPACE_CONTEXT_MISMATCH`).
- **Result**: `ALL DAY 5 LEAD INGESTION TESTS PASSED (100%)`.

### 2. Full Regression Suite Status

| Test Suite | Command | Result |
| :--- | :--- | :---: |
| **Day 5 Ingestion** | `npm run test:ingestion` | **PASS (100%)** |
| **Day 4 Domain Schemas** | `npm run test:schema` | **PASS (100%)** |
| **Day 3 Authorization** | `npm run test:auth` | **PASS (100%)** |
| **Day 2 Tenant Isolation**| `npm run test:isolation` | **PASS (100%)** |
| **HTTP E2E Suite** | `npm run test:e2e` | **PASS (100%)** |
| **TypeScript Typecheck** | `npm run type-check` | **PASS (0 errors)** |
| **Production Build** | `npm run build` | **PASS (Clean build)** |

---

## Git & Repository Status
- All changes strictly isolated to `/server`.
- Frontend code (`src/`) remains untouched.

