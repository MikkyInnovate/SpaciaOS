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
| **Day 7 Property Adapter** | `npm run test:properties` | **PASS (100%)** |
| **Day 6 Leads API** | `npm run test:leads` | **PASS (100%)** |
| **Day 5 Ingestion** | `npm run test:ingestion` | **PASS (100%)** |
| **Day 4 Domain Schemas** | `npm run test:schema` | **PASS (100%)** |
| **Day 3 Authorization** | `npm run test:auth` | **PASS (100%)** |
| **Day 2 Tenant Isolation**| `npm run test:isolation` | **PASS (100%)** |
| **HTTP E2E Suite** | `npm run test:e2e` | **PASS (100%)** |
| **TypeScript Typecheck** | `npm run type-check` | **PASS (0 errors)** |

---

# Day 6: Lead Management & Lifecycle APIs

## Objective
Implement production-grade, tenant-scoped Lead Query and Lifecycle APIs (`/api/v1/leads`) in the backend modular monolith, providing search filtering, domain status filtering, score category filtering, pagination, deep dossier hydration, status updates with immutable audit logging (`lead_events`), and lead activity timeline creation, backed by pure DTO mappers to insulate the frontend UI from internal database table structures.

---

## APIs & Endpoints Implemented

All endpoints are prefixed with `/api/v1/leads` and enforce active workspace tenancy via `ClerkAuthGuard`, `WorkspaceMemberGuard`, and `PermissionsGuard`.

| Endpoint | Method | Required Permission | Description |
| :--- | :---: | :---: | :--- |
| `/leads` | `GET` | `leads:read` | Returns paginated list of leads for the active workspace (`search`, `status`, `scoreCategory`, `managementMode`, `page`, `limit`). |
| `/leads/:id` | `GET` | `leads:read` | Returns comprehensive lead dossier hydration (property, assigned broker, score breakdown, qualification, activities). |
| `/leads/:id/status` | `PATCH` | `leads:write` | Validated status transition (`New`, `Contacting`, `In Conversation`, `Qualified`, `Follow-up`, `Viewing Booked`, `Human Managed`, `Nurture`, `Lost`), updates management mode, and writes immutable `status_change` audit event into `lead_events`. |
| `/leads/:id/activities` | `POST` | `leads:write` | Creates a new timeline event (`inbound_capture`, `ai_voice_call`, `whatsapp_message`, `viewing_scheduled`, `human_note`, `status_change`) attributed to the authenticated broker. |
| `/leads/:id/activities` | `GET` | `leads:read` | Returns paginated chronological activity timeline stream for a lead. |

---

## Architectural Safeguards & DTO Insulation

1. **Strict DTO Boundary (`lead.mapper.ts`)**:
   - Internal relational database rows (`leads`, `properties`, `agents`, `lead_scores`, `qualifications`, `lead_events`) are mapped into clean domain DTOs (`LeadSummaryDto`, `LeadDetailDto`, `LeadActivityDto`).
   - Zero internal database artifacts (raw table names, database foreign keys, snake_case table columns) leak to the frontend.
2. **PostgreSQL Tenant Isolation**:
   - All queries enforce `where: eq(leads.workspaceId, tenant.workspaceId)`.
   - Cross-workspace queries and mutations return `404 LEAD_NOT_FOUND`, preventing data discovery across tenants.
3. **Automated Audit Logging**:
   - Any status transition writes an immutable event into `lead_events` with previous status, new status, transition reason, and broker attribution.
   - Transitioning to `Human Managed` automatically sets `managementMode = 'human_managed'` and `isAiStopped = true`.

---

## Verification & Automated Test Suite

- **Command**: `npm run test:leads`
- **File**: `server/test/day6-leads-api.spec.ts`
- **10 Scenarios Verified Live Against Neon PostgreSQL**:
  1. Standard paginated lead retrieval matching frontend DTO contract.
  2. Search filtering across lead name and phone numbers (including Nigerian local 080... vs international +234... normalization).
  3. Status and score category filtering (`status=Qualified`, `scoreCategory=HOT`).
  4. Multi-tenant isolation: Workspace B cannot see Workspace A leads; cross-tenant GET and PATCH return `404`.
  5. Deep dossier fetch with linked property, broker, BANT score breakdown, and qualification profile.
  6. Status transition with automatic immutable `status_change` audit event in `lead_events`.
  7. Management mode automation: Transition to `Human Managed` halts AI (`isAiStopped = true`).
  8. Lead activity creation (`POST /leads/:id/activities`) with broker attribution.
  9. Chronological activity timeline retrieval (`GET /leads/:id/activities`).
  10. Ephemeral test workspace provisioning and clean teardown.
- **Result**: `ALL DAY 6 LEAD MANAGEMENT API TESTS PASSED (100%)`.

---

# Day 7: Property Adapter Layer & Integration Abstraction

## Objective
Establish a clean, provider-agnostic Property Adapter Layer decoupling AI agent reasoning engines, lead qualification workflows, appointment booking systems, and frontend clients from client property inventory backends (Neon PostgreSQL, external PMS like Yardi or Entrata, or custom CRMs).

---

## Architecture

```text
AI / Business Logic / Controllers
              ↓
    PropertyAdapterService
              ↓
       IPropertyAdapter
              ↓
 ┌──────────────────────────┬──────────────────────────┐
 │                          │                          │
SpaciaNativePropertyAdapter  MockPmsPropertyAdapter   Future Providers...
 (Neon / Drizzle PostgreSQL)  (Test Reference Store)   (Yardi / Entrata / MLS)
```

1. **AI / Business Logic** never knows or depends on how property records are stored.
2. **IPropertyAdapter** is the provider boundary:
   - `searchProperties(workspaceId, params)`
   - `getProperty(workspaceId, propertyId)`
   - `checkAvailability(workspaceId, query)`
   - `getPrice(workspaceId, query)`
   - `checkHealth(workspaceId)`
3. **PropertyAdapterRegistry**: Dynamically resolves the authoritative provider per workspace based on integration settings, falling back safely to native database storage.

---

## Canonical Normalized Contracts

- `NormalizedProperty`: Complete standardized property dossier (amenities, location, pricing, availability, verification, commercial terms).
- `NormalizedPropertySummary`: Optimized summary for list and search views.
- `NormalizedUnit`: Optional sub-unit representation for multi-unit developments.
- `PropertySearchParams` & `PropertySearchResult`: Keyword search, price, type, location, pagination, sorting.
- `AvailabilityQuery` & `AvailabilityResult`: Real-time status without fabricated unit holds.
- `PriceQuery` & `PriceResult`: Real price and stored fee breakdown without fabricated taxes.
- `IntegrationHealthStatus`: Operational health check with actual connection latency and capability flags.

---

## REST Endpoints Implemented

| Endpoint | Method | Required Permission | Description |
| :--- | :---: | :---: | :--- |
| `/properties/health` | `GET` | `properties:read` | Integration operational health, real latency check, and provider capabilities. |
| `/properties` | `GET` | `properties:read` | Paginated search across workspace property inventory with keyword, type, price, and status filters. |
| `/properties/:id` | `GET` | `properties:read` | Normalized detailed property dossier. Cross-tenant access returns 404 without leaking existence. |
| `/properties/:id/availability` | `GET` | `properties:read` | Real-time availability check for property or sub-unit. |
| `/properties/:id/price` | `GET` | `properties:read` | Normalized pricing breakdown and payment terms. |

---

## Verification & Automated Test Suite

- **Command**: `npm run test:properties`
- **File**: `server/test/day7-property-adapter.spec.ts`
- **8 Scenarios Verified Live Against Neon PostgreSQL**:
  1. `IPropertyAdapter` contract conformance across native and mock reference adapters.
  2. Multi-tenant workspace isolation on property search.
  3. Cross-workspace lookup non-disclosure (Workspace B cannot access Workspace A property; returns `null` / `404`).
  4. Normalized availability contract with provider-backed status.
  5. Normalized pricing contract with real stored commercial terms.
  6. Integration health abstraction with real database latency measurement.
  7. Dynamic provider resolution via `PropertyAdapterRegistry`.
  8. Full REST API flow end-to-end with verified `TenantContext`.
- **Result**: `ALL 8 PACIA DAY 7 INTEGRATION ADAPTER TESTS PASSED 100%`.

---

# Day 8: BullMQ & Redis Asynchronous Workflow Infrastructure

## Objective
Establish a reliable, production-grade asynchronous workflow execution infrastructure for Pacia using **BullMQ + Redis**, ensuring downstream workflows (e.g. AI qualification, scoring) do not block synchronous lead ingestion.

```text
Lead Ingestion (POST /leads/ingest)
        ↓
Interactive PostgreSQL Transaction (Persist Lead + Record 'NewLead' System Event)
        ↓
Post-Transaction Async Queue Dispatch
        ↓
BullMQ / Redis (`lead-workflows` queue, `process-new-lead` job)
        ↓
Worker Process
        ↓
Workflow Execution
        ↓
PostgreSQL System Event ('LeadWorkflowStarted' → 'LeadWorkflowCompleted' / 'LeadWorkflowFailed')
```

---

## Architectural Principles & Constraints

### 1. Redis Required for Production Execution (No Silent In-Memory Fallback)
- **Constraint**: Redis is required for real queue execution. The system will **never** silently fall back to an in-memory queue when Redis is unavailable.
- **Surfacing Failure**: If Redis is unreachable, `BullMQQueueService` surfaces an explicit infrastructure failure (`"Redis queue infrastructure is unavailable. Cannot enqueue workflow job."`).
- **Transactional Safety**: The `NewLead` event remains durably recorded in PostgreSQL with status `'emitted'` so recovery mechanisms can discover and dispatch it once Redis is available.

### 2. Clean Queue Abstraction Layer
Domain modules do not couple directly to BullMQ or Redis internals:
```text
Lead Domain (leads-ingest.service.ts)
        ↓
LeadWorkflowQueueService
        ↓
Queue Abstraction (queue.interface.ts)
        ↓
BullMQQueueService
        ↓
RedisConnectionService (ioredis)
```

### 3. Canonical Job Contract (`process-new-lead`)
- **Queue Name**: `lead-workflows`
- **Job Name**: `process-new-lead`
- **Minimal, Domain-Oriented Payload (`NewLeadWorkflowPayload`)**:
  ```typescript
  interface NewLeadWorkflowPayload {
    workspaceId: string;
    leadId: string;
    phone: string;
    email?: string;
    source: string;
    isReEngagement: boolean;
    metadata?: Record<string, any>;
  }
  ```
- Raw database rows, relational entities, or sensitive tokens are strictly excluded from queue payloads.

### 4. Centralized Retry Policy & Exponential Backoff
- Centralized configuration in `DEFAULT_WORKFLOW_RETRY_CONFIG`:
  - **Attempts**: 3 total
  - **Backoff Strategy**: Exponential
  - **Initial Delay**: 1000ms
  - **Progression**: 1s → 2s → 4s
  - **Retention**: Last 100 completed and 500 failed jobs preserved for operator inspection.

### 5. Idempotency & Deduplication
- **Queue Layer**: BullMQ `jobId` provides duplicate-job protection for the initial workflow:
  $$\text{jobId} = \text{lead\_wf\_}\{\text{workspaceId}\}\_\{\text{leadId}\}$$
- **Business Layer**: PostgreSQL state and `system_events` table provide durable business idempotency across worker restarts, retries, and job retention purges.

### 6. Durable System Events Lifecycle Tracking
Reuses existing PostgreSQL `system_events` table and `SystemEventsService`:
- `NewLead` (status: `"emitted"`, aggregateType: `"lead"`) — Persisted during lead ingestion transaction.
- `LeadWorkflowStarted` (status: `"processing"`, aggregateType: `"workflow"`) — Written when worker begins processing.
- `LeadWorkflowCompleted` (status: `"completed"`, aggregateType: `"workflow"`) — Written upon successful execution with execution duration.
- `LeadWorkflowFailed` (status: `"failed"`, aggregateType: `"workflow"`) — Written when all 3 attempts are exhausted. Contains sanitized stack trace and attempt counts (no secrets, passwords, or API keys).

### 7. Graceful Shutdown & Lifecycle Management
- Implements NestJS `OnApplicationShutdown` across `BullMQQueueService` and `RedisConnectionService`.
- Closes workers, queues, and Redis socket connections cleanly during application termination to prevent dangling connections.

---

## Verification & Automated Test Suite

- **Command**: `npm run test:queue`
- **File**: `server/test/day8-queue-infrastructure.spec.ts`
- **8 Scenarios Verified Live Against Neon PostgreSQL**:
  1. `Redis Connection Options & Failure Visibility`: Connection options configured; probe verifies availability; explicit error thrown when Redis is unreachable without silent in-memory fallback.
  2. `Centralized Queue Contracts & Exponential Backoff`: Verified `lead-workflows` queue name, `process-new-lead` job name, 3 attempts, exponential backoff starting at 1000ms.
  3. `Deterministic Idempotency Key Generation`: Deterministic `lead_wf_${workspaceId}_${leadId}` protection tested.
  4. `Durable System Event Lifecycle Recording`: Verified `LeadWorkflowStarted` (status: processing) and `LeadWorkflowCompleted` (status: completed) stored in Neon DB.
  5. `Terminal Failure & Exhaustion Handling`: Verified `LeadWorkflowFailed` persisted with `attemptsMade: 3`, `maxAttempts: 3`, and zero secrets leaked.
  6. `Lead Ingestion Integration & Non-Blocking Dispatch`: Verified `POST /leads/ingest` returns HTTP 201 immediately (< 2000ms) with `NewLead` event committed in PostgreSQL outbox.
  7. `Multi-Tenant Workspace Event Isolation`: Confirmed Workspace Alpha never observes events from Workspace Beta.
  8. `Graceful Shutdown Lifecycle Handling`: Verified BullMQ Queue, Worker, and Redis connection close gracefully.
- **Result**: `ALL DAY 8 BULLMQ & REDIS TESTS PASSED (8/8 - 100%)`.




