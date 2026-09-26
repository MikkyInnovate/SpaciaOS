const assert = require("assert");
import { config } from "dotenv";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { TransformInterceptor } from "../src/common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "../src/common/interceptors/logging.interceptor";
import { DRIZZLE_DATABASE, DrizzleDb, NEON_POOL } from "../src/database/database.provider";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "../src/database/schema";
import { eq } from "drizzle-orm";
import {
  hasPermission,
  hasRole,
  assertPermission,
  assertRole,
} from "../src/common/auth/authorization.utils";

config({ path: "./.env" });

neonConfig.webSocketConstructor = ws;

process.env.ALLOW_MOCK_AUTH = "true";
process.env.NODE_ENV = "test";

async function runDay3AuthorizationTests() {
  console.log("=========================================================");
  console.log(" PACIA DAY 3: SERVER-SIDE AUTHORIZATION VERIFICATION");
  console.log("=========================================================\n");

  const app = await NestFactory.create(AppModule, { logger: false });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor()
  );

  await app.listen(0);
  const server = app.getHttpServer();
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  const db: DrizzleDb = app.get(DRIZZLE_DATABASE);
  const pool: Pool = app.get(NEON_POOL);

  const timestamp = Date.now();
  const workspaceAId = `org_day3_alpha_${timestamp}`;
  const workspaceBId = `org_day3_beta_${timestamp}`;

  const userOwner = `user_owner_${timestamp}`;
  const userAdmin = `user_admin_${timestamp}`;
  const userManager = `user_manager_${timestamp}`;
  const userAgent = `user_agent_${timestamp}`;
  const userStranger = `user_stranger_${timestamp}`; // In Clerk org, but NOT in DB workspace_members

  try {
    // -------------------------------------------------------------
    // Setup: Seed Workspaces and Users in Neon DB
    // -------------------------------------------------------------
    console.log("SETUP: Seeding Workspaces, Users, and DB Memberships in Neon...");

    // 1. Create Workspaces A and B
    await db.insert(schema.workspaces).values([
      {
        id: workspaceAId,
        name: "Prime Dubai Realty",
        slug: `prime-dubai-${timestamp}`,
        tier: "enterprise",
      },
      {
        id: workspaceBId,
        name: "Abu Dhabi Luxury Estates",
        slug: `ad-luxury-${timestamp}`,
        tier: "growth",
      },
    ]);

    // 2. Create Users
    await db.insert(schema.users).values([
      { id: userOwner, email: `owner_${timestamp}@pacia.local`, firstName: "Alice", lastName: "Owner" },
      { id: userAdmin, email: `admin_${timestamp}@pacia.local`, firstName: "Bob", lastName: "Admin" },
      { id: userManager, email: `manager_${timestamp}@pacia.local`, firstName: "Charlie", lastName: "Manager" },
      { id: userAgent, email: `agent_${timestamp}@pacia.local`, firstName: "David", lastName: "Agent" },
      { id: userStranger, email: `stranger_${timestamp}@pacia.local`, firstName: "Eve", lastName: "Stranger" },
    ]);

    // 3. Assign DB Memberships in Workspace A:
    // Notice: userStranger is NOT added to workspace_members!
    await db.insert(schema.workspaceMembers).values([
      { workspaceId: workspaceAId, userId: userOwner, role: "owner" },
      { workspaceId: workspaceAId, userId: userAdmin, role: "admin" },
      { workspaceId: workspaceAId, userId: userManager, role: "sales_manager" },
      { workspaceId: workspaceAId, userId: userAgent, role: "sales_agent" },
    ]);

    console.log("  ✓ Workspaces A & B, Users, and Roles provisioned in Neon\n");

    // Helper to generate mock tokens
    const makeToken = (userId: string, orgId: string, clerkRole: string = "member") =>
      `mock_token_${userId}:${orgId}:${clerkRole}:org-slug`;

    // -------------------------------------------------------------
    // Test 1: Authenticated User + Valid DB Membership -> Authorized (200 OK)
    // -------------------------------------------------------------
    console.log("TEST 1: Authenticated User + Valid DB Membership -> Authorized (200 OK)...");
    const adminToken = makeToken(userAdmin, workspaceAId, "member"); // Notice: Clerk token says 'member', but DB says 'admin'
    const authMeRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(authMeRes.status, 200, "Should return 200 for valid DB member");
    const authMeJson = await authMeRes.json();
    assert.equal(authMeJson.success, true);
    assert.equal(authMeJson.data.paciaRole, "admin", "Pacia role must come authoritatively from DB, not Clerk claim");
    assert.ok(authMeJson.data.permissions.includes("workspace:manage"));
    console.log("  ✓ Authorized with 200 OK. Neon DB role 'admin' resolved authoritatively\n");

    // -------------------------------------------------------------
    // Test 2: Authenticated User + No DB Membership -> 403 WORKSPACE_MEMBERSHIP_REQUIRED
    // -------------------------------------------------------------
    console.log("TEST 2: Authenticated User + No DB Membership -> 403 WORKSPACE_MEMBERSHIP_REQUIRED...");
    // userStranger has a valid Clerk JWT containing workspaceAId, but has NO record in workspace_members!
    const strangerToken = makeToken(userStranger, workspaceAId, "member");
    const noMemberRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${strangerToken}` },
    });
    assert.equal(noMemberRes.status, 403, "Must reject user without DB membership");
    const noMemberJson = await noMemberRes.json();
    assert.equal(noMemberJson.success, false);
    assert.equal(noMemberJson.error.code, "WORKSPACE_MEMBERSHIP_REQUIRED");
    console.log("  ✓ Blocked with 403 WORKSPACE_MEMBERSHIP_REQUIRED: " + noMemberJson.error.message + "\n");

    // -------------------------------------------------------------
    // Test 3: Cross-Tenant Membership Boundary -> Workspace A Member accessing Workspace B
    // -------------------------------------------------------------
    console.log("TEST 3: Cross-Tenant Boundary (Member of A attempting to access B)...");
    // userAdmin belongs to Workspace A, but token requests Workspace B
    const crossTenantToken = makeToken(userAdmin, workspaceBId, "member");
    const crossTenantRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${crossTenantToken}` },
    });
    assert.equal(crossTenantRes.status, 403, "Must reject cross-tenant access when user is not member of B");
    const crossTenantJson = await crossTenantRes.json();
    assert.equal(crossTenantJson.error.code, "WORKSPACE_MEMBERSHIP_REQUIRED");
    console.log("  ✓ Cross-tenant access blocked with 403 WORKSPACE_MEMBERSHIP_REQUIRED\n");

    // -------------------------------------------------------------
    // Test 4: Owner Permissions (* Wildcard)
    // -------------------------------------------------------------
    console.log("TEST 4: Owner Permissions (Wildcard '*' Access)...");
    const ownerToken = makeToken(userOwner, workspaceAId, "org:member"); // Clerk claim downgraded, DB remains Owner
    const ownerMeRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert.equal(ownerMeRes.status, 200);
    const ownerMeJson = await ownerMeRes.json();
    assert.equal(ownerMeJson.data.paciaRole, "owner");
    assert.deepEqual(ownerMeJson.data.permissions, ["*"]);

    // Owner can access system-events (requires events:read)
    const ownerEventsRes = await fetch(`${baseUrl}/workspaces/system-events`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert.equal(ownerEventsRes.status, 200);
    console.log("  ✓ Owner authorized with wildcard '*' permissions\n");

    // -------------------------------------------------------------
    // Test 5: Admin Permissions
    // -------------------------------------------------------------
    console.log("TEST 5: Admin Permissions...");
    const adminEventsRes = await fetch(`${baseUrl}/workspaces/system-events`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminEventsRes.status, 200, "Admin must be allowed to read system events");
    console.log("  ✓ Admin authorized for events:read\n");

    // -------------------------------------------------------------
    // Test 6: Sales Manager Permissions
    // -------------------------------------------------------------
    console.log("TEST 6: Sales Manager Permissions...");
    const managerToken = makeToken(userManager, workspaceAId, "member");
    const managerEventsRes = await fetch(`${baseUrl}/workspaces/system-events`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.equal(managerEventsRes.status, 200, "Sales Manager has events:read");
    console.log("  ✓ Sales Manager authorized for events:read\n");

    // -------------------------------------------------------------
    // Test 7: Sales Agent Permissions (Has leads:read, but BLOCKED from events:read)
    // -------------------------------------------------------------
    console.log("TEST 7: Sales Agent Permissions (Allowed leads, blocked from events:read)...");
    const agentToken = makeToken(userAgent, workspaceAId, "admin"); // Clerk spoofing admin, but DB says sales_agent!
    const agentMeRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    assert.equal(agentMeRes.status, 200);
    const agentMeJson = await agentMeRes.json();
    assert.equal(agentMeJson.data.paciaRole, "sales_agent", "DB role sales_agent must prevail over spoofed Clerk claim");

    // Sales Agent attempts to read system-events (requires events:read)
    const agentEventsRes = await fetch(`${baseUrl}/workspaces/system-events`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    assert.equal(agentEventsRes.status, 403, "Sales Agent must NOT be allowed to read system events");
    const agentEventsJson = await agentEventsRes.json();
    assert.equal(agentEventsJson.error.code, "FORBIDDEN");
    console.log("  ✓ Sales Agent blocked with 403 FORBIDDEN on unauthorized permission: " + agentEventsJson.error.message + "\n");

    // -------------------------------------------------------------
    // Test 8: Reusable Authorization Utilities Unit Checks
    // -------------------------------------------------------------
    console.log("TEST 8: Reusable Authorization Utilities Unit Checks...");
    // hasPermission
    assert.equal(hasPermission("owner", "any:custom:perm"), true, "Owner has all permissions");
    assert.equal(hasPermission("admin", "workspace:manage"), true);
    assert.equal(hasPermission("admin", "events:read"), true);
    assert.equal(hasPermission("sales_manager", "events:read"), true);
    assert.equal(hasPermission("sales_agent", "events:read"), false, "Agent does not have events:read");
    assert.equal(hasPermission("sales_agent", "leads:read"), true);

    // hasRole
    assert.equal(hasRole("owner", ["owner", "admin"]), true);
    assert.equal(hasRole("sales_agent", ["owner", "admin"]), false);

    // assertPermission
    assert.doesNotThrow(() => assertPermission("admin", "events:read"));
    assert.throws(() => assertPermission("sales_agent", "events:read"), /ForbiddenException|lacks required permission/);

    // assertRole
    assert.doesNotThrow(() => assertRole("owner", ["owner", "admin"]));
    assert.throws(() => assertRole("sales_agent", ["owner", "admin"]), /ForbiddenException|is not authorized/);
    console.log("  ✓ hasPermission, hasRole, assertPermission, assertRole verified\n");

    // -------------------------------------------------------------
    // Test 9: Unknown/Invalid Role Does Not Receive Elevated Access
    // -------------------------------------------------------------
    console.log("TEST 9: Unknown / Invalid Role Check...");
    assert.equal(hasPermission("unknown_role" as any, "workspace:manage"), false);
    assert.equal(hasPermission(null as any, "leads:read"), false);
    assert.throws(() => assertPermission("tampered_role" as any, "leads:read"), /ForbiddenException|lacks required permission/);
    console.log("  ✓ Unknown role rejected with zero permissions\n");

    // -------------------------------------------------------------
    // Test 10: /auth/me Returns Complete DB-Backed Identity
    // -------------------------------------------------------------
    console.log("TEST 10: /auth/me Complete DB-Backed Identity Structure...");
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(meRes.status, 200);
    const meJson = await meRes.json();
    assert.equal(meJson.data.userId, userAdmin);
    assert.equal(meJson.data.workspaceId, workspaceAId);
    assert.equal(meJson.data.paciaRole, "admin");
    assert.equal(meJson.data.user.email, `admin_${timestamp}@pacia.local`);
    assert.equal(meJson.data.workspace.name, "Prime Dubai Realty");
    assert.equal(meJson.data.membership.role, "admin");
    console.log("  ✓ /auth/me verified with user, workspace, membership, role, and permissions\n");

    // -------------------------------------------------------------
    // Test 11: Explicit Provisioning Endpoint (POST /auth/sync)
    // -------------------------------------------------------------
    console.log("TEST 11: Explicit Provisioning & Sync Endpoint (POST /auth/sync)...");
    const newOrgId = `org_synced_${timestamp}`;
    const newUserId = `user_creator_${timestamp}`;
    const creatorToken = `mock_token_${newUserId}:${newOrgId}:org:admin:new-org`;

    // Explicit call to /auth/sync provisions user + workspace + owner membership
    const syncRes = await fetch(`${baseUrl}/auth/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creatorToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceName: "New Synced Agency",
        workspaceSlug: `synced-agency-${timestamp}`,
        tier: "growth",
        firstName: "Sync",
        lastName: "Master",
      }),
    });
    assert.equal(syncRes.status, 201);
    const syncJson = await syncRes.json();
    assert.equal(syncJson.data.isNewWorkspace, true);
    assert.equal(syncJson.data.membership.role, "owner");
    console.log("  ✓ Explicit /auth/sync provisioned new workspace & owner membership");

    // Now /auth/me succeeds for the newly provisioned user
    const syncedMeRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert.equal(syncedMeRes.status, 200);
    const syncedMeJson = await syncedMeRes.json();
    assert.equal(syncedMeJson.data.paciaRole, "owner");
    console.log("  ✓ Newly synced user immediately authorized on /auth/me with role 'owner'\n");

    // -------------------------------------------------------------
    // Test 12: Day 1 & Day 2 Regressions
    // -------------------------------------------------------------
    console.log("TEST 12: Day 1 & Day 2 Regression Checks...");
    // Public Health Check
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.equal(healthRes.status, 200);
    // Tenant Event Scoping
    const postEventRes = await fetch(`${baseUrl}/workspaces/system-events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName: "day3.auth.verified",
        aggregateType: "auth",
        aggregateId: userAdmin,
        payload: { scope: "day3" },
      }),
    });
    assert.equal(postEventRes.status, 201);
    console.log("  ✓ Day 1 health check & Day 2 tenant event scoping verified\n");

    console.log("=========================================================");
    console.log(" ALL DAY 3 AUTHORIZATION TESTS PASSED (100%)");
    console.log("=========================================================");
  } finally {
    // Cleanup Neon database records
    try {
      await db.delete(schema.systemEvents).where(eq(schema.systemEvents.workspaceId, workspaceAId));
      await db.delete(schema.workspaceMembers).where(eq(schema.workspaceMembers.workspaceId, workspaceAId));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceAId));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceBId));
    } catch {}
    await app.close();
  }
}

runDay3AuthorizationTests().catch((err) => {
  console.error("DAY 3 TEST FAILED:", err);
  process.exit(1);
});
