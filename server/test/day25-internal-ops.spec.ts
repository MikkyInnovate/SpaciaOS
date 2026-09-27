import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as assert from "node:assert";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { AppModule } from "../src/app.module";
import { OpsService } from "../src/modules/ops/ops.service";
import { IntegrationsService } from "../src/modules/integrations/integrations.service";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { eq } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

async function runDay25InternalOpsTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 25: INTERNAL OPERATIONS COMMAND SUITE");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const opsService = app.get<OpsService>(OpsService);
  const integrationsService = app.get<IntegrationsService>(IntegrationsService);

  const timestamp = Date.now();
  const TEST_WS_DAY25 = `ws_day25_ops_${timestamp}`;
  const TEST_WS_DAY25_OTHER = `ws_day25_other_${timestamp}`;

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision isolated workspaces in Neon PostgreSQL
    // -------------------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated Day 25 operational workspaces in Neon PostgreSQL...");
    await db.insert(schema.workspaces).values([
      { id: TEST_WS_DAY25, name: "Day 25 Luxury Fleet One", slug: TEST_WS_DAY25 },
      { id: TEST_WS_DAY25_OTHER, name: "Day 25 Luxury Fleet Two", slug: TEST_WS_DAY25_OTHER },
    ]);

    // Ensure default integrations exist
    await integrationsService.getIntegrations(TEST_WS_DAY25);

    // Seed test lead
    const [testLead] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY25,
        name: "Ibrahim Adeleke",
        phone: "+2348011223344",
        email: "ibrahim@spacia.test",
        status: "Qualified",
        score: 88,
        budget: "₦750,000,000",
      })
      .returning();

    // Seed test call
    await db.insert(schema.calls).values({
      workspaceId: TEST_WS_DAY25,
      leadId: testLead.id,
      leadName: "Ibrahim Adeleke",
      leadPhone: "+2348011223344",
      outcome: "qualified",
      durationSeconds: 195,
      callScore: 92,
      isEscalated: false,
    });

    // Seed test appointment
    const now = new Date();
    const startTime = new Date(now.getTime() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);
    await db.insert(schema.appointments).values({
      workspaceId: TEST_WS_DAY25,
      leadId: testLead.id,
      title: "Luxury Penthouse Inspection - Ibrahim",
      location: "Ikoyi Waterfront, Lagos",
      scheduledStartAt: startTime,
      scheduledEndAt: endTime,
      status: "scheduled",
    });

    // Seed a failed system event / workflow
    const [failedEvent] = await db
      .insert(schema.systemEvents)
      .values({
        workspaceId: TEST_WS_DAY25,
        eventName: "LeadQualificationWorkflow",
        aggregateType: "lead",
        aggregateId: testLead.id,
        payload: {
          leadId: testLead.id,
          phone: "+2348011223344",
          lastError: "Vapi telephony gateway timeout after 15000ms",
        },
        status: "failed",
      })
      .returning();

    console.log("✔ [SETUP COMPLETE] Test fixtures seeded.\n");

    // =========================================================================
    // TEST 1: Overview Telemetry Aggregation
    // =========================================================================
    console.log("▶ [TEST 1] Testing Operational Pulse Overview Telemetry...");
    const overview = await opsService.getOverview(TEST_WS_DAY25);

    assert.ok(overview, "Overview telemetry must be defined");
    assert.strictEqual(typeof overview.totalWorkspaces, "number");
    assert.ok(overview.totalLeads >= 1, "Should count at least 1 lead");
    assert.ok(overview.totalCalls >= 1, "Should count at least 1 call");
    assert.ok(overview.totalAppointments >= 1, "Should count at least 1 appointment");
    assert.ok(overview.failedWorkflows >= 1, "Should reflect failed workflow");
    assert.ok(overview.integrationsHealth.total > 0, "Integrations health count must be populated");
    assert.strictEqual(typeof overview.aiDialerPaused, "boolean");
    assert.ok(overview.systemStatus === "operational" || overview.systemStatus === "degraded" || overview.systemStatus === "critical");

    console.log(`  ✔ Overview computed: ${overview.totalLeads} leads, ${overview.totalCalls} calls, ${overview.totalAppointments} appointments.`);
    console.log(`  ✔ Integrations fleet: ${overview.integrationsHealth.healthy}/${overview.integrationsHealth.total} healthy.`);
    console.log(`  ✔ System health status: [${overview.systemStatus.toUpperCase()}] with ${overview.failedWorkflows} failed workflow(s).\n`);

    // =========================================================================
    // TEST 2: Operational Entity Queries (Workspaces, Leads, Calls, Appointments)
    // =========================================================================
    console.log("▶ [TEST 2] Testing Operational Entity Views...");
    const workspaces = await opsService.getWorkspaces();
    assert.ok(workspaces.length >= 2, "Must list provisioned workspaces");
    const ws1 = workspaces.find((w) => w.id === TEST_WS_DAY25);
    assert.ok(ws1, "Must find workspace 1");
    assert.strictEqual(ws1.name, "Day 25 Luxury Fleet One");

    const leads = await opsService.getLeads(10, TEST_WS_DAY25);
    assert.ok(leads.length >= 1, "Must list leads for workspace");
    assert.strictEqual(leads[0].fullName, "Ibrahim Adeleke");
    assert.strictEqual(leads[0].status, "Qualified");

    const calls = await opsService.getCalls(10, TEST_WS_DAY25);
    assert.ok(calls.length >= 1, "Must list calls for workspace");
    assert.strictEqual(calls[0].durationSeconds, 195);
    assert.strictEqual(calls[0].outcome, "qualified");

    const appointments = await opsService.getAppointments(10, TEST_WS_DAY25);
    assert.ok(appointments.length >= 1, "Must list appointments for workspace");
    assert.strictEqual(appointments[0].title, "Luxury Penthouse Inspection - Ibrahim");

    console.log(`  ✔ Workspaces query verified (${workspaces.length} total workspaces).`);
    console.log(`  ✔ Leads query verified (${leads.length} lead returned).`);
    console.log(`  ✔ Calls query verified (${calls.length} call returned).`);
    console.log(`  ✔ Appointments query verified (${appointments.length} appointment returned).\n`);

    // =========================================================================
    // TEST 3: Workflow Telemetry & 1-Click Retry Execution
    // =========================================================================
    console.log("▶ [TEST 3] Testing Workflow Telemetry & 1-Click Retry Execution...");
    const workflowsBefore = await opsService.getWorkflows(10, "failed", TEST_WS_DAY25);
    assert.ok(workflowsBefore.length >= 1, "Must find failed workflow");
    assert.strictEqual(workflowsBefore[0].id, failedEvent.id);
    assert.strictEqual(workflowsBefore[0].status, "failed");

    // Execute retry
    const retryResult = await opsService.retryWorkflow(failedEvent.id, "ops_lead_admin");
    assert.strictEqual(retryResult.success, true);
    assert.strictEqual(retryResult.workflow.status, "processing");
    const updatedPayload: any = retryResult.workflow.payload;
    assert.strictEqual(updatedPayload.retryCount, 1);
    assert.strictEqual(updatedPayload.retriedBy, "ops_lead_admin");

    console.log(`  ✔ Workflow retry executed: status transitioned from 'failed' to 'processing'.`);
    console.log(`  ✔ Retry metadata stamped: retryCount=${updatedPayload.retryCount}, retriedBy=${updatedPayload.retriedBy}.\n`);

    // =========================================================================
    // TEST 4: Unified Error Observability Across Subsystems
    // =========================================================================
    console.log("▶ [TEST 4] Testing Unified Error Observability Aggregation...");
    // Inject another failed workflow to verify error consolidation
    await db.insert(schema.systemEvents).values({
      workspaceId: TEST_WS_DAY25,
      eventName: "WebhookLeadIngestion",
      aggregateType: "lead",
      aggregateId: testLead.id,
      payload: {
        error: "Invalid HMAC signature in webhook header",
      },
      status: "failed",
    });

    const errorFeed = await opsService.getErrors(20, TEST_WS_DAY25);
    assert.ok(errorFeed.length >= 1, "Must consolidate errors across platform");
    const webhookErr = errorFeed.find((e) => e.title.includes("WebhookLeadIngestion"));
    assert.ok(webhookErr, "Must surface failed webhook workflow in error feed");
    assert.strictEqual(webhookErr.source, "workflow");
    assert.strictEqual(webhookErr.retryable, true);
    assert.strictEqual(webhookErr.severity, "critical");

    console.log(`  ✔ Error feed consolidated: ${errorFeed.length} active error events discovered.`);
    console.log(`  ✔ Error categorization verified: source=${webhookErr.source}, retryable=${webhookErr.retryable}.\n`);

    // =========================================================================
    // TEST 5: Integration Health & 1-Click Reconnect Action
    // =========================================================================
    console.log("▶ [TEST 5] Testing Fleet Integration Health & Reconnect Action...");
    const integrations = await opsService.getIntegrations(TEST_WS_DAY25);
    assert.ok(integrations.length >= 4, "Must retrieve default provisioned integrations");

    const targetIntegration = integrations[0];
    const reconnectResult = await opsService.reconnectIntegration(
      targetIntegration.id,
      TEST_WS_DAY25,
      "ops_super_admin"
    );
    assert.strictEqual(reconnectResult.success, true);
    assert.ok(reconnectResult.integration, "Must return reconnected integration object");

    console.log(`  ✔ Integration health evaluated across ${integrations.length} connectors.`);
    console.log(`  ✔ 1-Click reconnect validated for '${targetIntegration.name}' (${reconnectResult.integration.status}).\n`);

    // =========================================================================
    // TEST 6: Audit Activity Trail & Operational AI Controls (Pause/Resume)
    // =========================================================================
    console.log("▶ [TEST 6] Testing Audit Trail & AI Dialer Operational Controls...");
    // 1. Pause AI dialer
    const pauseResult = await opsService.pauseAiDialer(TEST_WS_DAY25, "ops_commander");
    assert.strictEqual(pauseResult.success, true);
    assert.strictEqual(pauseResult.isOutboundPaused, true);

    const dialerStatus = await opsService.getAiDialerStatus(TEST_WS_DAY25);
    assert.strictEqual(dialerStatus.status.engineStatus, "paused");

    // 2. Resume AI dialer
    const resumeResult = await opsService.resumeAiDialer(TEST_WS_DAY25, "ops_commander");
    assert.strictEqual(resumeResult.success, true);
    assert.strictEqual(resumeResult.isOutboundPaused, false);

    const dialerStatusAfter = await opsService.getAiDialerStatus(TEST_WS_DAY25);
    assert.strictEqual(dialerStatusAfter.status.engineStatus, "active");

    // 3. Verify audit log trail
    const auditLogs = await opsService.getAuditLogs(50, "all", "all", TEST_WS_DAY25);
    assert.ok(auditLogs.length >= 2, "Must log audit trail for operational actions");

    const pauseAudit = auditLogs.find((a) => a.action === "ai:pause_dialer");
    const resumeAudit = auditLogs.find((a) => a.action === "ai:resume_dialer");
    const retryAudit = auditLogs.find((a) => a.action === "workflow:retry");

    assert.ok(pauseAudit, "Must record ai:pause_dialer in audit_logs");
    assert.strictEqual(pauseAudit.severity, "warning");
    assert.ok(resumeAudit, "Must record ai:resume_dialer in audit_logs");
    assert.strictEqual(resumeAudit.severity, "info");
    assert.ok(retryAudit, "Must record workflow:retry in audit_logs");

    console.log(`  ✔ Operational AI pause verified: engineStatus='paused'.`);
    console.log(`  ✔ Operational AI resume verified: engineStatus='active'.`);
    console.log(`  ✔ Audit trail verified: ${auditLogs.length} compliance logs captured with severity classifications.\n`);

    console.log("=========================================================");
    console.log(" ✅ ALL PACIA DAY 25 INTERNAL OPERATIONS TESTS PASSED!");
    console.log("=========================================================\n");
  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN: Clean up test fixtures from Neon PostgreSQL
    // -------------------------------------------------------------------------
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      await db.delete(schema.systemEvents).where(eq(schema.systemEvents.workspaceId, TEST_WS_DAY25));
      await db.delete(schema.calls).where(eq(schema.calls.workspaceId, TEST_WS_DAY25));
      await db.delete(schema.appointments).where(eq(schema.appointments.workspaceId, TEST_WS_DAY25));
      await db.delete(schema.leads).where(eq(schema.leads.workspaceId, TEST_WS_DAY25));
      await db.delete(schema.integrations).where(eq(schema.integrations.workspaceId, TEST_WS_DAY25));
      await db.delete(schema.aiAgentConfigs).where(eq(schema.aiAgentConfigs.workspaceId, TEST_WS_DAY25));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, TEST_WS_DAY25));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY25));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY25_OTHER));
      console.log("✔ [TEARDOWN COMPLETE] Test fixtures purged.");
    } catch (cleanupErr: any) {
      console.warn("Teardown warning:", cleanupErr.message);
    }
    await app.close();
  }
}

runDay25InternalOpsTests().catch((err) => {
  console.error("\n❌ DAY 25 TEST RUNNER FAILED:", err);
  process.exit(1);
});
