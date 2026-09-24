/**
 * PACIA DAY 13 TEST SUITE: AUTONOMOUS FOLLOW-UP AND HANDOFF ENGINE
 * 
 * Verifies:
 * 1. AI_ACTIVE communication state & autonomous follow-up scheduling
 * 2. Pre-action state verification during autonomous follow-up execution
 * 3. Escalation triggers & structured HandoffContext synthesis
 * 4. Human broker takeover & immediate atomic cancellation of pending jobs
 * 5. Inviolable pre-action guard: AI cannot continue autonomous communication after takeover
 * 6. Maximum-attempt guardrail preventing runaway autonomous outreach
 * 7. Broker resume-AI lifecycle restoring AI_ACTIVE state
 * 
 * Executes directly against live Neon PostgreSQL.
 */

import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { AppModule } from "../src/app.module";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { eq, and } from "drizzle-orm";
import { FollowUpsService } from "../src/modules/follow-ups/follow-ups.service";
import { FollowUpWorkflowService } from "../src/modules/follow-ups/services/follow-up-workflow.service";
import { HandoffService } from "../src/modules/follow-ups/services/handoff.service";
import { CallsService } from "../src/modules/calls/calls.service";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";

neonConfig.webSocketConstructor = ws;

const TEST_WS_DAY13 = `ws_day13_handoff_${Date.now()}`;
const TEST_USER_ID = "broker_marcus_vance";

const mockTenant: TenantContext = {
  workspaceId: TEST_WS_DAY13,
  userId: TEST_USER_ID,
  role: "admin",
  permissions: ["leads:read", "leads:write", "calls:read", "calls:write"],
};

async function runTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 13: AUTONOMOUS FOLLOW-UP & HANDOFF ENGINE SUITE");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const followUpsService = app.get<FollowUpsService>(FollowUpsService);
  const workflowService = app.get<FollowUpWorkflowService>(FollowUpWorkflowService);
  const handoffService = app.get<HandoffService>(HandoffService);
  const callsService = app.get<CallsService>(CallsService);

  let testLeadId: string;
  let testLeadPhone = "+2348099887766";

  try {
    // -------------------------------------------------------------
    // SETUP: Provision isolated workspace and test lead
    // -------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated Day 13 workspace and lead in Neon...");
    await db.insert(schema.workspaces).values({
      id: TEST_WS_DAY13,
      name: "Day 13 Handoff Realty",
      slug: `day13-handoff-${Date.now()}`,
    });

    const [lead] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY13,
        name: "Chief Femi Otedola",
        phone: testLeadPhone,
        email: "femi.otedola@zenith.ng",
        budget: "₦2.5 Billion",
        locationPreference: "Ikoyi, Lagos",
        managementMode: "ai_autonomous",
        isAiStopped: false,
        status: "New",
      })
      .returning();

    testLeadId = lead.id;
    console.log(`✔ [SETUP COMPLETE] Lead provisioned: [${testLeadId}] in [${TEST_WS_DAY13}]\n`);

    // -------------------------------------------------------------
    // TEST 1: AI_ACTIVE State & Autonomous Follow-Up Scheduling
    // -------------------------------------------------------------
    console.log("▶ [TEST 1] Verifying AI_ACTIVE state & autonomous follow-up scheduling...");
    const commState1 = handoffService.resolveCommunicationState(lead);
    if (commState1 !== "AI_ACTIVE") {
      throw new Error(`Expected AI_ACTIVE state, received: '${commState1}'`);
    }

    const scheduledDate = new Date(Date.now() + 3600 * 1000);
    const followUp1 = await followUpsService.scheduleFollowUp(mockTenant, {
      leadId: testLeadId,
      scheduledAt: scheduledDate.toISOString(),
      channel: "call",
      cadence: "once",
      priority: "scheduled",
      directive: "Qualify inquiry for Ikoyi waterfront penthouse",
      maxAttempts: 3,
    });

    if (!followUp1.id || followUp1.status !== "pending" || followUp1.attemptCount !== 0) {
      throw new Error(`Invalid follow-up record initialized: ${JSON.stringify(followUp1)}`);
    }
    console.log(`✔ [TEST 1 PASSED] Autonomous follow-up scheduled in AI_ACTIVE state (FollowUp ID: ${followUp1.id})\n`);

    // -------------------------------------------------------------
    // TEST 2: Pre-Action State Verification & Execution in AI_ACTIVE Mode
    // -------------------------------------------------------------
    console.log("▶ [TEST 2] Verifying pre-action check and successful execution in AI_ACTIVE mode...");
    const execResult = await workflowService.executeFollowUpAction(TEST_WS_DAY13, followUp1.id);

    if (!execResult.success || execResult.status !== "completed" || execResult.attemptCount !== 1) {
      throw new Error(`Follow-up execution failed: ${JSON.stringify(execResult)}`);
    }

    // Verify touchpoint event was logged in lead_events
    const [event1] = await db
      .select()
      .from(schema.leadEvents)
      .where(and(eq(schema.leadEvents.leadId, testLeadId), eq(schema.leadEvents.workspaceId, TEST_WS_DAY13)))
      .limit(1);

    if (!event1 || event1.actorType !== "ai_system") {
      throw new Error(`Expected ai_system event in lead_events, got: ${JSON.stringify(event1)}`);
    }
    console.log(`✔ [TEST 2 PASSED] Pre-action check verified AI_ACTIVE, executed touchpoint, and logged audit event.\n`);

    // -------------------------------------------------------------
    // TEST 3: Escalation Trigger -> HUMAN_HANDOFF & HandoffContext Synthesis
    // -------------------------------------------------------------
    console.log("▶ [TEST 3] Verifying escalation trigger and structured HandoffContext generation...");
    // Schedule a pending follow-up that should be cancelled upon escalation
    const followUpToCancel = await followUpsService.scheduleFollowUp(mockTenant, {
      leadId: testLeadId,
      scheduledAt: new Date(Date.now() + 7200 * 1000).toISOString(),
      channel: "whatsapp",
      directive: "Send digital brochure on Ikoyi development",
    });

    const escalationResult = await handoffService.escalateToHandoff(mockTenant, testLeadId, {
      triggerCategory: "negotiation",
      triggerReason: "Prospect demanded 15% cash discount exceeding autonomous 5% authority ceiling.",
      keyQuotes: ["I have ₦2.1B liquid ready if management waives agency fee and grants 15% discount."],
      unresolvedObjections: ["15% discount approval required from Managing Director"],
    });

    const escalatedLead = escalationResult.lead;
    const handoffContext = escalationResult.handoffContext;

    if (escalatedLead.managementMode !== "human_managed" || !escalatedLead.isAiStopped) {
      throw new Error(`Expected managementMode='human_managed' and isAiStopped=true, got: mode=${escalatedLead.managementMode}, isAiStopped=${escalatedLead.isAiStopped}`);
    }

    if (!handoffContext || handoffContext.triggerCategory !== "negotiation" || handoffContext.keyQuotes.length === 0) {
      throw new Error(`Invalid HandoffContext generated: ${JSON.stringify(handoffContext)}`);
    }

    if (escalationResult.cancelledJobsCount < 1) {
      throw new Error(`Expected at least 1 pending job cancelled upon escalation, got: ${escalationResult.cancelledJobsCount}`);
    }

    // Verify the previously scheduled follow-up is now CANCELLED in Neon
    const [cancelledFollowUp] = await db
      .select()
      .from(schema.followUps)
      .where(eq(schema.followUps.id, followUpToCancel.id));

    if (cancelledFollowUp.status !== "cancelled") {
      throw new Error(`Pending follow-up was not cancelled upon escalation! Status: '${cancelledFollowUp.status}'`);
    }
    console.log(`✔ [TEST 3 PASSED] Escalation cleanly synthesized HandoffContext and atomically cancelled pending jobs.\n`);

    // -------------------------------------------------------------
    // TEST 4: Human Broker Takeover (HUMAN_MANAGED) & Complete Job Purge
    // -------------------------------------------------------------
    console.log("▶ [TEST 4] Verifying 1-click human broker takeover & complete job cancellation...");
    // Create another pending follow-up directly
    const [extraPending] = await db
      .insert(schema.followUps)
      .values({
        workspaceId: TEST_WS_DAY13,
        leadId: testLeadId,
        scheduledAt: new Date(Date.now() + 10000),
        channel: "call",
        status: "pending",
        directive: "Pending autonomous check-in",
      })
      .returning();

    const takeoverResult = await handoffService.executeTakeover(mockTenant, testLeadId, {
      brokerName: "Marcus Vance",
      reason: "Lead claimed by Senior Partner for in-person boardroom closing.",
      note: "Meeting scheduled at Spacia VIP Lounge.",
    });

    if (takeoverResult.lead.managementMode !== "human_managed" || !takeoverResult.lead.isAiStopped) {
      throw new Error(`Takeover lead state invalid: ${JSON.stringify(takeoverResult.lead)}`);
    }

    // Check all follow-ups for lead are cancelled
    const remainingPending = await db
      .select()
      .from(schema.followUps)
      .where(
        and(
          eq(schema.followUps.leadId, testLeadId),
          eq(schema.followUps.workspaceId, TEST_WS_DAY13),
          eq(schema.followUps.status, "pending")
        )
      );

    if (remainingPending.length !== 0) {
      throw new Error(`Found ${remainingPending.length} pending follow-ups after takeover! Expected 0.`);
    }
    console.log(`✔ [TEST 4 PASSED] Human takeover activated; all pending autonomous follow-ups purged.\n`);

    // -------------------------------------------------------------
    // TEST 5: Pre-Action Guard Abort (AI Cannot Continue Autonomous Messaging)
    // -------------------------------------------------------------
    console.log("▶ [TEST 5] Verifying pre-action guard aborts AI execution after human takeover...");
    // Attempt 5A: Try scheduling an autonomous follow-up on taken-over lead -> Must reject with 400
    let schedulingBlocked = false;
    try {
      await followUpsService.scheduleFollowUp(mockTenant, {
        leadId: testLeadId,
        scheduledAt: new Date().toISOString(),
        channel: "call",
      });
    } catch (err: any) {
      if (err.status === 400 && err.response?.code === "LEAD_HUMAN_MANAGED") {
        schedulingBlocked = true;
      }
    }
    if (!schedulingBlocked) {
      throw new Error("Failed to block autonomous follow-up scheduling on human-managed lead!");
    }

    // Attempt 5B: Try placing an outbound AI voice call on taken-over lead -> Must reject with 400
    let outboundCallBlocked = false;
    try {
      await callsService.initiateCall(mockTenant, {
        leadId: testLeadId,
        persona: "Victoria",
      });
    } catch (err: any) {
      if (err.status === 400 && err.response?.code === "LEAD_HUMAN_MANAGED") {
        outboundCallBlocked = true;
      }
    }
    if (!outboundCallBlocked) {
      throw new Error("Failed to block autonomous voice call initiation on human-managed lead!");
    }

    // Attempt 5C: Try executing a previously orphaned follow-up directly -> Workflow pre-action guard must abort
    const [orphaned] = await db
      .insert(schema.followUps)
      .values({
        workspaceId: TEST_WS_DAY13,
        leadId: testLeadId,
        scheduledAt: new Date(),
        channel: "call",
        status: "pending",
      })
      .returning();

    const guardResult = await workflowService.executeFollowUpAction(TEST_WS_DAY13, orphaned.id);
    if (guardResult.success || guardResult.status !== "cancelled" || guardResult.stopConditionTriggered !== "HUMAN_TAKEOVER") {
      throw new Error(`Pre-action guard failed to abort orphaned follow-up: ${JSON.stringify(guardResult)}`);
    }
    console.log("✔ [TEST 5 PASSED] Pre-action guards successfully blocked scheduling, voice calls, and orphaned execution.\n");

    // -------------------------------------------------------------
    // TEST 6: Maximum-Attempt Guardrail
    // -------------------------------------------------------------
    console.log("▶ [TEST 6] Verifying maximum-attempt guardrail prevents runaway autonomous calling...");
    // Create a new fresh AI_ACTIVE lead
    const [lead6] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY13,
        name: "Alhaji Sayyu Dantata",
        phone: "+2348071112233",
        budget: "₦800 Million",
        managementMode: "ai_autonomous",
        isAiStopped: false,
      })
      .returning();

    // Create follow-up with attemptCount = 3 (maxAttempts = 3)
    const [maxFollowUp] = await db
      .insert(schema.followUps)
      .values({
        workspaceId: TEST_WS_DAY13,
        leadId: lead6.id,
        scheduledAt: new Date(),
        channel: "call",
        status: "pending",
        attemptCount: 3,
        maxAttempts: 3,
      })
      .returning();

    const maxResult = await workflowService.executeFollowUpAction(TEST_WS_DAY13, maxFollowUp.id);
    if (maxResult.success || maxResult.stopConditionTriggered !== "MAX_ATTEMPTS_REACHED" || maxResult.status !== "cancelled") {
      throw new Error(`Expected MAX_ATTEMPTS_REACHED stop condition, got: ${JSON.stringify(maxResult)}`);
    }

    // Verify lead6 was automatically escalated to human review
    const [reloadedLead6] = await db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.id, lead6.id));

    if (reloadedLead6.managementMode !== "human_managed" || !reloadedLead6.isAiStopped) {
      throw new Error("Max attempts did not transition lead to human supervision!");
    }
    console.log("✔ [TEST 6 PASSED] Maximum-attempt guardrail halted sequence and escalated lead to broker review.\n");

    // -------------------------------------------------------------
    // TEST 7: Broker Resume AI Lifecycle
    // -------------------------------------------------------------
    console.log("▶ [TEST 7] Verifying broker resume-AI restores AI_ACTIVE state...");
    const resumedLead = await handoffService.resumeAi(mockTenant, testLeadId);

    if (resumedLead.managementMode !== "ai_autonomous" || resumedLead.isAiStopped) {
      throw new Error(`Resume AI failed: managementMode=${resumedLead.managementMode}, isAiStopped=${resumedLead.isAiStopped}`);
    }

    const commStateAfterResume = handoffService.resolveCommunicationState(resumedLead);
    if (commStateAfterResume !== "AI_ACTIVE") {
      throw new Error(`Expected AI_ACTIVE state after resume, got: ${commStateAfterResume}`);
    }

    // Now scheduling an autonomous follow-up should succeed again!
    const followUpResumed = await followUpsService.scheduleFollowUp(mockTenant, {
      leadId: testLeadId,
      scheduledAt: new Date(Date.now() + 1800 * 1000).toISOString(),
      channel: "whatsapp",
      directive: "Re-engage following broker clearance",
    });

    if (!followUpResumed || followUpResumed.status !== "pending") {
      throw new Error("Failed to schedule follow-up after resuming AI!");
    }
    console.log("✔ [TEST 7 PASSED] AI_ACTIVE restored; autonomous follow-up sequencing re-engaged.\n");

    console.log("=========================================================");
    console.log(" ALL DAY 13 AUTONOMOUS FOLLOW-UP & HANDOFF TESTS PASSED (7/7 - 100%)");
    console.log("=========================================================\n");
  } catch (err: any) {
    console.error("❌ [DAY 13 TEST SUITE ERROR]:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY13));
      console.log("✔ [TEARDOWN COMPLETE] Workspace purged.\n");
    } catch (cleanupErr: any) {
      console.warn("Teardown warning:", cleanupErr.message);
    }
    await app.close();
  }
}

runTests();
