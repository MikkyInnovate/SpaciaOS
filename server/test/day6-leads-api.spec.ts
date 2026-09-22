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
import { eq, inArray } from "drizzle-orm";

config({ path: "./.env" });
neonConfig.webSocketConstructor = ws;

process.env.ALLOW_MOCK_AUTH = "true";
process.env.NODE_ENV = "test";

async function runDay6LeadsApiTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 6: LEAD MANAGEMENT & LIFECYCLE API VERIFICATION");
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
  const ws1 = `ws_day6_alpha_${timestamp}`;
  const ws1Slug = `alpha-realty-${timestamp}`;
  const ws2 = `ws_day6_beta_${timestamp}`;
  const ws2Slug = `beta-realty-${timestamp}`;

  const user1 = `user_day6_admin_${timestamp}`;
  const user2 = `user_day6_beta_${timestamp}`;

  const authHeaderA = {
    Authorization: `Bearer mock_token_${user1}:${ws1}:admin:${ws1Slug}`,
    "X-Workspace-Id": ws1,
    "Content-Type": "application/json",
  };

  const authHeaderB = {
    Authorization: `Bearer mock_token_${user2}:${ws2}:admin:${ws2Slug}`,
    "X-Workspace-Id": ws2,
    "Content-Type": "application/json",
  };

  let lead1Id = "";
  let lead2Id = "";
  let lead3Id = "";
  let leadBId = "";

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision isolated test workspaces, users, properties, and leads
    // -------------------------------------------------------------------------
    console.log("1. PROVISIONING ISOLATED TEST WORKSPACES, PROPERTIES & LEADS...");
    await db.insert(schema.workspaces).values([
      { id: ws1, name: "Alpha Luxury Estates", slug: ws1Slug, tier: "enterprise" },
      { id: ws2, name: "Beta Waterfront Realty", slug: ws2Slug, tier: "growth" },
    ]);

    await db.insert(schema.users).values([
      { id: user1, email: `admin_${timestamp}@alpha.local`, firstName: "Tunde", lastName: "Admin" },
      { id: user2, email: `admin_${timestamp}@beta.local`, firstName: "Emeka", lastName: "Admin" },
    ]);

    await db.insert(schema.workspaceMembers).values([
      { workspaceId: ws1, userId: user1, role: "admin" },
      { workspaceId: ws2, userId: user2, role: "admin" },
    ]);

    const [prop1] = await db
      .insert(schema.properties)
      .values({
        workspaceId: ws1,
        slug: `ikoyi-penthouse-${timestamp}`,
        title: "The Bellagio High-Rise Penthouse",
        location: "Bouridllon Road, Ikoyi",
        city: "Ikoyi",
        state: "Lagos State",
        propertyType: "Penthouse",
        price: "1500000000.00",
        formattedPrice: "₦1,500,000,000",
        bedrooms: 4,
        bathrooms: 5,
        squareMeters: 620,
        availability: "Available",
        verificationStatus: "Verified",
      })
      .returning();

    const [agent1] = await db
      .insert(schema.agents)
      .values({
        workspaceId: ws1,
        name: "Babajide Broker",
        email: `broker_${timestamp}@alpha.local`,
        phone: "+2348021112233",
        roleTitle: "Luxury Specialist",
      })
      .returning();

    // Insert 3 test leads in Workspace A
    const [l1] = await db
      .insert(schema.leads)
      .values({
        workspaceId: ws1,
        propertyId: prop1.id,
        assignedAgentId: agent1.id,
        name: "Chief Olusegun Adeleke",
        phone: "+2348031234567",
        email: "olusegun.adeleke@enterprise.ng",
        budget: "₦1,600,000,000",
        score: 92,
        scoreCategory: "HOT",
        status: "New",
        intent: "Purchase",
        timeline: "Within 30 Days",
        source: "website",
        nextAction: "Initial consultation call",
        locationPreference: "Ikoyi",
      })
      .returning();
    lead1Id = l1.id;

    const [l2] = await db
      .insert(schema.leads)
      .values({
        workspaceId: ws1,
        name: "Dr. Amina Bello",
        phone: "+2348099887766",
        email: "amina.bello@lagosmed.ng",
        budget: "₦850,000,000",
        score: 74,
        scoreCategory: "WARM",
        status: "Qualified",
        intent: "Investment",
        timeline: "60 Days",
        source: "meta_ads",
        nextAction: "Send brochure",
        locationPreference: "Victoria Island",
      })
      .returning();
    lead2Id = l2.id;

    const [l3] = await db
      .insert(schema.leads)
      .values({
        workspaceId: ws1,
        name: "Femi Otedola Jr.",
        phone: "+2347011223344",
        email: "femi.jr@capital.ng",
        budget: "₦500,000,000",
        score: 45,
        scoreCategory: "COLD",
        status: "Nurture",
        intent: "Purchase",
        timeline: "Flexible",
        source: "referral",
        nextAction: "Follow up next quarter",
        locationPreference: "Epe Expressway",
      })
      .returning();
    lead3Id = l3.id;

    // Insert 1 lead in Workspace B (for tenant isolation testing)
    const [lB] = await db
      .insert(schema.leads)
      .values({
        workspaceId: ws2,
        name: "Alhaji Ibrahim Musa",
        phone: "+2348055443322",
        email: "ibrahim@musa-holdings.ng",
        budget: "₦2,000,000,000",
        score: 95,
        scoreCategory: "HOT",
        status: "New",
        intent: "Purchase",
        timeline: "Immediate",
        source: "direct_call",
      })
      .returning();
    leadBId = lB.id;

    // Insert initial score and qualification for Lead 1
    await db.insert(schema.leadScores).values({
      workspaceId: ws1,
      leadId: lead1Id,
      score: 92,
      scoreCategory: "HOT",
      budgetScore: 25,
      authorityScore: 25,
      needScore: 22,
      timelineScore: 20,
      propertyFitScore: 20,
      factors: {
        budgetNote: "Verified liquid budget above asking price",
        authorityNote: "Sole buyer and principal investor",
      },
    });

    await db.insert(schema.qualificationResults).values({
      workspaceId: ws1,
      leadId: lead1Id,
      confidenceScore: 92,
      buyerIntent: "high_purchase_intent",
      decisionReadiness: "immediate_close",
      motivation: "Looking to acquire an executive residence before end of quarter.",
      timelineWindow: "< 30 days",
      timelineUrgency: "urgent",
      budgetDeclared: "₦1,600,000,000",
      budgetVerifiedLiquidity: "₦2,000,000,000",
      paymentStructure: "Outright",
      objections: [],
      intentSignals: [{ category: "commercial", signal: "Fast close", strength: "strong" }],
    });

    console.log("  ✓ Test workspaces, users, properties, and leads provisioned in Neon");

    // -------------------------------------------------------------------------
    // 2. GET /api/v1/leads — List all leads with pagination
    // -------------------------------------------------------------------------
    console.log("\n2. TESTING GET /api/v1/leads (PAGINATION & DTO FORMAT)...");
    const listRes = await fetch(`${baseUrl}/leads?page=1&limit=2`, {
      method: "GET",
      headers: authHeaderA,
    });

    assert.strictEqual(listRes.status, 200, "Should return 200 OK");
    const listJson = await listRes.json();
    assert.strictEqual(listJson.success, true);
    assert.strictEqual(listJson.data.total, 3, "Total leads in ws1 should be 3");
    assert.strictEqual(listJson.data.leads.length, 2, "Page 1 limit 2 should return exactly 2 items");
    assert.strictEqual(listJson.data.totalPages, 2, "3 total items with limit 2 gives 2 pages");

    // Check DTO shape: verify no database-internal column leakage
    const firstLead = listJson.data.leads[0];
    assert.ok(firstLead.id, "DTO must have id");
    assert.ok(firstLead.name, "DTO must have name");
    assert.ok(firstLead.propertyTitle, "DTO must have propertyTitle mapped");
    assert.ok(firstLead.location, "DTO must have location mapped");
    assert.ok(firstLead.scoreCategory, "DTO must have scoreCategory");
    assert.strictEqual(firstLead.workspaceId, undefined, "DTO should NOT leak raw internal workspaceId column");
    console.log("  ✓ Paginated leads returned matching frontend DTO contract");

    // -------------------------------------------------------------------------
    // 3. GET /api/v1/leads — Search filtering
    // -------------------------------------------------------------------------
    console.log("\n3. TESTING SEARCH FILTERING...");
    // Search by name
    const searchNameRes = await fetch(`${baseUrl}/leads?search=Adeleke`, {
      method: "GET",
      headers: authHeaderA,
    });
    const searchNameJson = await searchNameRes.json();
    assert.strictEqual(searchNameJson.data.total, 1);
    assert.strictEqual(searchNameJson.data.leads[0].name, "Chief Olusegun Adeleke");

    // Search by phone
    const searchPhoneRes = await fetch(`${baseUrl}/leads?search=08099887766`, {
      method: "GET",
      headers: authHeaderA,
    });
    const searchPhoneJson = await searchPhoneRes.json();
    assert.strictEqual(searchPhoneJson.data.total, 1);
    assert.strictEqual(searchPhoneJson.data.leads[0].name, "Dr. Amina Bello");
    console.log("  ✓ Search filter verified across name and phone");

    // -------------------------------------------------------------------------
    // 4. GET /api/v1/leads — Status & Score Category filtering
    // -------------------------------------------------------------------------
    console.log("\n4. TESTING STATUS & SCORE CATEGORY FILTERING...");
    const statusRes = await fetch(`${baseUrl}/leads?status=Qualified`, {
      method: "GET",
      headers: authHeaderA,
    });
    const statusJson = await statusRes.json();
    assert.strictEqual(statusJson.data.total, 1);
    assert.strictEqual(statusJson.data.leads[0].status, "Qualified");

    const scoreRes = await fetch(`${baseUrl}/leads?scoreCategory=HOT`, {
      method: "GET",
      headers: authHeaderA,
    });
    const scoreJson = await scoreRes.json();
    assert.strictEqual(scoreJson.data.total, 1);
    assert.strictEqual(scoreJson.data.leads[0].scoreCategory, "HOT");
    console.log("  ✓ Filtering by status and scoreCategory verified");

    // -------------------------------------------------------------------------
    // 5. TENANT ISOLATION
    // -------------------------------------------------------------------------
    console.log("\n5. TESTING TENANT ISOLATION...");
    // Workspace B user should only see their 1 lead
    const wsBListRes = await fetch(`${baseUrl}/leads`, {
      method: "GET",
      headers: authHeaderB,
    });
    const wsBListJson = await wsBListRes.json();
    assert.strictEqual(wsBListJson.data.total, 1, "Workspace B should only see 1 lead");
    assert.strictEqual(wsBListJson.data.leads[0].name, "Alhaji Ibrahim Musa");

    // Workspace A user attempting to fetch Workspace B lead directly by ID
    const crossTenantGet = await fetch(`${baseUrl}/leads/${leadBId}`, {
      method: "GET",
      headers: authHeaderA,
    });
    assert.strictEqual(crossTenantGet.status, 404, "Cross-tenant lead fetch must return 404 Not Found");

    // Workspace B user attempting to update Workspace A lead
    const crossTenantPatch = await fetch(`${baseUrl}/leads/${lead1Id}/status`, {
      method: "PATCH",
      headers: authHeaderB,
      body: JSON.stringify({ status: "Qualified" }),
    });
    assert.strictEqual(crossTenantPatch.status, 404, "Cross-tenant status update must return 404 Not Found");
    console.log("  ✓ Strict tenant isolation verified across list, detail, and mutations");

    // -------------------------------------------------------------------------
    // 6. GET /api/v1/leads/:id — Detail dossier fetch
    // -------------------------------------------------------------------------
    console.log("\n6. TESTING GET /api/v1/leads/:id (DEEP DOSSIER DTO)...");
    const detailRes = await fetch(`${baseUrl}/leads/${lead1Id}`, {
      method: "GET",
      headers: authHeaderA,
    });
    assert.strictEqual(detailRes.status, 200);
    const detailJson = await detailRes.json();
    const leadDetail = detailJson.data;

    assert.strictEqual(leadDetail.id, lead1Id);
    assert.strictEqual(leadDetail.name, "Chief Olusegun Adeleke");
    assert.strictEqual(leadDetail.assignedBroker, "Babajide Broker");
    assert.ok(leadDetail.propertyDetails, "Must include propertyDetails");
    assert.strictEqual(leadDetail.propertyDetails.propertyTitle, "The Bellagio High-Rise Penthouse");
    assert.ok(leadDetail.bantBreakdown, "Must include bantBreakdown");
    assert.strictEqual(leadDetail.bantBreakdown.budgetScore, 25);
    assert.ok(leadDetail.qualificationProfile, "Must include qualificationProfile");
    assert.strictEqual(leadDetail.qualificationProfile.confidenceScore, 92);
    console.log("  ✓ Deep lead dossier returned with linked property, agent, score, and qualification");

    // -------------------------------------------------------------------------
    // 7. PATCH /api/v1/leads/:id/status — Status update & audit event
    // -------------------------------------------------------------------------
    console.log("\n7. TESTING PATCH /api/v1/leads/:id/status (STATUS & AUDIT LOG)...");
    const patchRes = await fetch(`${baseUrl}/leads/${lead1Id}/status`, {
      method: "PATCH",
      headers: authHeaderA,
      body: JSON.stringify({
        status: "Qualified",
        note: "Verified financial readiness and scheduled viewing consultation.",
      }),
    });
    assert.strictEqual(patchRes.status, 200);
    const patchJson = await patchRes.json();
    assert.strictEqual(patchJson.data.status, "Qualified");

    // Verify audit event inserted into lead_events
    const [auditEvent] = await db
      .select()
      .from(schema.leadEvents)
      .where(eq(schema.leadEvents.leadId, lead1Id))
      .orderBy(schema.leadEvents.createdAt);

    assert.ok(auditEvent, "Status change event must exist in lead_events");
    assert.strictEqual(auditEvent.type, "status_change");
    assert.strictEqual(auditEvent.title, "Status updated to Qualified");
    assert.strictEqual((auditEvent.metadata as any).previousStatus, "New");
    assert.strictEqual((auditEvent.metadata as any).newStatus, "Qualified");
    console.log("  ✓ Status successfully updated and immutable status_change event created");

    // -------------------------------------------------------------------------
    // 8. Management mode transition to Human Managed
    // -------------------------------------------------------------------------
    console.log("\n8. TESTING MANAGEMENT MODE AUTOMATION (HUMAN MANAGED)...");
    const humanRes = await fetch(`${baseUrl}/leads/${lead1Id}/status`, {
      method: "PATCH",
      headers: authHeaderA,
      body: JSON.stringify({
        status: "Human Managed",
        note: "Broker manual takeover requested by Chief Adeleke.",
      }),
    });
    assert.strictEqual(humanRes.status, 200);
    const humanJson = await humanRes.json();
    assert.strictEqual(humanJson.data.status, "Human Managed");
    assert.strictEqual(humanJson.data.managementMode, "human_managed");
    assert.strictEqual(humanJson.data.isAiStopped, true);
    console.log("  ✓ Transition to Human Managed correctly set managementMode and isAiStopped = true");

    // -------------------------------------------------------------------------
    // 9. POST /api/v1/leads/:id/activities — Activity creation
    // -------------------------------------------------------------------------
    console.log("\n9. TESTING POST /api/v1/leads/:id/activities...");
    const activityRes = await fetch(`${baseUrl}/leads/${lead1Id}/activities`, {
      method: "POST",
      headers: authHeaderA,
      body: JSON.stringify({
        type: "human_note",
        title: "Broker Memo: Inspection Logistics",
        description: "Confirmed private chauffeur arrival at Bouridllon Gate 2 for 2:30 PM.",
        channel: "in_person",
        metadata: { viewingDate: "2026-09-25T14:30:00Z" },
      }),
    });
    assert.strictEqual(activityRes.status, 201);
    const activityJson = await activityRes.json();
    assert.strictEqual(activityJson.data.type, "human_note");
    assert.strictEqual(activityJson.data.title, "Broker Memo: Inspection Logistics");
    console.log("  ✓ Lead activity event successfully recorded on timeline");

    // -------------------------------------------------------------------------
    // 10. GET /api/v1/leads/:id/activities — Activities retrieval
    // -------------------------------------------------------------------------
    console.log("\n10. TESTING GET /api/v1/leads/:id/activities...");
    const getActivitiesRes = await fetch(`${baseUrl}/leads/${lead1Id}/activities`, {
      method: "GET",
      headers: authHeaderA,
    });
    assert.strictEqual(getActivitiesRes.status, 200);
    const getActivitiesJson = await getActivitiesRes.json();
    assert.ok(getActivitiesJson.data.activities.length >= 2, "Should contain status_change and human_note events");
    assert.strictEqual(getActivitiesJson.data.total >= 2, true);
    console.log("  ✓ Lead activities timeline retrieved chronologically");

    console.log("\n=========================================================");
    console.log(" ALL DAY 6 LEAD MANAGEMENT API TESTS PASSED (100%)");
    console.log("=========================================================\n");
  } finally {
    console.log("Cleaning up ephemeral test workspaces...");
    try {
      await db.delete(schema.workspaces).where(inArray(schema.workspaces.id, [ws1, ws2]));
      console.log("  ✓ Ephemeral test workspaces cleaned up successfully");
    } catch (cleanupErr) {
      console.warn("  ! Cleanup warning:", cleanupErr);
    }
    await app.close();
    await pool.end();
  }
}

runDay6LeadsApiTests().catch((err) => {
  console.error("\n❌ DAY 6 LEADS API TESTS FAILED:", err);
  process.exit(1);
});
