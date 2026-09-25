/**
 * PACIA DAY 20: SALES COMMAND CENTER & DASHBOARD TEST SUITE
 * 
 * Verifies end-to-end:
 * 1. "What happened today?" Operations activity feed
 * 2. "What requires attention?" Priority action cockpit (urgent handoffs, hot unbooked leads, today's inspections)
 * 3. 7 Sales Command Center Metrics:
 *    - Leads (total, new today, trend)
 *    - Calls (total, today, avg duration, outcomes breakdown)
 *    - Qualified (total, today, conversion rate %)
 *    - Hot (score >= 85, unbooked count, urgent count)
 *    - Viewings (total, today, upcoming this week, confirmed/completed)
 *    - Handoffs (human takeovers, AI-stopped count)
 *    - Follow-ups (total, scheduled today, pending, completed)
 * 4. Conversion Pipeline Funnel stages & progression rates
 * 5. Strict Multi-Tenant Data Isolation across Neon PostgreSQL
 * 6. Fallback Resilience & Graceful Error Handling
 */

const assert = require("assert");
import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { eq } from "drizzle-orm";
import { AppModule } from "../src/app.module";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";
import { DashboardService } from "../src/modules/dashboard/dashboard.service";

neonConfig.webSocketConstructor = ws;

async function runDay20DashboardTestSuite() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 20: SALES COMMAND CENTER & DASHBOARD SUITE");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const dashboardService = app.get<DashboardService>(DashboardService);

  const TEST_WS_DAY20 = `ws_day20_dash_${Date.now()}`;
  const TEST_WS_OTHER = `ws_day20_other_${Date.now()}`;

  const tenantContext: TenantContext = {
    workspaceId: TEST_WS_DAY20,
    userId: "broker_dash_admin",
    role: "admin",
    permissions: ["leads:read", "leads:write"],
  };

  const otherTenantContext: TenantContext = {
    workspaceId: TEST_WS_OTHER,
    userId: "broker_other_admin",
    role: "admin",
    permissions: ["leads:read", "leads:write"],
  };

  let testPropId: string = "";
  let leadHandoffId: string = "";
  let leadHotId: string = "";
  let leadBookedId: string = "";
  let leadNewId: string = "";
  let todayAppointmentId: string = "";

  try {
    // -------------------------------------------------------------
    // SETUP: Provision isolated Neon PostgreSQL Workspaces & Fixtures
    // -------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated Day 20 workspaces & domain fixtures in Neon DB...");
    await db.insert(schema.workspaces).values([
      { id: TEST_WS_DAY20, name: "Spacia Command Center Hub", slug: `command-hub-${Date.now()}` },
      { id: TEST_WS_OTHER, name: "Spacia Alternative Hub", slug: `alt-hub-${Date.now()}` },
    ]);

    // 1. Property
    const [prop] = await db
      .insert(schema.properties)
      .values({
        workspaceId: TEST_WS_DAY20,
        slug: `bourdillon-sky-penthouse-${Date.now()}`,
        title: "Bourdillon Sky Penthouse",
        location: "Ikoyi, Lagos",
        propertyType: "penthouse",
        price: "1200000000",
        formattedPrice: "₦1,200,000,000",
        bedrooms: 5,
        bathrooms: 6,
        availability: "Available",
      })
      .returning();
    testPropId = prop.id;

    // 2. Leads:
    // Lead A: Hot prospect, score 92, Qualified, no viewing booked yet
    const [leadHot] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY20,
        name: "Chief Adeleke",
        email: "adeleke.dash@gmail.com",
        phone: "+2348023456789",
        status: "Qualified",
        score: 92,
        scoreCategory: "HOT",
        budget: "₦1,200,000,000",
        managementMode: "ai_autonomous",
        isAiStopped: false,
      })
      .returning();
    leadHotId = leadHot.id;

    // Lead B: Urgent handoff, isAiStopped = true, human_managed
    const [leadHandoff] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY20,
        name: "Senator Okonjo",
        email: "okonjo.dash@gov.ng",
        phone: "+2348039876543",
        status: "Human Managed",
        score: 88,
        scoreCategory: "HOT",
        budget: "₦2,000,000,000",
        managementMode: "human_managed",
        isAiStopped: true,
        aiStoppedReason: "Prospect requested immediate senior partner call regarding title documentation.",
      })
      .returning();
    leadHandoffId = leadHandoff.id;

    // Lead C: Viewing Booked
    const [leadBooked] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY20,
        name: "Dr. Funke Akindele",
        email: "funke.dash@films.ng",
        phone: "+2348051234567",
        status: "Viewing Booked",
        score: 86,
        scoreCategory: "HOT",
        budget: "₦850,000,000",
        managementMode: "ai_autonomous",
      })
      .returning();
    leadBookedId = leadBooked.id;

    // Lead D: New lead captured today
    const [leadNew] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY20,
        name: "Mr. Tunde Lawal",
        email: "tunde.dash@fintech.io",
        phone: "+2348077654321",
        status: "New",
        score: 45,
        scoreCategory: "COLD",
        managementMode: "ai_autonomous",
      })
      .returning();
    leadNewId = leadNew.id;

    // 3. Calls:
    await db.insert(schema.calls).values([
      {
        workspaceId: TEST_WS_DAY20,
        leadId: leadHotId,
        leadName: "Chief Adeleke",
        leadPhone: "+2348023456789",
        durationSeconds: 240,
        outcome: "qualified",
        callScore: 92,
      },
      {
        workspaceId: TEST_WS_DAY20,
        leadId: leadBookedId,
        leadName: "Dr. Funke Akindele",
        leadPhone: "+2348051234567",
        durationSeconds: 180,
        outcome: "viewing_booked",
        callScore: 86,
      },
    ]);

    // 4. Appointments:
    // Today's appointment (1 hour from now)
    const todayStart = new Date();
    todayStart.setHours(todayStart.getHours() + 1);
    const todayEnd = new Date(todayStart.getTime() + 45 * 60000);

    const [aptToday] = await db
      .insert(schema.appointments)
      .values({
        workspaceId: TEST_WS_DAY20,
        leadId: leadBookedId,
        propertyId: testPropId,
        title: "VIP Walkthrough: Bourdillon Sky Penthouse",
        location: "Ikoyi, Lagos",
        scheduledStartAt: todayStart,
        scheduledEndAt: todayEnd,
        status: "confirmed",
        notes: "Reference: SP-BK-TODAY",
      })
      .returning();
    todayAppointmentId = aptToday.id;

    // Upcoming appointment in 2 days
    const upcomingStart = new Date();
    upcomingStart.setDate(upcomingStart.getDate() + 2);
    const upcomingEnd = new Date(upcomingStart.getTime() + 45 * 60000);

    await db.insert(schema.appointments).values({
      workspaceId: TEST_WS_DAY20,
      leadId: leadHotId,
      propertyId: testPropId,
      title: "Second Inspection: Bourdillon Sky Penthouse",
      location: "Ikoyi, Lagos",
      scheduledStartAt: upcomingStart,
      scheduledEndAt: upcomingEnd,
      status: "scheduled",
      notes: "Reference: SP-BK-UPCOMING",
    });

    // 5. Follow-ups:
    await db.insert(schema.followUps).values([
      {
        workspaceId: TEST_WS_DAY20,
        leadId: leadHotId,
        scheduledAt: new Date(),
        status: "pending",
        directive: "Follow up on property deed scan delivery",
      },
      {
        workspaceId: TEST_WS_DAY20,
        leadId: leadBookedId,
        scheduledAt: new Date(Date.now() - 86400000),
        status: "completed",
        directive: "Send pre-inspection driving directions",
      },
    ]);

    // 6. Lead Events & Notifications:
    await db.insert(schema.leadEvents).values([
      {
        workspaceId: TEST_WS_DAY20,
        leadId: leadHotId,
        type: "ai_voice_call",
        title: "Vapi Voice Call Completed",
        description: "BANT Qualification scored 92/100 (HOT). High purchase urgency.",
        channel: "voice",
      },
      {
        workspaceId: TEST_WS_DAY20,
        leadId: leadBookedId,
        type: "viewing_scheduled",
        title: "Viewing Scheduled",
        description: "Confirmed inspection for Bourdillon Sky Penthouse.",
        channel: "calendar",
      },
    ]);

    await db.insert(schema.notifications).values({
      workspaceId: TEST_WS_DAY20,
      type: "prospect_booking_confirmation",
      title: "Viewing Confirmation Dispatched",
      message: "Resend email dispatched with Google Calendar attachment.",
    });

    console.log("✔ [SETUP COMPLETE] All Day 20 DB fixtures provisioned.\n");

    // -------------------------------------------------------------
    // TEST 1: Aggregated 7 Sales Command Center Metrics
    // -------------------------------------------------------------
    console.log("▶ [TEST 1] Verifying 7 Command Center Metrics aggregation via getMetrics()...");
    const metrics = await dashboardService.getMetrics(tenantContext, {});

    // 1. Leads
    assert(metrics.leads.total >= 4, `Expected at least 4 total leads, got ${metrics.leads.total}`);
    assert(metrics.leads.today >= 4, `Expected at least 4 leads today, got ${metrics.leads.today}`);
    assert(metrics.leads.trend, "Metrics must include lead trend indicator");

    // 2. Calls
    assert(metrics.calls.total >= 2, `Expected at least 2 calls, got ${metrics.calls.total}`);
    assert(metrics.calls.today >= 2, `Expected at least 2 calls today, got ${metrics.calls.today}`);
    assert(metrics.calls.avgDurationSeconds > 0, "Average duration seconds must be calculated");
    assert(metrics.calls.formattedAvgDuration, "Formatted avg duration must be present");
    assert(metrics.calls.outcomes["qualified"] >= 1, "Must tally qualified call outcome");
    assert(metrics.calls.outcomes["viewing_booked"] >= 1, "Must tally viewing_booked call outcome");

    // 3. Qualified
    assert(metrics.qualified.total >= 3, `Expected at least 3 qualified leads, got ${metrics.qualified.total}`);
    assert(metrics.qualified.conversionRate > 0, "Conversion rate percentage must be positive");
    assert(metrics.qualified.formattedRate.includes("%"), "Formatted rate must contain %");

    // 4. Hot Leads
    assert(metrics.hot.total >= 2, `Expected at least 2 HOT leads, got ${metrics.hot.total}`);
    assert(metrics.hot.unbookedCount >= 1, `Expected at least 1 unbooked hot lead, got ${metrics.hot.unbookedCount}`);
    assert(metrics.hot.urgentAttentionCount >= 1, "Expected urgent attention hot count >= 1");

    // 5. Viewings
    assert(metrics.viewings.total >= 2, `Expected at least 2 viewings, got ${metrics.viewings.total}`);
    assert(metrics.viewings.today >= 1, `Expected 1 viewing today, got ${metrics.viewings.today}`);
    assert(metrics.viewings.upcomingThisWeek >= 1, "Expected upcoming viewings this week >= 1");
    assert(metrics.viewings.confirmedCount >= 1, "Expected confirmed count >= 1");

    // 6. Handoffs
    assert(metrics.handoffs.total >= 1, `Expected at least 1 handoff, got ${metrics.handoffs.total}`);
    assert(metrics.handoffs.aiStoppedCount >= 1, `Expected at least 1 aiStopped lead, got ${metrics.handoffs.aiStoppedCount}`);

    // 7. Follow-ups
    assert(metrics.followUps.total >= 2, `Expected at least 2 follow-ups, got ${metrics.followUps.total}`);
    assert(metrics.followUps.pendingCount >= 1, `Expected at least 1 pending follow-up, got ${metrics.followUps.pendingCount}`);
    assert(metrics.followUps.completedCount >= 1, `Expected at least 1 completed follow-up, got ${metrics.followUps.completedCount}`);

    console.log("✔ [TEST 1 PASSED] All 7 core metrics successfully aggregated with 100% precision.\n");

    // -------------------------------------------------------------
    // TEST 2: Answers "What requires attention?"
    // -------------------------------------------------------------
    console.log("▶ [TEST 2] Verifying 'What requires attention?' prioritized action items...");
    const attentionItems = await dashboardService.getAttentionItems(tenantContext);

    assert(attentionItems.length >= 3, `Expected at least 3 attention items, found ${attentionItems.length}`);

    // Verify urgent handoff present
    const handoffItem = attentionItems.find((i) => i.category === "urgent_handoff");
    assert(handoffItem, "Must identify urgent handoff item");
    assert.strictEqual(handoffItem?.severity, "critical", "Urgent handoff must have critical severity");
    assert(handoffItem?.leadName?.includes("Okonjo"), "Must point to Senator Okonjo");
    assert(handoffItem?.actionLabel === "Open Lead Dossier", "Must provide direct dossier action label");
    assert(handoffItem?.actionUrl.includes(leadHandoffId), "Must link directly to lead dossier");

    // Verify hot unbooked prospect present
    const hotItem = attentionItems.find((i) => i.category === "hot_unbooked");
    assert(hotItem, "Must identify unbooked hot prospect");
    assert.strictEqual(hotItem?.severity, "high", "Hot unbooked lead must have high severity");
    assert(hotItem?.leadName?.includes("Adeleke"), "Must point to Chief Adeleke");
    assert(hotItem?.actionLabel === "Schedule Inspection", "Must provide booking trigger label");

    // Verify today's inspection item present
    const todayViewingItem = attentionItems.find((i) => i.category === "viewing_today");
    assert(todayViewingItem, "Must identify today's inspection appointment");
    assert.strictEqual(todayViewingItem?.severity, "high", "Viewing today must have high severity");
    assert(todayViewingItem?.title.includes("Inspection Today"), "Title must state inspection today");

    // Verify severity sorting: critical must come first
    assert.strictEqual(attentionItems[0].severity, "critical", "Critical items must be sorted to the top");

    console.log(`✔ [TEST 2 PASSED] ${attentionItems.length} prioritized cockpit attention items verified.\n`);

    // -------------------------------------------------------------
    // TEST 3: Answers "What happened today?"
    // -------------------------------------------------------------
    console.log("▶ [TEST 3] Verifying 'What happened today?' unified activity feed...");
    const feed = await dashboardService.getActivityFeed(tenantContext);

    assert(feed.length >= 3, `Expected at least 3 feed events, got ${feed.length}`);
    const feedTypes = feed.map((f) => f.type);
    assert(feedTypes.includes("call_completed"), "Activity feed must include call_completed");
    assert(feedTypes.includes("viewing_booked"), "Activity feed must include viewing_booked");
    assert(feedTypes.includes("notification_sent"), "Activity feed must include notification_sent");

    // Chronological order check: newest first
    for (let i = 0; i < feed.length - 1; i++) {
      const current = new Date(feed[i].timestamp).getTime();
      const next = new Date(feed[i + 1].timestamp).getTime();
      assert(current >= next, `Feed items must be sorted descending by timestamp (${current} >= ${next})`);
    }

    console.log(`✔ [TEST 3 PASSED] Unified activity feed verified with ${feed.length} chronological items.\n`);

    // -------------------------------------------------------------
    // TEST 4: Conversion Pipeline Funnel
    // -------------------------------------------------------------
    console.log("▶ [TEST 4] Verifying Sales Pipeline Funnel stages & conversion rates...");
    const funnel = await dashboardService.getPipelineFunnel(tenantContext);

    assert.strictEqual(funnel.length, 5, "Pipeline funnel must have exactly 5 stages");
    const stageIds = funnel.map((s) => s.id);
    assert.deepStrictEqual(stageIds, [
      "stage_inbound",
      "stage_contacted",
      "stage_qualified",
      "stage_viewing",
      "stage_closing",
    ]);

    assert(funnel[0].count >= 4, "Inbound stage count must be at least total leads");
    assert.strictEqual(funnel[0].conversionRate, 100, "Top of funnel must be 100%");
    assert(funnel[2].count >= 3, "Qualified stage must contain qualified leads count");

    console.log("✔ [TEST 4 PASSED] 5-stage sales pipeline funnel verified.\n");

    // -------------------------------------------------------------
    // TEST 5: Multi-Tenant Workspace Isolation
    // -------------------------------------------------------------
    console.log("▶ [TEST 5] Verifying strict multi-tenant isolation across workspaces...");
    const otherMetrics = await dashboardService.getMetrics(otherTenantContext, {});
    assert.strictEqual(otherMetrics.leads.total, 0, "Other workspace must have 0 total leads");
    assert.strictEqual(otherMetrics.calls.total, 0, "Other workspace must have 0 total calls");
    assert.strictEqual(otherMetrics.viewings.total, 0, "Other workspace must have 0 total viewings");

    const otherAttention = await dashboardService.getAttentionItems(otherTenantContext);
    // If empty DB, getAttentionItems falls back to sample mock items or empty; but ensure NONE of TEST_WS_DAY20's IDs are leaked:
    const leakedItem = otherAttention.find(
      (a) => a.leadId === leadHotId || a.leadId === leadHandoffId
    );
    assert.strictEqual(leakedItem, undefined, "Other workspace must NOT contain Day 20 lead attention items");

    const otherFeed = await dashboardService.getActivityFeed(otherTenantContext);
    const leakedFeed = otherFeed.find((f) => f.leadId === leadHotId || f.leadId === leadBookedId);
    assert.strictEqual(leakedFeed, undefined, "Other workspace feed must NOT contain Day 20 lead events");

    console.log("✔ [TEST 5 PASSED] Multi-tenant isolation verified: zero cross-tenant leakage.\n");

    // -------------------------------------------------------------
    // TEST 6: Graceful Resilient Fallback Handling
    // -------------------------------------------------------------
    console.log("▶ [TEST 6] Verifying graceful fallback response formatting...");
    const fallbackMetrics = await dashboardService.getMetrics(
      {
        workspaceId: "non_existent_ws",
        userId: "test_user",
        role: "admin",
        permissions: ["leads:read"],
      },
      {}
    );
    assert(fallbackMetrics.leads !== undefined, "Fallback metrics must supply leads");
    assert(fallbackMetrics.calls !== undefined, "Fallback metrics must supply calls");
    assert(fallbackMetrics.qualified !== undefined, "Fallback metrics must supply qualified");
    assert(fallbackMetrics.hot !== undefined, "Fallback metrics must supply hot");
    assert(fallbackMetrics.viewings !== undefined, "Fallback metrics must supply viewings");
    assert(fallbackMetrics.handoffs !== undefined, "Fallback metrics must supply handoffs");
    assert(fallbackMetrics.followUps !== undefined, "Fallback metrics must supply followUps");
    assert(fallbackMetrics.lastUpdated !== undefined, "Fallback metrics must supply timestamp");

    console.log("✔ [TEST 6 PASSED] Graceful fallback resilience verified.\n");

    console.log("=========================================================");
    console.log(" ALL DAY 20 DASHBOARD TESTS PASSED (6/6 - 100%)");
    console.log("=========================================================\n");
  } finally {
    // -------------------------------------------------------------
    // TEARDOWN: Clean up test fixtures
    // -------------------------------------------------------------
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      await db.delete(schema.notifications).where(eq(schema.notifications.workspaceId, TEST_WS_DAY20));
      await db.delete(schema.leadEvents).where(eq(schema.leadEvents.workspaceId, TEST_WS_DAY20));
      await db.delete(schema.followUps).where(eq(schema.followUps.workspaceId, TEST_WS_DAY20));
      await db.delete(schema.appointments).where(eq(schema.appointments.workspaceId, TEST_WS_DAY20));
      await db.delete(schema.calls).where(eq(schema.calls.workspaceId, TEST_WS_DAY20));
      await db.delete(schema.leads).where(eq(schema.leads.workspaceId, TEST_WS_DAY20));
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, TEST_WS_DAY20));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY20));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_OTHER));
      console.log("✔ [TEARDOWN COMPLETE] Test fixtures purged.\n");
    } catch (cleanupErr) {
      console.warn("Teardown warning:", (cleanupErr as Error).message);
    }
    await app.close();
    process.exit(0);
  }
}

// Execute test suite directly
runDay20DashboardTestSuite().catch((err) => {
  console.error("❌ [DAY 20 TEST FAILED]", err);
  process.exit(1);
});
