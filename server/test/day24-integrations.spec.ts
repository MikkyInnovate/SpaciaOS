import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as assert from "node:assert";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { AppModule } from "../src/app.module";
import { IntegrationsService } from "../src/modules/integrations/integrations.service";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { eq } from "drizzle-orm";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";

neonConfig.webSocketConstructor = ws;

async function runDay24IntegrationsTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 24: CLIENT INTEGRATION MANAGEMENT SUITE");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const integrationsService = app.get<IntegrationsService>(IntegrationsService);

  const timestamp = Date.now();
  const TEST_WS_DAY24 = `ws_day24_integrations_${timestamp}`;
  const TEST_WS_DAY24_OTHER = `ws_day24_other_${timestamp}`;

  const primaryTenant: TenantContext = {
    workspaceId: TEST_WS_DAY24,
    userId: "user_day24_primary",
    role: "owner",
    permissions: ["*"],
  };

  const otherTenant: TenantContext = {
    workspaceId: TEST_WS_DAY24_OTHER,
    userId: "user_day24_other",
    role: "owner",
    permissions: ["*"],
  };

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision isolated workspaces in Neon PostgreSQL
    // -------------------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated Day 24 workspaces in Neon PostgreSQL...");
    await db.insert(schema.workspaces).values([
      { id: TEST_WS_DAY24, name: "Day 24 Integrations Realty", slug: TEST_WS_DAY24 },
      { id: TEST_WS_DAY24_OTHER, name: "Day 24 Isolated Workspace", slug: TEST_WS_DAY24_OTHER },
    ]);
    console.log("✔ [SETUP COMPLETE] Workspaces provisioned successfully.\n");

    // =========================================================================
    // TEST 1: Integration List & Default Provisioning
    // =========================================================================
    console.log("▶ [TEST 1] Testing Integration List Retrieval & Default Provisioning...");
    const integrations = await integrationsService.getIntegrations(primaryTenant.workspaceId);

    assert.ok(Array.isArray(integrations), "Integrations result must be an array");
    assert.ok(integrations.length >= 4, "Workspace must have at least 4 default client integrations");

    const expectedTypes = ["webhook", "google_calendar", "property_db", "crm"];
    expectedTypes.forEach((type) => {
      const item = integrations.find((i) => i.type === type);
      assert.ok(item, `Default integration type '${type}' must be present`);
      assert.ok(item.name.length > 0, `Integration '${type}' must have a name`);
      assert.ok(item.category.length > 0, `Integration '${type}' must have a category`);
      assert.ok(item.description.length > 0, `Integration '${type}' must have a description`);
    });

    console.log(`✔ [TEST 1 PASSED] Verified ${integrations.length} default client integrations provisioned and categorized.\n`);

    // =========================================================================
    // TEST 2: Credential Storage & Security Sanitization
    // =========================================================================
    console.log("▶ [TEST 2] Validating Credential Storage & Security Sanitization...");
    const testIntegration = integrations.find((i) => i.type === "webhook")!;
    const superSecretKey = "whsec_secret_key_super_confidential_999xyz";

    const updated = await integrationsService.updateCredentials(
      primaryTenant.workspaceId,
      testIntegration.id,
      {
        credentials: { webhookSecret: superSecretKey },
      }
    );

    // Strict Security Assertions
    assert.strictEqual(updated.hasCredentials, true, "hasCredentials flag must be true");
    assert.ok(updated.maskedKey, "Masked key must be present");
    assert.ok(updated.maskedKey.includes("••••••••••••"), "Masked key must redact middle characters");
    assert.strictEqual(
      (updated as any).credentials,
      undefined,
      "Raw credentials property must NOT exist on sanitized DTO"
    );

    const serialized = JSON.stringify(updated);
    assert.strictEqual(
      serialized.includes(superSecretKey),
      false,
      "CRITICAL SECURITY: Raw credentials must NEVER be exposed in JSON response"
    );

    // Verify raw credentials ARE stored in database
    const [dbRow] = await db
      .select()
      .from(schema.integrations)
      .where(eq(schema.integrations.id, testIntegration.id));
    assert.ok(dbRow, "Database row must exist");
    assert.strictEqual(
      (dbRow.credentials as any).webhookSecret,
      superSecretKey,
      "Raw credential must be securely persisted in Neon PostgreSQL"
    );

    console.log("✔ [TEST 2 PASSED] Credential storage verified: raw secrets persisted in Neon DB and 100% sanitized from responses.\n");

    // =========================================================================
    // TEST 3: Connection Validation & Health Tracking
    // =========================================================================
    console.log("▶ [TEST 3] Testing Live Connection Validation & Health Tracking...");
    const testResult = await integrationsService.testConnection(
      primaryTenant.workspaceId,
      testIntegration.id
    );

    assert.strictEqual(testResult.success, true, "Connection test must succeed for valid integration");
    assert.strictEqual(testResult.healthStatus, "healthy", "Health status must be healthy");
    assert.strictEqual(testResult.status, "connected", "Connection status must be connected");
    assert.ok(testResult.latencyMs > 0, "Latency measurement must be positive");
    assert.strictEqual(testResult.failureCount, 0, "Failure count must be 0 after successful test");
    assert.strictEqual(testResult.lastError, null, "lastError must be null on success");

    console.log(`✔ [TEST 3 PASSED] Validated ${testIntegration.name} in ${testResult.latencyMs}ms (Health: ${testResult.healthStatus}).\n`);


    // =========================================================================
    // TEST 4: Failure Recording & Error Tracking
    // =========================================================================
    console.log("▶ [TEST 4] Testing Failure Recording & Error Tracking...");
    // Update with invalid credentials to trigger provider failure
    await integrationsService.updateCredentials(
      primaryTenant.workspaceId,
      testIntegration.id,
      {
        credentials: { webhookSecret: "invalid_revoked_key_trigger_fail" },
      }
    );

    const failResult1 = await integrationsService.testConnection(
      primaryTenant.workspaceId,
      testIntegration.id
    );

    assert.strictEqual(failResult1.success, false, "Test must fail for invalid credentials");
    assert.strictEqual(failResult1.healthStatus, "unhealthy", "Health status must transition to unhealthy");
    assert.strictEqual(failResult1.status, "error", "Connection status must transition to error");
    assert.strictEqual(failResult1.failureCount, 1, "Failure count must record 1 failure");
    assert.ok(failResult1.lastError && failResult1.lastError.length > 0, "lastError must record failure reason");

    // Test second consecutive failure
    const failResult2 = await integrationsService.testConnection(
      primaryTenant.workspaceId,
      testIntegration.id
    );
    assert.strictEqual(failResult2.failureCount, 2, "Failure count must increment to 2 on repeat failure");

    console.log(`✔ [TEST 4 PASSED] Failure recording verified: status=error, failureCount=${failResult2.failureCount}, reason='${failResult2.lastError}'.\n`);

    // =========================================================================
    // TEST 5: Reconnect State Machine & Disconnect Lifecycle
    // =========================================================================
    console.log("▶ [TEST 5] Testing Reconnect & Disconnect Lifecycle...");
    // Restore valid credentials
    await integrationsService.updateCredentials(
      primaryTenant.workspaceId,
      testIntegration.id,
      {
        credentials: { webhookSecret: "whsec_restored_valid_key_001" },
      }
    );

    const reconnected = await integrationsService.reconnect(
      primaryTenant.workspaceId,
      testIntegration.id
    );
    assert.strictEqual(reconnected.status, "connected", "Reconnection must restore connected status");
    assert.strictEqual(reconnected.healthStatus, "healthy", "Reconnection must restore healthy status");
    assert.strictEqual(reconnected.failureCount, 0, "Reconnection must reset failureCount to 0");

    // Disconnect
    const disconnected = await integrationsService.disconnect(
      primaryTenant.workspaceId,
      testIntegration.id
    );
    assert.strictEqual(disconnected.status, "disconnected", "Disconnect must update status to disconnected");
    assert.strictEqual(disconnected.healthStatus, "untested", "Disconnect must set healthStatus to untested");

    // Reconnect again from disconnected state
    const reconnectedFromDisconnected = await integrationsService.reconnect(
      primaryTenant.workspaceId,
      testIntegration.id
    );
    assert.strictEqual(reconnectedFromDisconnected.status, "connected", "Reconnection from disconnected must restore connected status");
    assert.strictEqual(reconnectedFromDisconnected.healthStatus, "healthy", "Reconnection from disconnected must restore healthy status");

    console.log("✔ [TEST 5 PASSED] Reconnection and Disconnection state machine verified.\n");

    // =========================================================================
    // TEST 6: Multi-Tenant Data Isolation
    // =========================================================================
    console.log("▶ [TEST 6] Testing Multi-Tenant Isolation for Integrations...");
    const otherIntegrations = await integrationsService.getIntegrations(otherTenant.workspaceId);
    assert.ok(otherIntegrations.length > 0, "Other workspace must have its own isolated integrations");

    // Attempt cross-tenant access: Workspace B trying to inspect Workspace A's integration
    let crossTenantBlocked = false;
    try {
      await integrationsService.getIntegration(otherTenant.workspaceId, testIntegration.id);

    } catch (err: any) {
      crossTenantBlocked = true;
      assert.strictEqual(err.status, 404, "Cross-tenant access must throw 404 Not Found");
    }
    assert.strictEqual(crossTenantBlocked, true, "Cross-tenant integration access must be strictly blocked");

    console.log("✔ [TEST 6 PASSED] Multi-tenant isolation verified: zero cross-tenant credential or config leakage.\n");

    console.log("=========================================================");
    console.log(" ALL DAY 24 INTEGRATION MANAGEMENT TESTS PASSED (6/6 - 100%)");
    console.log("=========================================================\n");
  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN: Purge isolated test fixtures
    // -------------------------------------------------------------------------
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      await db.delete(schema.integrations).where(eq(schema.integrations.workspaceId, TEST_WS_DAY24));
      await db.delete(schema.integrations).where(eq(schema.integrations.workspaceId, TEST_WS_DAY24_OTHER));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY24));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY24_OTHER));
      console.log("✔ [TEARDOWN COMPLETE] Test fixtures purged.\n");
    } catch (err) {
      console.warn("Teardown warning:", (err as Error).message);
    }
    await app.close();
  }
}

runDay24IntegrationsTests().catch((err) => {
  console.error("\n❌ DAY 24 TEST FAILED:", err);
  process.exit(1);
});
