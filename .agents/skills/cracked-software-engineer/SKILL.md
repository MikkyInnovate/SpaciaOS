---
name: cracked-software-engineer
description: >-
  Ruthless, top-0.01% principal/staff software engineering inspection, code auditing, and architecture hardening.
  Use when conducting deep code reviews, hunting edge-case crashes, React Compiler / hook violations, concurrency race conditions,
  database query plan degradation, memory leaks, and enterprise pre-production certifications.
---

# Cracked Software Engineer: Deep Inspection & Hardening Protocol

This skill encodes the inspection playbook, diagnostic tools, and architectural paranoia of an elite Staff/Principal Software Engineer. It looks past passing unit tests into AST lint analysis, React Compiler invariants, runtime edge cases, database query plans, and concurrency bottlenecks.

---

## 1. Core Principles of Cracked Engineering

1. **Passing Tests Are Not Proof of Correctness**: A test suite only verifies what someone thought to test. Real production failures happen in the blind spots: unhandled promise rejections, race conditions under concurrency, conditional hook calls, and memory leaks.
2. **Deterministic & Pure Renders**: Never call impure functions (`Date.now()`, `Math.random()`, reading mutable refs) in render bodies. All SSR and client hydration must produce byte-for-byte identical output.
3. **Zero-Trust Multi-Tenancy**: Tenant isolation cannot rely on developer discipline. Enforce workspace scoping authoritatively at database repository boundaries and inside controlled tool contracts.
4. **Assume Every External Service Will Fail**: Third-party APIs (telephony, LLMs, calendar OAuth, email dispatchers) must have strict bounded timeouts, exponential backoff retries, and fallback circuit breakers.
5. **Zero Customer PII in Logs**: In high-stakes enterprise systems, customer phone numbers, emails, and API keys must be recursively scrubbed before touching logs or telemetry servers.

---

## 2. The 6-Pillar Inspection Runbook

### Pillar 1: React 19 & Compiler Rules of Hooks Audit
Execute deep AST linting to catch hook violations that compile but fail under dynamic re-renders:
```bash
npx eslint src --rule '{"react-hooks/rules-of-hooks": "error", "react-hooks/purity": "error", "react-hooks/immutability": "error"}'
```
* **Verify**: No hooks called inside `try...catch` blocks or conditional branches (`if`/`else`).
* **Verify**: No mutable ref reads/writes (`ref.current`) during render.
* **Verify**: No `Date.now()` or clock functions called in render bodies or `useMemo`. Use hydrated state (`mountedAt`).
* **Verify**: No synchronous `setState` in effects on prop change when derived state or React keys can be used.

### Pillar 2: Concurrency, Idempotency & Mutex Locks
* **In-Flight Operations**: Ensure mutative workflows (e.g. calendar slot bookings) use in-memory mutexes (`bookingLocks`) combined with database collision checks to prevent double-booking race conditions.
* **Webhook Ingestion**: Every external webhook must require a unique idempotency key with atomic database upsert (`idempotency_keys`).
* **Queue Deduplication**: Ensure BullMQ job IDs are uniquely scoped (e.g. `lead_wf_${workspaceId}_${leadId}`) and differentiated for re-engagements.

### Pillar 3: Database Schema & Query Plan Optimization
* **Multi-Tenant Composite Indexes**: Every table filtered by `workspaceId` must have composite indexes on high-cardinality search columns:
  * `(workspaceId, status)`
  * `(workspaceId, phone)`
  * `(workspaceId, email)`
  * `(workspaceId, createdAt)`
* **Connection Pool Resiliency**: Connection pools (e.g. Neon serverless WebSocket pool) must have active `pool.on("error")` event listeners to swallow transient network drops and reconnect gracefully.

### Pillar 4: Memory Leaks & Resource Cleanup
* **DOM Event Listeners**: All `window.addEventListener` or `document.addEventListener` calls inside `useEffect` must return explicit cleanup functions.
* **Intervals & Timeouts**: Any `setInterval` or `setTimeout` must be cleared on component unmount.
* **Breadcrumb & Log Buffers**: Telemetry ring buffers must have a strict capacity cap (e.g. 50 items) to prevent runaway memory consumption.

### Pillar 5: Security & Zero-Trust Authorization
* **Inside-the-Tool Authorization**: In LLM tool calling, authorization must happen inside the tool code itself using verified request credentials, preventing prompt injection attacks from accessing other tenants' data.
* **Timing-Safe HMAC Verification**: Webhook signatures must use `crypto.timingSafeEqual` to prevent timing attacks.
* **Secrets Redaction**: Ensure APIs sanitize sensitive credentials at the response serializer layer, returning only masked previews (`••••7890`).

### Pillar 6: Production Build & Bundle Stripping
```bash
# Verify compiler-level bundle optimization
npm run build

# Start production server and test console suppression
npm run start
```
* Verify SWC/Turbopack removes `console.log`, `console.info`, and `console.debug` in production.
* Verify hierarchical error boundaries catch runtime exceptions without showing a blank screen.

---

## 3. Quick Health Check Command
Run this one-liner to perform a rapid full-spectrum engineering audit:
```bash
npm run type-check && npm --prefix server run type-check && npm run test:frontend && npm --prefix server run test:day29
```
