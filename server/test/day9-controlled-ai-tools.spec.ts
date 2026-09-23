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
import { eq, and, desc } from "drizzle-orm";
import { AiToolExecutorService } from "../src/modules/ai-tools/services/ai-tool-executor.service";
import { MockPmsPropertyAdapter } from "../src/modules/properties/adapters/mock-pms-property.adapter";
import { ToolExecutionContext } from "../src/modules/ai-tools/interfaces/ai-tool.interface";

config({ path: "./.env" });
neonConfig.webSocketConstructor = ws;

process.env.ALLOW_MOCK_AUTH = "true";
process.env.NODE_ENV = "test";

async function runDay9ControlledAiToolsTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 9: CONTROLLED AI TOOLS & WORKSPACE AUTHORIZATION");
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
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  await app.listen(0);
  const server = app.getHttpServer();
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  const db: DrizzleDb = app.get(DRIZZLE_DATABASE);
  const pool: Pool = app.get(NEON_POOL);
  const executorService: AiToolExecutorService = app.get(AiToolExecutorService);
  const mockPmsAdapter: MockPmsPropertyAdapter = app.get(MockPmsPropertyAdapter);

  const timestamp = Date.now();
  const wsA = `ws_day9_alpha_${timestamp}`;
  const wsASlug = `alpha-ai-${timestamp}`;
  const wsB = `ws_day9_beta_${timestamp}`;
  const wsBSlug = `beta-ai-${timestamp}`;

  const userA = `user_day9_alpha_${timestamp}`;
  const userB = `user_day9_beta_${timestamp}`;

  const authHeaderA = {
    Authorization: `Bearer mock_token_${userA}:${wsA}:admin:${wsASlug}`,
    "X-Workspace-Id": wsA,
    "Content-Type": "application/json",
  };

  const authHeaderB = {
    Authorization: `Bearer mock_token_${userB}:${wsB}:admin:${wsBSlug}`,
    "X-Workspace-Id": wsB,
    "Content-Type": "application/json",
  };

  const contextA: ToolExecutionContext = {
    workspaceId: wsA,
    actorId: "ai_sales_persona_alpha",
    actorType: "ai_agent",
    permissions: ["*"],
    role: "admin",
  };

  const contextB: ToolExecutionContext = {
    workspaceId: wsB,
    actorId: "ai_sales_persona_beta",
    actorType: "ai_agent",
    permissions: ["*"],
    role: "admin",
  };

  let seededAgentAId: string;

  try {
    // 0. SETUP: Provision test workspaces, users, memberships, and domain data in Neon
    console.log("▶ [SETUP] Provisioning isolated test workspaces in Neon PostgreSQL...");
    await db.insert(schema.workspaces).values([
      { id: wsA, name: "Alpha Luxury Holdings", slug: wsASlug },
      { id: wsB, name: "Beta Waterfront Realty", slug: wsBSlug },
    ]);

    await db.insert(schema.users).values([
      { id: userA, email: `alpha_ai_${timestamp}@spacia.io`, firstName: "Alpha", lastName: "Agent" },
      { id: userB, email: `beta_ai_${timestamp}@spacia.io`, firstName: "Beta", lastName: "Agent" },
    ]);

    await db.insert(schema.workspaceMembers).values([
      { workspaceId: wsA, userId: userA, role: "admin" },
      { workspaceId: wsB, userId: userB, role: "admin" },
    ]);

    // Seed active PMS integration for Workspace A
    await db.insert(schema.integrations).values({
      workspaceId: wsA,
      name: "Client PMS Integration",
      type: "pms",
      status: "active",
      config: { provider: "mock_pms" },
    });

    // Seed Human Broker in Workspace A
    const [agentA] = await db
      .insert(schema.agents)
      .values({
        workspaceId: wsA,
        name: "Marcus Vance",
        email: `marcus_${timestamp}@alphaestates.ng`,
        phone: "+2348031112233",
        roleTitle: "Senior Private Broker",
        status: "active",
      })
      .returning();
    seededAgentAId = agentA.id;

    // Seed mock PMS integration fixtures for Workspace A
    mockPmsAdapter.addTestFixture({
      pmsId: `pms_${timestamp}_001`,
      tenantCode: wsA,
      listingName: "Banana Island Waterfront Mansion",
      slugRef: `banana-island-mansion-${timestamp}`,
      complexName: "Coral Shore Estates",
      streetAddress: "14 Ocean View Way",
      metroArea: "Ikoyi",
      territory: "Lagos State",
      category: "Mansion",
      currentRentOrPrice: 1250000000,
      currencyCode: "NGN",
      bedCount: 6,
      bathCount: 7,
      areaSqMeters: 850,
      pmsState: "VACANT",
      photos: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750"],
      bannerUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
      specs: ["Private Helipad", "Olympic Pool", "Bulletproof Master Suite"],
      terms: {
        deposit: "25%",
        plans: ["25% down, balance over 24 months", "Outright with 4% escrow discount"],
      },
    });

    mockPmsAdapter.addTestFixture({
      pmsId: `pms_${timestamp}_002`,
      tenantCode: wsA,
      listingName: "Eko Atlantic Horizon Penthouse",
      slugRef: `eko-atlantic-penthouse-${timestamp}`,
      complexName: "Alpha Tower",
      streetAddress: "8 Marina Road",
      metroArea: "Victoria Island",
      territory: "Lagos State",
      category: "Penthouse",
      currentRentOrPrice: 650000000,
      currencyCode: "NGN",
      bedCount: 4,
      bathCount: 5,
      areaSqMeters: 420,
      pmsState: "LEASED",
      photos: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
      bannerUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      specs: ["Smart Automation", "Lagoon Panorama"],
      terms: {
        deposit: "30%",
      },
    });

    console.log("✔ [SETUP COMPLETE] Test workspaces and fixtures ready.\n");

    // =========================================================================
    // TEST 1: Tool Discovery & Schema Export
    // =========================================================================
    console.log("▶ [TEST 1] Verifying Tool Discovery & JSON Schema definitions...");
    const toolDefs = executorService.getToolDefinitions();
    assert.equal(toolDefs.length, 6, "Expected exactly 6 registered controlled AI tools");

    const toolNames = toolDefs.map((t) => t.name);
    assert.ok(toolNames.includes("search_properties"), "search_properties must be registered");
    assert.ok(toolNames.includes("get_property"), "get_property must be registered");
    assert.ok(toolNames.includes("check_property_availability"), "check_property_availability must be registered");
    assert.ok(toolNames.includes("get_property_price"), "get_property_price must be registered");
    assert.ok(toolNames.includes("get_company_policy"), "get_company_policy must be registered");
    assert.ok(toolNames.includes("get_agent"), "get_agent must be registered");

    for (const def of toolDefs) {
      assert.ok(def.name, "Tool must have a name");
      assert.ok(def.description, "Tool must have a description");
      assert.equal(def.parameters.type, "object", "Tool parameters must be JSON schema object");
      assert.ok(typeof def.parameters.properties === "object", "Tool must define properties");
    }
    console.log("✔ [TEST 1 PASSED] All 6 tool contracts registered with valid JSON schemas.\n");

    // =========================================================================
    // TEST 2: search_properties via Integration Adapter
    // =========================================================================
    console.log("▶ [TEST 2] Testing 'search_properties' with integration adapter...");
    const searchRes = await executorService.executeTool(
      "search_properties",
      { query: "Banana Island", minPrice: 500000000 },
      contextA
    );

    assert.equal(searchRes.success, true);
    assert.equal(searchRes.toolName, "search_properties");
    assert.ok(searchRes.data.items.length >= 1, "Should find at least 1 property");
    assert.equal(searchRes.data.items[0].title, "Banana Island Waterfront Mansion");
    assert.ok(searchRes.sourceVerification, "Must contain source verification");
    assert.equal(searchRes.sourceVerification.source, "mock_pms");
    assert.equal(searchRes.sourceVerification.isVerified, true);
    assert.ok(searchRes.executionMetadata.durationMs >= 0);
    console.log("✔ [TEST 2 PASSED] 'search_properties' executed with provider source verification.\n");

    // =========================================================================
    // TEST 3: get_property via Integration Adapter
    // =========================================================================
    console.log("▶ [TEST 3] Testing 'get_property' with title deed verification details...");
    const propRes = await executorService.executeTool(
      "get_property",
      { propertyId: `pms_${timestamp}_001` },
      contextA
    );

    assert.equal(propRes.success, true);
    assert.equal(propRes.data.id, `pms_${timestamp}_001`);
    assert.equal(propRes.data.price, 1250000000);
    assert.equal(propRes.data.verification.status, "Verified");
    assert.equal(propRes.sourceVerification.isVerified, true);
    assert.equal(propRes.sourceVerification.source, "mock_pms");
    console.log("✔ [TEST 3 PASSED] 'get_property' returned full dossier with verified deed provenance.\n");

    // =========================================================================
    // TEST 4: check_property_availability via Integration Adapter
    // =========================================================================
    console.log("▶ [TEST 4] Testing 'check_property_availability' real-time check...");
    const availRes1 = await executorService.executeTool(
      "check_property_availability",
      { propertyId: `pms_${timestamp}_001` },
      contextA
    );
    assert.equal(availRes1.data.status, "Available");
    assert.equal(availRes1.data.isAvailable, true);

    const availRes2 = await executorService.executeTool(
      "check_property_availability",
      { propertyId: `pms_${timestamp}_002` },
      contextA
    );
    assert.equal(availRes2.data.status, "Sold");
    assert.equal(availRes2.data.isAvailable, false);
    console.log("✔ [TEST 4 PASSED] Real-time availability checked accurately without fabricating holds.\n");

    // =========================================================================
    // TEST 5: get_property_price via Integration Adapter
    // =========================================================================
    console.log("▶ [TEST 5] Testing 'get_property_price' commercial terms breakdown...");
    const priceRes = await executorService.executeTool(
      "get_property_price",
      { propertyId: `pms_${timestamp}_001` },
      contextA
    );
    assert.equal(priceRes.data.basePrice, 1250000000);
    assert.ok(priceRes.data.formattedBasePrice.includes("1,250,000,000"));
    assert.ok(priceRes.data.paymentOptions && priceRes.data.paymentOptions.length > 0);
    assert.equal(priceRes.sourceVerification.confidence, "authoritative");
    console.log("✔ [TEST 5 PASSED] Verified pricing and installment terms returned.\n");

    // =========================================================================
    // TEST 6: get_company_policy
    // =========================================================================
    console.log("▶ [TEST 6] Testing 'get_company_policy' compliance rules & guardrails...");
    // Commission category
    const commPolicyRes = await executorService.executeTool(
      "get_company_policy",
      { category: "commission" },
      contextA
    );
    assert.equal(commPolicyRes.data.policies.length, 1);
    assert.ok(commPolicyRes.data.policies[0].details.includes("5%"));
    assert.equal(commPolicyRes.data.policies[0].mandatoryGuardrail, true);
    assert.equal(commPolicyRes.sourceVerification.source, "spacia_policy_core");

    // All categories
    const allPolicyRes = await executorService.executeTool(
      "get_company_policy",
      { category: "all" },
      contextA
    );
    assert.ok(allPolicyRes.data.policies.length >= 6);
    const catList = allPolicyRes.data.policies.map((p: any) => p.category);
    assert.ok(catList.includes("commission"));
    assert.ok(catList.includes("inspection"));
    assert.ok(catList.includes("escrow_payment"));
    assert.ok(catList.includes("title_verification"));
    assert.ok(catList.includes("dnc_quiet_hours"));
    assert.ok(catList.includes("ai_escalation"));
    console.log("✔ [TEST 6 PASSED] Authoritative company policies retrieved with legal citations.\n");

    // =========================================================================
    // TEST 7: get_agent tenant-scoped broker lookup
    // =========================================================================
    console.log("▶ [TEST 7] Testing 'get_agent' broker directory lookup in Neon...");
    const agentRes = await executorService.executeTool(
      "get_agent",
      { agentId: seededAgentAId },
      contextA
    );
    assert.equal(agentRes.data.id, seededAgentAId);
    assert.equal(agentRes.data.name, "Marcus Vance");
    assert.equal(agentRes.data.roleTitle, "Senior Private Broker");
    assert.equal(agentRes.data.phone, "+2348031112233");
    assert.equal(agentRes.sourceVerification.source, "neon_database_agents");
    assert.equal(agentRes.sourceVerification.isVerified, true);
    console.log("✔ [TEST 7 PASSED] Active human broker profile resolved securely.\n");

    // =========================================================================
    // TEST 8: Inside-the-Tool Workspace Authorization (Risk Mitigation)
    // =========================================================================
    console.log("▶ [TEST 8] Testing Inside-the-Tool Workspace Authorization (Prompt Injection & Cross-Tenant Defense)...");
    
    // Scenario 8a: Prompt injection simulation - caller in wsA explicitly specifies workspaceId = wsB in parameters
    let promptInjectionBlocked = false;
    try {
      await executorService.executeTool(
        "search_properties",
        { query: "Penthouse", workspaceId: wsB }, // Malicious attempt to pierce tenant boundary
        contextA
      );
    } catch (err: any) {
      if (err.message.includes("Cross-workspace access denied") || err.status === 401 || err.status === 403) {
        promptInjectionBlocked = true;
      }
    }
    assert.equal(promptInjectionBlocked, true, "Prompt injection cross-workspace parameter MUST be blocked");

    // Scenario 8b: Workspace Beta caller attempts to access Workspace Alpha's property
    let crossTenantPropBlocked = false;
    try {
      await executorService.executeTool(
        "get_property",
        { propertyId: `pms_${timestamp}_001` }, // Belongs to wsA
        contextB // Authenticated as wsB
      );
    } catch (err: any) {
      if (err.status === 404 || err.message.includes("not found")) {
        crossTenantPropBlocked = true;
      }
    }
    assert.equal(crossTenantPropBlocked, true, "Cross-workspace property fetch MUST return 404 non-disclosure");

    // Scenario 8c: Workspace Beta caller attempts to access Workspace Alpha's human broker
    let crossTenantAgentBlocked = false;
    try {
      await executorService.executeTool(
        "get_agent",
        { agentId: seededAgentAId }, // Belongs to wsA
        contextB // Authenticated as wsB
      );
    } catch (err: any) {
      if (err.status === 404 || err.message.includes("not found")) {
        crossTenantAgentBlocked = true;
      }
    }
    assert.equal(crossTenantAgentBlocked, true, "Cross-workspace agent fetch MUST return 404 non-disclosure");

    console.log("✔ [TEST 8 PASSED] Inside-the-tool authorization structurally prevented all cross-tenant access.\n");

    // =========================================================================
    // TEST 9: Parameter Validation Enforcement
    // =========================================================================
    console.log("▶ [TEST 9] Testing Parameter Validation and sanitization...");
    
    // 9a: minPrice > maxPrice
    let invalidPriceRange = false;
    try {
      await executorService.executeTool(
        "search_properties",
        { minPrice: 500000000, maxPrice: 100000000 },
        contextA
      );
    } catch (err: any) {
      invalidPriceRange = true;
    }
    assert.equal(invalidPriceRange, true, "minPrice > maxPrice must fail validation");

    // 9b: Malformed propertyId (empty)
    let emptyPropId = false;
    try {
      await executorService.executeTool("get_property", { propertyId: "   " }, contextA);
    } catch (err: any) {
      emptyPropId = true;
    }
    assert.equal(emptyPropId, true, "Whitespace-only propertyId must fail validation");

    // 9c: Invalid policy category
    let invalidPolicyCat = false;
    try {
      await executorService.executeTool(
        "get_company_policy",
        { category: "unauthorized_discount_policy" as any },
        contextA
      );
    } catch (err: any) {
      invalidPolicyCat = true;
    }
    assert.equal(invalidPolicyCat, true, "Invalid policy category must fail validation");

    console.log("✔ [TEST 9 PASSED] Parameter validation enforced without querying adapters.\n");

    // =========================================================================
    // TEST 10: Durable Audit Logging Conformance
    // =========================================================================
    console.log("▶ [TEST 10] Verifying Audit Logging in Neon PostgreSQL `audit_logs` table...");
    const auditEntries = await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.workspaceId, wsA))
      .orderBy(desc(schema.auditLogs.createdAt));

    assert.ok(auditEntries.length >= 5, "Audit logs must have recorded tool executions for Workspace Alpha");

    const criticalSecurityLogs = auditEntries.filter((a) => a.severity === "critical");
    assert.ok(criticalSecurityLogs.length >= 1, "Must log critical audit entry for prompt injection attempt");
    assert.ok(
      (criticalSecurityLogs[0].metadata as any)?.error?.includes("Cross-workspace access denied"),
      "Audit log metadata must contain cross-workspace access rejection detail"
    );

    const normalLogs = auditEntries.filter((a) => a.severity === "info");
    assert.ok(normalLogs.length >= 1, "Must log info audit entry for successful tool executions");
    assert.equal(normalLogs[0].actorType, "ai_agent", "actorType must be 'ai_agent'");
    assert.ok((normalLogs[0].metadata as any)?.durationMs !== undefined, "Metadata must contain durationMs");

    console.log(`✔ [TEST 10 PASSED] Found ${auditEntries.length} audit log entries in Neon with actorType='ai_agent' and durationMs telemetry.\n`);

    // =========================================================================
    // TEST 11: HTTP REST API End-to-End
    // =========================================================================
    console.log("▶ [TEST 11] Verifying HTTP REST endpoints (/api/v1/ai-tools)...");

    // 11a: GET /api/v1/ai-tools
    const getToolsRes = await fetch(`${baseUrl}/ai-tools`, {
      method: "GET",
      headers: authHeaderA,
    });
    assert.equal(getToolsRes.status, 200, "GET /ai-tools must return 200");
    const getToolsJson = await getToolsRes.json();
    assert.equal(getToolsJson.success, true);
    assert.equal(getToolsJson.data.count, 6);

    // 11b: POST /api/v1/ai-tools/execute
    const executeRes = await fetch(`${baseUrl}/ai-tools/execute`, {
      method: "POST",
      headers: authHeaderA,
      body: JSON.stringify({
        toolName: "get_company_policy",
        parameters: { category: "escrow_payment" },
      }),
    });
    assert.equal(executeRes.status, 201, "POST /ai-tools/execute must return 201");
    const executeJson = await executeRes.json();
    assert.equal(executeJson.success, true);
    assert.equal(executeJson.data.toolName, "get_company_policy");
    assert.equal(executeJson.data.sourceVerification.source, "spacia_policy_core");
    assert.equal(executeJson.data.sourceVerification.isVerified, true);

    console.log("✔ [TEST 11 PASSED] REST endpoints verified end-to-end.\n");

    console.log("=========================================================");
    console.log(" ALL DAY 9 CONTROLLED AI TOOLS TESTS PASSED (11/11 - 100%)");
    console.log("=========================================================\n");
  } finally {
    // Teardown test data
    console.log("▶ [TEARDOWN] Purging test data from Neon PostgreSQL...");
    try {
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, wsA));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, wsB));
      await db.delete(schema.integrations).where(eq(schema.integrations.workspaceId, wsA));
      await db.delete(schema.agents).where(eq(schema.agents.workspaceId, wsA));
      await db.delete(schema.workspaceMembers).where(eq(schema.workspaceMembers.workspaceId, wsA));
      await db.delete(schema.workspaceMembers).where(eq(schema.workspaceMembers.workspaceId, wsB));
      await db.delete(schema.users).where(eq(schema.users.id, userA));
      await db.delete(schema.users).where(eq(schema.users.id, userB));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, wsA));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, wsB));
    } catch (e: any) {
      console.warn("Teardown warning:", e.message);
    }
    await app.close();
    await pool.end();
  }
}

runDay9ControlledAiToolsTests().catch((err) => {
  console.error("\n❌ DAY 9 TEST SUITE FAILED:", err);
  process.exit(1);
});
