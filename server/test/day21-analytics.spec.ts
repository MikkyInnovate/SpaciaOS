import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as assert from "node:assert";
import { AppModule } from "../src/app.module";
import { AnalyticsService } from "../src/modules/analytics/analytics.service";
import { AppointmentsService } from "../src/modules/appointments/appointments.service";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { eq } from "drizzle-orm";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";

async function runDay21AnalyticsTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 21: OPERATIONAL ANALYTICS & FUNNEL SUITE");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const analyticsService = app.get<AnalyticsService>(AnalyticsService);
  const appointmentsService = app.get<AppointmentsService>(AppointmentsService);

  const timestamp = Date.now();
  const TEST_WS_DAY21 = `ws_day21_analytics_${timestamp}`;
  const TEST_WS_DAY21_OTHER = `ws_day21_other_${timestamp}`;

  const primaryTenant: TenantContext = {
    workspaceId: TEST_WS_DAY21,
    userId: "user_day21_primary",
    role: "owner",
    permissions: ["*"],
  };

  const otherTenant: TenantContext = {
    workspaceId: TEST_WS_DAY21_OTHER,
    userId: "user_day21_other",
    role: "owner",
    permissions: ["*"],
  };

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision isolated workspaces, property, leads & appointments
    // -------------------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated Day 21 workspaces, leads & appointments in Neon PostgreSQL...");

    await db.insert(schema.workspaces).values([
      { id: TEST_WS_DAY21, name: "Day 21 Luxury Realty", slug: TEST_WS_DAY21 },
      { id: TEST_WS_DAY21_OTHER, name: "Day 21 Isolated Workspace", slug: TEST_WS_DAY21_OTHER },
    ]);

    const [prop] = await db
      .insert(schema.properties)
      .values({
        workspaceId: TEST_WS_DAY21,
        slug: `prop-day21-${timestamp}`,
        title: "The Eko Atlantic Penthouse Suite",
        location: "Eko Atlantic City, Victoria Island, Lagos",
        propertyType: "penthouse",
        price: "850000000",
        formattedPrice: "₦850,000,000",
        availability: "Available",
      })
      .returning();

    // Insert leads covering the 8 lifecycle funnel stages:
    // 1. New (Leads)
    // 2. Contacting (Contacted)
    // 3. In Conversation (Conversations)
    // 4. Qualified (Qualified, score 74)
    // 5. Qualified HOT (Hot, score 95)
    // 6. Viewing Booked (Viewing Booked)
    // 7. Viewing Completed (via appointment)
    // 8. Won (Closed deal note)
    const [lead1] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY21,
        name: "Prospect One (New)",
        phone: "+2348031110001",
        status: "New",
        budget: "₦450,000,000",
      })
      .returning();

    const [lead2] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY21,
        name: "Prospect Two (Contacting)",
        phone: "+2348031110002",
        status: "Contacting",
        budget: "₦550,000,000",
      })
      .returning();

    const [lead3] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY21,
        name: "Prospect Three (In Conversation)",
        phone: "+2348031110003",
        status: "In Conversation",
        budget: "₦650,000,000",
      })
      .returning();

    const [lead4] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY21,
        name: "Prospect Four (Qualified WARM)",
        phone: "+2348031110004",
        status: "Qualified",
        score: 74,
        scoreCategory: "WARM",
        budget: "₦750,000,000",
      })
      .returning();

    const [lead5] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY21,
        name: "Prospect Five (Qualified HOT)",
        phone: "+2348031110005",
        status: "Qualified",
        score: 95,
        scoreCategory: "HOT",
        budget: "₦950,000,000",
      })
      .returning();

    const [lead6] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY21,
        name: "Prospect Six (Viewing Booked)",
        phone: "+2348031110006",
        status: "Viewing Booked",
        score: 92,
        scoreCategory: "HOT",
        budget: "₦1,200,000,000",
      })
      .returning();

    const [lead7] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY21,
        name: "Prospect Seven (Viewing Completed)",
        phone: "+2348031110007",
        status: "Viewing Booked",
        score: 96,
        scoreCategory: "HOT",
        budget: "₦1,500,000,000",
      })
      .returning();

    const [lead8] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY21,
        name: "Prospect Eight (Won / Closed)",
        phone: "+2348031110008",
        status: "Human Managed",
        score: 98,
        scoreCategory: "HOT",
        budget: "₦2,000,000,000",
        inboundNotes: "Won - Client wire transfer received for outright purchase",
      })
      .returning();

    // Create confirmed & completed appointments
    const apt1 = await appointmentsService.createAppointment(primaryTenant, {
      leadId: lead6.id,
      propertyId: prop.id,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      meetingType: "in_person_viewing",
      notes: "Private Inspection - Penthouse Suite",
    });

    const apt2 = await appointmentsService.createAppointment(primaryTenant, {
      leadId: lead7.id,
      propertyId: prop.id,
      startTime: new Date(Date.now() - 86400000).toISOString(),
      endTime: new Date(Date.now() - 86400000 + 3600000).toISOString(),
      meetingType: "in_person_viewing",
      notes: "VIP Walkthrough - Penthouse Suite",
    });

    await appointmentsService.updateStatus(primaryTenant, apt2.id, {
      status: "completed",
    });

    console.log("✔ [SETUP COMPLETE] Fixtures provisioned successfully.\n");

    // =========================================================================
    // TEST 1: Basic Conversion Funnel Aggregation (All 8 Stages)
    // =========================================================================
    console.log("▶ [TEST 1] Testing 8-Stage Conversion Funnel Aggregation...");
    const funnel = await analyticsService.getFunnel(primaryTenant);

    assert.ok(funnel, "Funnel response must be defined");
    assert.strictEqual(funnel.stages.length, 8, "Funnel must contain exactly 8 operational stages");
    assert.strictEqual(funnel.totalLeads, 8, "Total captured leads must be 8");

    const stageMap = new Map(funnel.stages.map((s) => [s.stage, s]));

    // 1. Leads
    const stageLeads = stageMap.get("leads");
    assert.ok(stageLeads, "Stage 'leads' must exist");
    assert.strictEqual(stageLeads.count, 8);
    assert.strictEqual(stageLeads.percentageOfTop, 100);

    // 2. Contacted (leads beyond 'New' = 7)
    const stageContacted = stageMap.get("contacted");
    assert.ok(stageContacted, "Stage 'contacted' must exist");
    assert.strictEqual(stageContacted.count, 7);

    // 3. Conversations (In Conversation, Qualified, Viewing Booked, Human Managed = 6)
    const stageConversations = stageMap.get("conversations");
    assert.ok(stageConversations, "Stage 'conversations' must exist");
    assert.strictEqual(stageConversations.count, 6);

    // 4. Qualified (Qualified, Viewing Booked, Human Managed with score >= 70 = 5)
    const stageQualified = stageMap.get("qualified");
    assert.ok(stageQualified, "Stage 'qualified' must exist");
    assert.strictEqual(stageQualified.count, 5);

    // 5. Hot (score >= 85 or category HOT = 4: leads 5, 6, 7, 8)
    const stageHot = stageMap.get("hot");
    assert.ok(stageHot, "Stage 'hot' must exist");
    assert.strictEqual(stageHot.count, 4);

    // 6. Viewing Booked (leads 6, 7 = 2)
    const stageViewingBooked = stageMap.get("viewing_booked");
    assert.ok(stageViewingBooked, "Stage 'viewing_booked' must exist");
    assert.ok(stageViewingBooked.count >= 2, "Viewing booked must count at least 2");

    // 7. Viewing Completed (completed appointment = 1)
    const stageViewingCompleted = stageMap.get("viewing_completed");
    assert.ok(stageViewingCompleted, "Stage 'viewing_completed' must exist");
    assert.strictEqual(stageViewingCompleted.count, 1);

    // 8. Won (lead 8 = 1)
    const stageWon = stageMap.get("won");
    assert.ok(stageWon, "Stage 'won' must exist");
    assert.strictEqual(stageWon.count, 1);

    console.log("✔ [TEST 1 PASSED] All 8 funnel stages correctly aggregated from live PostgreSQL data.\n");

    // =========================================================================
    // TEST 2: Step-to-Step Conversion & Drop-off Calculations
    // =========================================================================
    console.log("▶ [TEST 2] Verifying Step Conversion & Drop-off Rates...");
    funnel.stages.forEach((stage) => {
      assert.ok(stage.percentageOfTop <= 100 && stage.percentageOfTop >= 0);
      assert.ok(stage.stepConversionRate <= 100 && stage.stepConversionRate >= 0);
      assert.ok(stage.dropOffCount >= 0);
      assert.ok(stage.dropOffRate <= 100 && stage.dropOffRate >= 0);
    });

    assert.strictEqual(funnel.wonCount, 1);
    assert.strictEqual(funnel.overallConversionRate, 12.5); // 1 / 8 = 12.5%

    console.log(`✔ [TEST 2 PASSED] Overall Conversion Rate verified: ${funnel.overallConversionRate}%.\n`);

    // =========================================================================
    // TEST 3: Overview Metrics & Pipeline Potential Aggregation
    // =========================================================================
    console.log("▶ [TEST 3] Testing Overview Metrics & Pipeline Capital Valuation...");
    const metrics = await analyticsService.getOverviewMetrics(primaryTenant);

    assert.ok(metrics, "Metrics response must be defined");
    assert.strictEqual(metrics.grossInbound.numericValue, 8);
    assert.strictEqual(metrics.bookedViewings.numericValue, 2);
    assert.ok(metrics.pipelinePotential.rawNaira > 0, "Pipeline potential must be positive");
    assert.ok(metrics.pipelinePotential.value.includes("₦"), "Formatted value must include Naira sign");
    assert.ok(metrics.speedToLead.value.length > 0, "Speed to lead must be computed");

    console.log(`✔ [TEST 3 PASSED] Total Pipeline Potential: ${metrics.pipelinePotential.value} across ${metrics.grossInbound.value} leads.\n`);

    // =========================================================================
    // TEST 4: 11. DAY 21 CHECKPOINT — Complete 17-Point Operational Path
    // =========================================================================
    console.log("▶ [TEST 4] Validating 11. DAY 21 CHECKPOINT (17-Point Revenue Path)...");
    const revenuePath = await analyticsService.getRevenuePath(primaryTenant);

    assert.strictEqual(revenuePath.totalNodes, 17, "Revenue path must encompass all 17 operational stages");
    assert.strictEqual(revenuePath.operationalNodes, 17, "All 17 stages must be certified operational");
    assert.strictEqual(revenuePath.readinessPercentage, 100, "System readiness must be 100%");

    const expectedKeys = [
      "website_lead",
      "spacia_core",
      "ai_contact",
      "conversation",
      "verified_property_data",
      "qualification",
      "score",
      "call",
      "transcript",
      "summary",
      "follow_up",
      "viewing_request",
      "calendar_availability",
      "viewing_booking",
      "email_confirmation",
      "sales_notification",
      "human_handoff",
    ];

    expectedKeys.forEach((key, index) => {
      const node = revenuePath.nodes.find((n) => n.key === key);
      assert.ok(node, `Node '${key}' must exist in revenue path`);
      assert.strictEqual(node.step, index + 1);
      assert.strictEqual(node.status, "operational");
      assert.ok(node.eventsRecorded > 0, `Node '${key}' must have recorded live telemetry events`);
    });

    console.log("✔ [TEST 4 PASSED] 11. DAY 21 CHECKPOINT: Complete 17-point revenue path fully certified (100% operational).\n");

    // =========================================================================
    // TEST 5: Multi-Tenant Analytics Isolation
    // =========================================================================
    console.log("▶ [TEST 5] Testing Multi-Tenant Analytics Isolation...");
    const otherFunnel = await analyticsService.getFunnel(otherTenant);

    assert.strictEqual(otherFunnel.totalLeads, 0, "Other workspace must have 0 leads");
    assert.strictEqual(otherFunnel.wonCount, 0, "Other workspace must have 0 won deals");

    const otherMetrics = await analyticsService.getOverviewMetrics(otherTenant);
    assert.strictEqual(otherMetrics.grossInbound.numericValue, 0, "Other workspace must have 0 inbound leads");

    console.log("✔ [TEST 5 PASSED] Multi-tenant isolation verified: zero cross-tenant metrics leakage.\n");

    console.log("=========================================================");
    console.log(" ALL DAY 21 OPERATIONAL ANALYTICS TESTS PASSED (5/5 - 100%)");
    console.log("=========================================================\n");

  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN: Purge isolated test fixtures
    // -------------------------------------------------------------------------
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      await db.delete(schema.notifications).where(eq(schema.notifications.workspaceId, TEST_WS_DAY21));
      await db.delete(schema.systemEvents).where(eq(schema.systemEvents.workspaceId, TEST_WS_DAY21));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, TEST_WS_DAY21));
      await db.delete(schema.appointments).where(eq(schema.appointments.workspaceId, TEST_WS_DAY21));
      await db.delete(schema.leads).where(eq(schema.leads.workspaceId, TEST_WS_DAY21));
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, TEST_WS_DAY21));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY21));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY21_OTHER));
      console.log("✔ [TEARDOWN COMPLETE] Test fixtures purged.\n");
    } catch (err) {
      console.warn("Teardown warning:", (err as Error).message);
    }
    await app.close();
  }
}

runDay21AnalyticsTests().catch((err) => {
  console.error("\n❌ DAY 21 TEST FAILED:", err);
  process.exit(1);
});
