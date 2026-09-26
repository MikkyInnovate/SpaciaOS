const assert = require("assert");
import { config } from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "../src/database/schema";
import { SystemEventsRepository } from "../src/modules/workspaces/system-events.repository";
import { WorkspacesRepository } from "../src/modules/workspaces/workspaces.repository";
import {
  mapClerkRoleToClientRole,
  DEFAULT_ROLE_PERMISSIONS,
} from "../src/database/schema/roles.schema";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";
import { eq } from "drizzle-orm";

// Load environment variables
config({ path: "./.env" });

neonConfig.webSocketConstructor = ws;

async function runTenantIsolationTests() {
  console.log("=========================================================");
  console.log(" PACIA DAY 2: TENANT ISOLATION & AUTH VERIFICATION SUITE");
  console.log("=========================================================\n");

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL must be defined in environment.");

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  const workspacesRepo = new WorkspacesRepository(db);
  const systemEventsRepo = new SystemEventsRepository(db);

  const testTenantAlphaId = "org_test_alpha_" + Date.now();
  const testTenantBetaId = "org_test_beta_" + Date.now();

  try {
    // -------------------------------------------------------------
    // Test 1: Role Safety & Mapping
    // -------------------------------------------------------------
    console.log("TEST 1: Verifying Role Safety & Mapping Conventions...");
    
    // Explicit known roles
    assert.equal(mapClerkRoleToClientRole("org:admin"), "admin");
    assert.equal(mapClerkRoleToClientRole("admin"), "admin");
    assert.equal(mapClerkRoleToClientRole("org:member"), "sales_agent");
    assert.equal(mapClerkRoleToClientRole("member"), "sales_agent");
    assert.equal(mapClerkRoleToClientRole("owner"), "owner");
    assert.equal(mapClerkRoleToClientRole("sales_manager"), "sales_manager");
    assert.equal(mapClerkRoleToClientRole("sales_agent"), "sales_agent");
    assert.equal(mapClerkRoleToClientRole("viewer"), "viewer");

    // Documented intentional fallback for missing role
    assert.equal(mapClerkRoleToClientRole(null), "viewer", "Missing role must fall back to viewer");
    assert.equal(mapClerkRoleToClientRole(undefined), "viewer", "Missing role must fall back to viewer");

    // Unknown roles must be strictly rejected (NEVER silently mapped to sales_agent or admin)
    assert.throws(
      () => mapClerkRoleToClientRole("super_user"),
      /Unsupported or unrecognized organization role/,
      "Unknown role 'super_user' must be rejected"
    );
    assert.throws(
      () => mapClerkRoleToClientRole("hacker_role"),
      /Unsupported or unrecognized organization role/,
      "Unknown role 'hacker_role' must be rejected"
    );

    console.log("  ✓ Known roles mapped correctly");
    console.log("  ✓ Missing roles safely fall back to 'viewer' baseline");
    console.log("  ✓ Unknown roles strictly rejected with exception\n");

    // -------------------------------------------------------------
    // Test 2: Provision Test Workspaces in Neon PostgreSQL
    // -------------------------------------------------------------
    console.log("TEST 2: Provisioning Test Workspaces on Neon...");
    await workspacesRepo.create({
      id: testTenantAlphaId,
      name: "Alpha Corp Test",
      slug: "alpha-corp-" + Date.now(),
      tier: "growth",
    });

    await workspacesRepo.create({
      id: testTenantBetaId,
      name: "Beta Properties Test",
      slug: "beta-prop-" + Date.now(),
      tier: "starter",
    });

    console.log(`  ✓ Provisioned Workspace Alpha: ${testTenantAlphaId}`);
    console.log(`  ✓ Provisioned Workspace Beta:  ${testTenantBetaId}\n`);

    // -------------------------------------------------------------
    // Test 3: Automated Verification of Cross-Tenant Data Isolation
    // -------------------------------------------------------------
    console.log("TEST 3: Automated Verification of Cross-Tenant Data Isolation...");

    const alphaCtx: TenantContext = {
      workspaceId: testTenantAlphaId,
      userId: "user_alpha_lead",
      role: "admin",
      permissions: DEFAULT_ROLE_PERMISSIONS["admin"],
    };

    const betaCtx: TenantContext = {
      workspaceId: testTenantBetaId,
      userId: "user_beta_lead",
      role: "sales_agent",
      permissions: DEFAULT_ROLE_PERMISSIONS["sales_agent"],
    };

    const alphaScopedRepo = systemEventsRepo.forTenant(alphaCtx);
    const betaScopedRepo = systemEventsRepo.forTenant(betaCtx);

    // Alpha inserts a tenant-owned record
    const alphaEvent = await alphaScopedRepo.create({
      eventName: "lead.created",
      aggregateType: "lead",
      aggregateId: "lead_123_confidential",
      payload: { clientName: "John Doe", value: 1500000 },
      status: "emitted",
    });

    assert.equal(alphaEvent.workspaceId, testTenantAlphaId, "Record workspace_id must match Alpha");
    console.log(`  ✓ Alpha created event [${alphaEvent.id}] correctly bound to workspaceId`);

    // Beta queries list
    const betaEvents = await betaScopedRepo.findMany();
    const leakedEvent = betaEvents.find((e) => e.id === alphaEvent.id);
    assert.equal(leakedEvent, undefined, "Beta must NEVER see Alpha's records in list queries");
    console.log("  ✓ Cross-tenant list isolation verified (Beta query returns 0 of Alpha's records)");

    // Beta attempts direct read by ID
    const crossRead = await betaScopedRepo.findById(alphaEvent.id);
    assert.equal(crossRead, null, "Beta must NOT be able to read Alpha's record by ID");
    console.log("  ✓ Cross-tenant findById isolation verified (returned null)");

    // Beta attempts cross-tenant update by ID
    const crossUpdate = await betaScopedRepo.updateById(alphaEvent.id, {
      eventName: "tampered.by.beta",
    });
    assert.equal(crossUpdate, null, "Beta must NOT be able to update Alpha's record");
    console.log("  ✓ Cross-tenant updateById isolation verified (returned null)");

    // Beta attempts cross-tenant delete by ID
    const crossDelete = await betaScopedRepo.deleteById(alphaEvent.id);
    assert.equal(crossDelete, false, "Beta must NOT be able to delete Alpha's record");
    console.log("  ✓ Cross-tenant deleteById isolation verified (returned false)");

    // Verify Alpha's record remains intact and untampered
    const intactRecord = await alphaScopedRepo.findById(alphaEvent.id);
    assert.ok(intactRecord, "Alpha's record must still exist");
    assert.equal(intactRecord!.eventName, "lead.created", "Alpha's record must remain unchanged");
    console.log("  ✓ Alpha's record confirmed intact and unmodified\n");

    // -------------------------------------------------------------
    // Test 4: Retention Policy & Cascade Behavior Verification
    // -------------------------------------------------------------
    console.log("TEST 4: Verifying Cascade vs Retention Foreign Key Constraints...");

    // Operational data cascades on workspace deletion
    // Retention compliance: insert audit log for Alpha
    await db.insert(schema.auditLogs).values({
      workspaceId: testTenantAlphaId,
      actorId: "user_alpha_lead",
      actorType: "user",
      severity: "info",
      action: "workspace.access",
      resource: "workspaces",
      metadata: { note: "test audit record" },
    });
    console.log("  ✓ Inserted compliance audit log with ON DELETE RESTRICT");

    // Attempting to delete workspace Alpha when audit log exists must fail (RESTRICT constraint)
    let restrictTriggered = false;
    try {
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, testTenantAlphaId));
    } catch (err: any) {
      restrictTriggered = true;
      assert.match(
        err.message,
        /audit_logs_workspace_id_workspaces_id_fk/,
        "Expected foreign key constraint violation on audit_logs"
      );
    }
    assert.equal(restrictTriggered, true, "Workspace deletion must be blocked by retention policy on audit logs");
    console.log("  ✓ ON DELETE RESTRICT verified: Audit logs prevent accidental destruction of workspace records");

    // Now test cascade deletion on operational data: Workspace Beta has operational event, NO audit logs
    const betaEvent = await betaScopedRepo.create({
      eventName: "call.completed",
      aggregateType: "call",
      aggregateId: "call_999",
      payload: { duration: 180 },
      status: "completed",
    });
    assert.ok(betaEvent, "Beta event created");

    // Deleting Workspace Beta should succeed and cascade operational data
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, testTenantBetaId));
    
    // Verify beta event was cascaded
    const cascadedEvents = await db
      .select()
      .from(schema.systemEvents)
      .where(eq(schema.systemEvents.workspaceId, testTenantBetaId));
    assert.equal(cascadedEvents.length, 0, "Operational events must cascade when workspace is deleted");
    console.log("  ✓ ON DELETE CASCADE verified: Operational system events cascaded upon workspace deletion\n");

    // -------------------------------------------------------------
    // Cleanup Alpha
    // -------------------------------------------------------------
    await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, testTenantAlphaId));
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, testTenantAlphaId));
    console.log("  ✓ Cleaned up test records\n");

    console.log("=========================================================");
    console.log(" ALL TENANT ISOLATION & RETENTION TESTS PASSED (100%)");
    console.log("=========================================================");
  } finally {
    try {
      await db.delete(schema.systemEvents).where(eq(schema.systemEvents.workspaceId, testTenantAlphaId));
      await db.delete(schema.systemEvents).where(eq(schema.systemEvents.workspaceId, testTenantBetaId));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, testTenantAlphaId));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, testTenantBetaId));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, testTenantAlphaId));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, testTenantBetaId));
    } catch {}
    await pool.end();
  }
}

runTenantIsolationTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
