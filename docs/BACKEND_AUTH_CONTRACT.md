# Pacia Authentication & Multi-Tenant Workspace Contract

**Target Audience:** Backend Engineer  
**Status:** Defined by Frontend (Day 3)  
**Authentication & Identity Provider:** Clerk (https://clerk.com)  

---

## 1. Architectural Overview

Pacia delegates user identity, authentication, session tokens, and initial organization memberships to Clerk.  
The frontend communicates directly with Clerk for sign-in, multi-factor authentication, and organization switching, then delivers authenticated requests to the Pacia Backend.

```text
Browser / Frontend
       │
       ▼
Clerk (Identity & Organization Provider)
  - Issues Short-Lived JWT Session Token
  - Issues Active Organization ID & Claims
       │
       ▼
Frontend (apiClient)
  - Injects 'Authorization: Bearer <clerk_jwt>'
  - Injects 'X-Workspace-Id: <clerk_org_id>'
       │
       ▼
Pacia Backend API
  - Verifies Clerk JWT via JWKS
  - Validates active Organization / Workspace access
  - Enforces Role-Based Permissions & Tenant Isolation
```

---

## 2. HTTP Request Contract (Frontend → Backend)

All requests originating from the Pacia frontend `apiClient` include standard headers:

| Header Name | Type | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `Authorization` | `string` | `Bearer eyJhbGciOiJSUzI1NiIs...` | Short-lived RS256 JWT issued by Clerk. |
| `X-Workspace-Id` | `string` | `org_2bg8XN...` | Active Clerk Organization ID representing the workspace. |
| `Content-Type` | `string` | `application/json` | Standard payload format. |
| `Accept` | `string` | `application/json` | Standard accept format. |

---

## 3. Token Claims Expected by the Backend

The Clerk session token generated for the Pacia application will contain standard and organization claims:

```json
{
  "sub": "user_2aXk...",
  "iss": "https://<clerk-domain>.clerk.accounts.dev",
  "iat": 1757598000,
  "exp": 1757598060,
  "email": "agent@premier-realty.com",
  "org_id": "org_2bg8XN...",
  "org_slug": "premier-realty",
  "org_role": "org:admin",
  "org_permissions": [
    "org:lead:read",
    "org:lead:write",
    "org:call:trigger",
    "org:settings:manage"
  ]
}
```

---

## 4. Required Backend Responsibilities

When the backend engineer begins implementation, the backend service must:

1. **Verify Token Signature & Expiry:**
   - Fetch Clerk JWKS public keys from `https://api.clerk.com/v1/jwks` or use the official Clerk SDK (Node/Go/Python).
   - Reject unverified, expired, or tampered tokens with `401 Unauthorized`.

2. **Match Tenant / Workspace Header:**
   - Verify that the `X-Workspace-Id` header matches the `org_id` in the token claims (or verify that the user has explicit cross-tenant admin delegation if applicable).
   - Reject mismatches with `403 Forbidden`.

3. **Workspace Entity Resolution:**
   - Map `org_id` to the internal Pacia Workspace database record (e.g. `workspaces` table).
   - If an organization is recognized for the first time via webhook or JIT provisioning, provision the local workspace tenant record.

4. **Tenant Data Isolation:**
   - Scope all database queries (leads, calls, conversations, appointments, analytics) strictly to the resolved workspace ID:
     ```sql
     SELECT * FROM leads WHERE workspace_id = :workspace_id AND id = :lead_id;
     ```

5. **Error Response Consistency:**
   - Unauthorized:
     ```json
     { "error": "unauthorized", "message": "Valid authentication credentials were not provided or have expired." }
     ```
   - Forbidden / Workspace Mismatch:
     ```json
     { "error": "forbidden", "message": "You do not have permission to access the requested workspace." }
     ```

---

## 5. Webhook Synchronization (Clerk → Backend)

To keep local workspace records and user profiles updated in real-time, the backend should expose a Clerk webhook endpoint (e.g., `/api/webhooks/clerk`) listening to:
- `user.created`, `user.updated`, `user.deleted`
- `organization.created`, `organization.updated`, `organization.deleted`
- `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`
