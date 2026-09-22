const assert = require("assert");
import { config } from "dotenv";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { TransformInterceptor } from "../src/common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "../src/common/interceptors/logging.interceptor";
import { WorkspacesRepository } from "../src/modules/workspaces/workspaces.repository";
import { DRIZZLE_DATABASE, DrizzleDb, NEON_POOL } from "../src/database/database.provider";
import { Pool } from "@neondatabase/serverless";
import * as schema from "../src/database/schema";
import { eq } from "drizzle-orm";

config({ path: "./.env" });

// Enable mock token parsing in test environment
process.env.ALLOW_MOCK_AUTH = "true";
process.env.NODE_ENV = "test";

async function runE2eTests() {
  console.log("=========================================================");
  console.log(" PACIA DAY 2: HTTP API & TENANT GUARD E2E TEST SUITE");
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
  const workspacesRepo = app.get(WorkspacesRepository);

  const testOrgId = "org_e2e_" + Date.now();

  try {
    // -------------------------------------------------------------
    // Test 1: Day 1 Regression - Public Health Check
    // -------------------------------------------------------------
    console.log("TEST 1: Day 1 Regression - Public Health Check...");
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.equal(healthRes.status, 200, "Health endpoint should return 200");
    const healthJson = await healthRes.json();
    assert.equal(healthJson.success, true);
    assert.equal(healthJson.message, "Pacia API operational");
    console.log("  ✓ Public endpoint /api/v1/health bypassed auth and succeeded\n");

    // -------------------------------------------------------------
    // Test 2: Unauthenticated Request to Protected Route
    // -------------------------------------------------------------
    console.log("TEST 2: Unauthenticated Request to Protected Route...");
    const unauthRes = await fetch(`${baseUrl}/workspaces/current`);
    assert.equal(unauthRes.status, 401, "Protected endpoint without token should return 401");
    const unauthJson = await unauthRes.json();
    assert.equal(unauthJson.success, false);
    assert.equal(unauthJson.error.code, "UNAUTHORIZED");
    console.log("  ✓ Blocked with 401 UNAUTHORIZED: " + unauthJson.error.message + "\n");

    // -------------------------------------------------------------
    // Test 3: Token Missing Active Organization (NO_ACTIVE_WORKSPACE)
    // -------------------------------------------------------------
    console.log("TEST 3: Token Missing Active Organization...");
    const noOrgToken = "mock_token_user_no_org:none:none:none";
    const noOrgRes = await fetch(`${baseUrl}/workspaces/current`, {
      headers: { Authorization: `Bearer ${noOrgToken}` },
    });
    assert.equal(noOrgRes.status, 403, "Token with no active org should return 403");
    const noOrgJson = await noOrgRes.json();
    assert.equal(noOrgJson.error.code, "NO_ACTIVE_WORKSPACE");
    console.log("  ✓ Blocked with 403 NO_ACTIVE_WORKSPACE: " + noOrgJson.error.message + "\n");

    // -------------------------------------------------------------
    // Test 4: Unknown Organization Role (UNSUPPORTED_ROLE)
    // -------------------------------------------------------------
    console.log("TEST 4: Role Safety - Unknown Role Rejected...");
    const unknownRoleToken = `mock_token_user_123:${testOrgId}:infiltrator_role:org-slug`;
    const unknownRoleRes = await fetch(`${baseUrl}/workspaces/current`, {
      headers: { Authorization: `Bearer ${unknownRoleToken}` },
    });
    assert.equal(unknownRoleRes.status, 403, "Unknown role should return 403");
    const unknownRoleJson = await unknownRoleRes.json();
    assert.equal(unknownRoleJson.error.code, "UNSUPPORTED_ROLE");
    console.log("  ✓ Blocked with 403 UNSUPPORTED_ROLE: " + unknownRoleJson.error.message + "\n");

    // -------------------------------------------------------------
    // Test 5: Workspace Mismatch Header Check (WORKSPACE_MISMATCH)
    // -------------------------------------------------------------
    console.log("TEST 5: Workspace Header Mismatch Check...");
    const validToken = `mock_token_user_123:${testOrgId}:org:admin:org-slug`;
    const mismatchRes = await fetch(`${baseUrl}/workspaces/current`, {
      headers: {
        Authorization: `Bearer ${validToken}`,
        "X-Workspace-Id": "org_different_impostor",
      },
    });
    assert.equal(mismatchRes.status, 403, "Mismatched X-Workspace-Id should return 403");
    const mismatchJson = await mismatchRes.json();
    assert.equal(mismatchJson.error.code, "WORKSPACE_MISMATCH");
    console.log("  ✓ Blocked with 403 WORKSPACE_MISMATCH: " + mismatchJson.error.message + "\n");

    // -------------------------------------------------------------
    // Test 6: Unprovisioned Workspace in Database (WORKSPACE_NOT_PROVISIONED)
    // -------------------------------------------------------------
    console.log("TEST 6: Unprovisioned Workspace Check...");
    const unprovisionedRes = await fetch(`${baseUrl}/workspaces/current`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert.equal(unprovisionedRes.status, 404, "Unprovisioned workspace should return 404");
    const unprovisionedJson = await unprovisionedRes.json();
    assert.equal(unprovisionedJson.error.code, "WORKSPACE_NOT_PROVISIONED");
    console.log("  ✓ Blocked with 404 WORKSPACE_NOT_PROVISIONED: " + unprovisionedJson.error.message + "\n");

    // -------------------------------------------------------------
    // Test 7: Provision Workspace & Successfully Query Current
    // -------------------------------------------------------------
    console.log("TEST 7: Provisioning Workspace & Successful Query...");
    await workspacesRepo.create({
      id: testOrgId,
      name: "E2E Test Workspace",
      slug: "e2e-test-slug-" + Date.now(),
      tier: "enterprise",
      primaryMarket: "Dubai Marina",
    });

    // Seed DB users and memberships for Day 3 DB membership guard
    await db.insert(schema.users).values([
      { id: "user_123", email: `user123_${Date.now()}@pacia.local` },
      { id: "user_viewer", email: `viewer_${Date.now()}@pacia.local` },
    ]);
    await db.insert(schema.workspaceMembers).values([
      { workspaceId: testOrgId, userId: "user_123", role: "admin" },
      { workspaceId: testOrgId, userId: "user_viewer", role: "sales_agent" },
    ]);

    const successRes = await fetch(`${baseUrl}/workspaces/current`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert.equal(successRes.status, 200);
    const successJson = await successRes.json();
    assert.equal(successJson.success, true);
    assert.equal(successJson.data.workspace.id, testOrgId);
    assert.equal(successJson.data.tenant.role, "admin");
    console.log("  ✓ 200 OK: Current workspace resolved with role 'admin' and permissions\n");

    // -------------------------------------------------------------
    // Test 8: Permission Enforcement on System Events
    // -------------------------------------------------------------
    console.log("TEST 8: Permission Enforcement on System Events...");
    // Viewer role lacks 'events:read' permission
    const viewerToken = `mock_token_user_viewer:${testOrgId}:viewer:org-slug`;
    const forbiddenRes = await fetch(`${baseUrl}/workspaces/system-events`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert.equal(forbiddenRes.status, 403, "Viewer should not have events:read permission");
    const forbiddenJson = await forbiddenRes.json();
    assert.equal(forbiddenJson.error.code, "FORBIDDEN");
    console.log("  ✓ Blocked viewer with 403 FORBIDDEN: " + forbiddenJson.error.message);

    // Admin role has 'events:read' permission
    const adminEventsRes = await fetch(`${baseUrl}/workspaces/system-events`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert.equal(adminEventsRes.status, 200, "Admin should be allowed to view events");
    const adminEventsJson = await adminEventsRes.json();
    assert.equal(adminEventsJson.success, true);
    assert.ok(Array.isArray(adminEventsJson.data));
    console.log("  ✓ Admin authorized to view system events (200 OK)\n");

    // -------------------------------------------------------------
    // Test 9: Emit Tenant-Scoped System Event via POST
    // -------------------------------------------------------------
    console.log("TEST 9: Emitting Operational System Event...");
    const postEventRes = await fetch(`${baseUrl}/workspaces/system-events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName: "e2e.test.event",
        aggregateType: "test",
        aggregateId: "agg_123",
        payload: { testCase: "day2" },
      }),
    });
    assert.equal(postEventRes.status, 201, "Event emission should return 201");
    const postEventJson = await postEventRes.json();
    assert.equal(postEventJson.success, true);
    assert.equal(postEventJson.data.workspaceId, testOrgId);
    console.log("  ✓ 201 CREATED: Operational event created and bound to tenant\n");

    // -------------------------------------------------------------
    // Test 10: Validation Error Envelope on Malformed POST
    // -------------------------------------------------------------
    console.log("TEST 10: Validation Error Envelope on Malformed POST...");
    const invalidPostRes = await fetch(`${baseUrl}/workspaces/system-events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Missing eventName, aggregateType, aggregateId
        payload: "not-an-object",
      }),
    });
    assert.equal(invalidPostRes.status, 400);
    const invalidPostJson = await invalidPostRes.json();
    assert.equal(invalidPostJson.success, false);
    assert.equal(invalidPostJson.error.code, "VALIDATION_ERROR");
    assert.ok(invalidPostJson.error.details.length >= 3);
    console.log("  ✓ 400 VALIDATION_ERROR canonical error envelope returned as expected\n");

    console.log("=========================================================");
    console.log(" ALL HTTP API & TENANT GUARD E2E TESTS PASSED (100%)");
    console.log("=========================================================");
  } finally {
    // Cleanup
    try {
      await db.delete(schema.systemEvents).where(eq(schema.systemEvents.workspaceId, testOrgId));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, testOrgId));
      await db.delete(schema.workspaceMembers).where(eq(schema.workspaceMembers.workspaceId, testOrgId));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, testOrgId));
      await db.delete(schema.users).where(eq(schema.users.id, "user_123"));
      await db.delete(schema.users).where(eq(schema.users.id, "user_viewer"));
    } catch {}
    await app.close();
  }
}

runE2eTests().catch((err) => {
  console.error("E2E TEST FAILED:", err);
  process.exit(1);
});
