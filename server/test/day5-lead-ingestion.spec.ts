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
import { eq, and } from "drizzle-orm";

config({ path: "./.env" });
neonConfig.webSocketConstructor = ws;

process.env.ALLOW_MOCK_AUTH = "true";
process.env.NODE_ENV = "test";

async function runDay5LeadIngestionTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 5: LEAD INGESTION & PIPELINE VERIFICATION");
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

  const timestamp = Date.now();
  const ws1 = `ws_day5_alpha_${timestamp}`;
  const ws1Slug = `alpha-realty-${timestamp}`;
  const ws2 = `ws_day5_beta_${timestamp}`;
  const ws2Slug = `beta-realty-${timestamp}`;

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision isolated test workspaces & properties in Neon
    // -------------------------------------------------------------------------
    console.log("1. PROVISIONING ISOLATED TEST WORKSPACES & PROPERTIES...");
    await db.insert(schema.workspaces).values([
      {
        id: ws1,
        name: "Alpha Prime Properties",
        slug: ws1Slug,
        tier: "enterprise",
      },
      {
        id: ws2,
        name: "Beta Global Realty",
        slug: ws2Slug,
        tier: "growth",
      },
    ]);

    const [prop1] = await db
      .insert(schema.properties)
      .values({
        workspaceId: ws1,
        slug: "banana-island-villa",
        title: "Banana Island Waterfront Villa",
        location: "Zone A, Banana Island",
        city: "Ikoyi",
        state: "Lagos State",
        propertyType: "Luxury Villa",
        price: "1200000000.00",
        formattedPrice: "₦1,200,000,000",
        availability: "Available",
        verificationStatus: "Verified",
      })
      .returning();

    const [prop2] = await db
      .insert(schema.properties)
      .values({
        workspaceId: ws2,
        slug: "eko-atlantic-tower",
        title: "Eko Atlantic High-Rise Penthouse",
        location: "Eko Atlantic City",
        city: "Victoria Island",
        state: "Lagos State",
        propertyType: "Penthouse",
        price: "950000000.00",
        formattedPrice: "₦950,000,000",
        availability: "Available",
        verificationStatus: "Verified",
      })
      .returning();

    console.log("  ✓ Test workspaces & properties provisioned in Neon");

    // -------------------------------------------------------------------------
    // TEST 1: Standard Public Lead Ingestion & Normalization
    // -------------------------------------------------------------------------
    console.log("\n2. TESTING STANDARD PUBLIC INGESTION & FIELD NORMALIZATION...");
    const ingestRes1 = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Id": ws1,
      },
      body: JSON.stringify({
        name: "  Chief   Adeleke   Cole  ",
        phone: "0803 123 4567", // Nigerian local format
        email: "  CHIEF.ADELEKE@GMAIL.COM  ",
        propertySlug: "banana-island-villa",
        budget: "₦1.5 Billion",
        timeline: "Immediate",
        locationPreference: "Ikoyi",
        message: "Interested in seeing the waterfront view this Friday.",
        source: "website_landing_page",
      }),
    });

    if (ingestRes1.status !== 201) {
      const errText = await ingestRes1.text();
      console.error("INGEST 1 ERROR:", ingestRes1.status, errText);
    }
    assert.strictEqual(ingestRes1.status, 201, "Expected 201 Created for standard lead ingestion");
    const ingestBody1 = await ingestRes1.json();
    assert.strictEqual(ingestBody1.success, true);
    assert.strictEqual(ingestBody1.data.isDuplicate, false);
    assert.strictEqual(ingestBody1.data.reEngaged, false);

    const lead1 = ingestBody1.data.lead;
    assert.strictEqual(lead1.name, "Chief Adeleke Cole", "Name should be normalized");
    assert.strictEqual(lead1.phone, "+2348031234567", "Phone should be normalized to E.164");
    assert.strictEqual(lead1.email, "chief.adeleke@gmail.com", "Email should be lowercased");
    assert.strictEqual(lead1.propertyId, prop1.id, "Property slug should resolve to property ID");
    assert.strictEqual(lead1.workspaceId, ws1);
    assert.strictEqual(lead1.status, "New");

    // Verify lead_events record
    const events1 = await db
      .select()
      .from(schema.leadEvents)
      .where(and(eq(schema.leadEvents.leadId, lead1.id), eq(schema.leadEvents.workspaceId, ws1)));
    assert.strictEqual(events1.length, 1);
    assert.strictEqual(events1[0].type, "inbound_capture");
    console.log("  ✓ Standard lead created with normalized phone (+2348031234567) & email");
    console.log("  ✓ Inbound event recorded in lead_events");

    // Verify system_events outbox record
    const systemEvents1 = await db
      .select()
      .from(schema.systemEvents)
      .where(
        and(
          eq(schema.systemEvents.workspaceId, ws1),
          eq(schema.systemEvents.aggregateId, lead1.id)
        )
      );
    assert.strictEqual(systemEvents1.length, 1);
    assert.strictEqual(systemEvents1[0].eventName, "NewLead");
    assert.strictEqual(systemEvents1[0].status, "emitted");
    console.log("  ✓ Durable system event 'NewLead' recorded in transactional outbox");

    // -------------------------------------------------------------------------
    // TEST 2: Workspace Resolution Precedence
    // -------------------------------------------------------------------------
    console.log("\n3. TESTING WORKSPACE RESOLUTION PRECEDENCE...");
    // A. By X-Workspace-Slug header
    const slugHeaderRes = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Slug": ws1Slug,
      },
      body: JSON.stringify({
        name: "Mrs Folashade Alakija",
        phone: "08029998888",
      }),
    });
    assert.strictEqual(slugHeaderRes.status, 201);
    const slugHeaderBody = await slugHeaderRes.json();
    assert.strictEqual(slugHeaderBody.data.lead.workspaceId, ws1);
    console.log("  ✓ Resolved workspace via X-Workspace-Slug header");

    // B. By workspaceSlug in body
    const bodySlugRes = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Mr Babatunde Fashola",
        phone: "08091112222",
        workspaceSlug: ws1Slug,
      }),
    });
    assert.strictEqual(bodySlugRes.status, 201);
    const bodySlugData = await bodySlugRes.json();
    assert.strictEqual(bodySlugData.data.lead.workspaceId, ws1);
    console.log("  ✓ Resolved workspace via body.workspaceSlug");

    // C. Missing workspace identifier -> 400 Bad Request
    const missingWsRes = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ghost User",
        phone: "08011111111",
      }),
    });
    assert.strictEqual(missingWsRes.status, 400);
    const missingWsErr = await missingWsRes.json();
    assert.strictEqual(
      missingWsErr.error?.code || missingWsErr.code,
      "WORKSPACE_IDENTIFIER_REQUIRED"
    );
    console.log("  ✓ Rejected request with missing workspace identifier (400)");

    // D. Non-existent workspace -> 404 Not Found
    const invalidWsRes = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Id": "ws_non_existent_9999",
      },
      body: JSON.stringify({
        name: "Unknown Tenant Inquirer",
        phone: "08011111111",
      }),
    });
    assert.strictEqual(invalidWsRes.status, 404);
    console.log("  ✓ Rejected non-existent workspace (404)");

    // -------------------------------------------------------------------------
    // TEST 3: Property Resolution & Cross-Tenant Rejection
    // -------------------------------------------------------------------------
    console.log("\n4. TESTING PROPERTY RESOLUTION & CROSS-TENANT BLOCKING...");
    // Attempt to ingest lead for Workspace 1 referencing Property 2 (which belongs to Workspace 2)
    const crossTenantPropRes = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Id": ws1, // Workspace 1
      },
      body: JSON.stringify({
        name: "Intruder Buyer",
        phone: "08055554444",
        propertySlug: "eko-atlantic-tower", // Belongs to Workspace 2!
      }),
    });
    assert.strictEqual(crossTenantPropRes.status, 400);
    const crossTenantErr = await crossTenantPropRes.json();
    assert.strictEqual(
      crossTenantErr.error?.code || crossTenantErr.code,
      "PROPERTY_NOT_FOUND_IN_WORKSPACE"
    );
    console.log("  ✓ Cross-tenant property attachment rejected with PROPERTY_NOT_FOUND_IN_WORKSPACE (400)");

    // -------------------------------------------------------------------------
    // TEST 4: Idempotency Key Replay
    // -------------------------------------------------------------------------
    console.log("\n5. TESTING IDEMPOTENCY KEY REPLAY PROTECTION...");
    const idempKey = `idemp_test_lead_${timestamp}`;

    // Request 1: New key
    const idempRes1 = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Id": ws1,
        "Idempotency-Key": idempKey,
      },
      body: JSON.stringify({
        name: "Senator Musa",
        phone: "08077778888",
        email: "musa@senate.gov.ng",
        message: "First submission with idempotency key",
      }),
    });
    assert.strictEqual(idempRes1.status, 201);
    assert.strictEqual(idempRes1.headers.get("x-idempotent-replay"), null);
    const idempBody1 = await idempRes1.json();
    const leadMusaId = idempBody1.data.lead.id;

    // Request 2: Replay with identical key
    const idempRes2 = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Id": ws1,
        "Idempotency-Key": idempKey,
      },
      body: JSON.stringify({
        name: "Senator Musa",
        phone: "08077778888",
        email: "musa@senate.gov.ng",
        message: "First submission with idempotency key",
      }),
    });
    assert.strictEqual(idempRes2.status, 201);
    assert.strictEqual(idempRes2.headers.get("x-idempotent-replay"), "true");
    const idempBody2 = await idempRes2.json();
    assert.strictEqual(idempBody2.data.lead.id, leadMusaId);

    // Verify database count for Senator Musa is strictly 1
    const musaCount = await db
      .select()
      .from(schema.leads)
      .where(and(eq(schema.leads.phone, "+2348077778888"), eq(schema.leads.workspaceId, ws1)));
    assert.strictEqual(musaCount.length, 1);
    console.log("  ✓ Idempotent replay returned exact cached response with X-Idempotent-Replay header");
    console.log("  ✓ Database row count remained exactly 1");

    // -------------------------------------------------------------------------
    // TEST 5: Duplicate Detection & Re-engagement (Phone / Email Match)
    // -------------------------------------------------------------------------
    console.log("\n6. TESTING DUPLICATE DETECTION & RE-ENGAGEMENT...");
    // Subsequent inquiry with Chief Adeleke's phone number without an idempotency key
    const reEngageRes = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Id": ws1,
      },
      body: JSON.stringify({
        name: "Chief Adeleke Cole",
        phone: "08031234567", // Same phone as Lead 1!
        message: "Following up: Can I bring my architect tomorrow?",
      }),
    });
    assert.strictEqual(reEngageRes.status, 200, "Expected 200 OK for re-engagement");
    const reEngageBody = await reEngageRes.json();
    assert.strictEqual(reEngageBody.data.isDuplicate, true);
    assert.strictEqual(reEngageBody.data.reEngaged, true);
    assert.strictEqual(reEngageBody.data.lead.id, lead1.id);

    // Verify that NO new lead was created
    const adelekeLeads = await db
      .select()
      .from(schema.leads)
      .where(and(eq(schema.leads.phone, "+2348031234567"), eq(schema.leads.workspaceId, ws1)));
    assert.strictEqual(adelekeLeads.length, 1, "Expected exactly 1 lead row for Chief Adeleke");

    // Verify that a SECOND lead_event was recorded for re-engagement
    const adelekeEvents = await db
      .select()
      .from(schema.leadEvents)
      .where(and(eq(schema.leadEvents.leadId, lead1.id), eq(schema.leadEvents.workspaceId, ws1)));
    assert.strictEqual(adelekeEvents.length, 2, "Expected 2 lead_events (initial + re-engagement)");
    console.log("  ✓ Existing lead detected by phone without creating duplicate row");
    console.log("  ✓ Appended re-engagement inbound_capture event to lead timeline");

    // -------------------------------------------------------------------------
    // TEST 6: Client / External Lead ID Deduplication
    // -------------------------------------------------------------------------
    console.log("\n7. TESTING CLIENT / EXTERNAL LEAD ID MATCHING...");
    const clientLeadId = `fb_lead_ad_${timestamp}`;

    // First ingestion with externalId
    const extRes1 = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Id": ws1,
      },
      body: JSON.stringify({
        name: "Dr Ngozi Okonjo",
        phone: "08081234000",
        clientLeadId,
        source: "facebook_ads",
      }),
    });
    assert.strictEqual(extRes1.status, 201);
    const extLead1 = (await extRes1.json()).data.lead;
    assert.strictEqual(extLead1.externalId, clientLeadId);

    // Second ingestion with same externalId
    const extRes2 = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Id": ws1,
      },
      body: JSON.stringify({
        name: "Dr Ngozi Okonjo",
        phone: "08081234000",
        clientLeadId,
        source: "facebook_ads",
        message: "Duplicate webhook delivery from Facebook Ads",
      }),
    });
    assert.strictEqual(extRes2.status, 200);
    const extData2 = await extRes2.json();
    assert.strictEqual(extData2.data.isDuplicate, true);
    assert.strictEqual(extData2.data.lead.id, extLead1.id);
    console.log("  ✓ Client / External Lead ID identified existing lead correctly");

    // -------------------------------------------------------------------------
    // TEST 8: Concurrent Idempotency Execution
    // -------------------------------------------------------------------------
    console.log("\n8. TESTING CONCURRENT IDEMPOTENCY EXECUTION (POSTGRESQL CONCURRENCY LOCK)...");
    const concurrentKey = `idemp_concurrent_${timestamp}`;
    const concurrentPayload = {
      name: "Alhaji Dangote",
      phone: "08060000000",
      email: "dangote@cement.ng",
      message: "Concurrent lead submission test",
    };

    // Fire 2 simultaneous requests with the exact same key
    const [resA, resB] = await Promise.all([
      fetch(`${baseUrl}/leads/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-Id": ws1,
          "Idempotency-Key": concurrentKey,
        },
        body: JSON.stringify(concurrentPayload),
      }),
      fetch(`${baseUrl}/leads/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-Id": ws1,
          "Idempotency-Key": concurrentKey,
        },
        body: JSON.stringify(concurrentPayload),
      }),
    ]);

    // Either one succeeded and one was replayed/conflict, or both completed safely
    const statuses = [resA.status, resB.status];
    console.log(`  ✓ Concurrent requests returned HTTP statuses: [${statuses.join(", ")}]`);
    assert.ok(
      statuses.includes(201) || statuses.includes(200),
      "At least one request should succeed with 200/201"
    );

    // Verify database row count for Alhaji Dangote is strictly 1
    const dangoteCount = await db
      .select()
      .from(schema.leads)
      .where(and(eq(schema.leads.phone, "+2348060000000"), eq(schema.leads.workspaceId, ws1)));
    assert.strictEqual(dangoteCount.length, 1, "Concurrency lock prevented duplicate lead creation");
    console.log("  ✓ Concurrency lock prevented duplicate lead rows (Count: 1)");

    // -------------------------------------------------------------------------
    // TEST 9: Authenticated Tenant Isolation & Mismatch Rejection
    // -------------------------------------------------------------------------
    console.log("\n9. TESTING AUTHENTICATED CONTEXT IMMUTABILITY & MISMATCH REJECTION...");
    const userAgent = `user_agent_${timestamp}`;
    await db.insert(schema.users).values({
      id: userAgent,
      email: `agent_${timestamp}@alpharealty.ng`,
      firstName: "Sales",
      lastName: "Agent",
    });
    await db.insert(schema.workspaceMembers).values({
      workspaceId: ws1,
      userId: userAgent,
      role: "sales_agent",
    });

    const makeToken = (userId: string, orgId: string) =>
      `mock_token_${userId}:${orgId}:member:org-slug`;
    const agentToken = makeToken(userAgent, ws1);

    // Attempt to spoof workspace by passing X-Workspace-Id: ws2 while authenticated to ws1
    const spoofRes = await fetch(`${baseUrl}/leads/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${agentToken}`,
        "X-Workspace-Id": ws2, // Conflicting header!
      },
      body: JSON.stringify({
        name: "Spoofed Lead",
        phone: "08055551111",
      }),
    });

    assert.strictEqual(spoofRes.status, 403, "Authenticated mismatch should return 403 Forbidden");
    const spoofErr = await spoofRes.json();
    assert.strictEqual(
      spoofErr.error?.code || spoofErr.code,
      "WORKSPACE_CONTEXT_MISMATCH"
    );
    console.log("  ✓ Blocked tenant spoofing: authenticated tenant cannot be overridden by headers (403)");

    console.log("\n=========================================================");
    console.log(" ALL DAY 5 LEAD INGESTION TESTS PASSED (100%)");
    console.log("=========================================================\n");
  } catch (err: any) {
    console.error("\n❌ DAY 5 LEAD INGESTION TEST FAILED:", err);
    process.exit(1);
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP: Destroy ephemeral test workspaces & cascade records
    // -------------------------------------------------------------------------
    console.log("Cleaning up ephemeral test workspaces...");
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, ws1)).catch(() => { });
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, ws2)).catch(() => { });
    await app.close();
    await pool.end();
    console.log("  ✓ Ephemeral test workspaces cleaned up successfully");
  }
}

runDay5LeadIngestionTests();
