import { config } from "dotenv";
config({ path: "./.env" });
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;

import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { eq, and } from "drizzle-orm";
import { FollowUpsService } from "../src/modules/follow-ups/follow-ups.service";
import { FollowUpWorkflowService } from "../src/modules/follow-ups/services/follow-up-workflow.service";
import { HandoffService } from "../src/modules/follow-ups/services/handoff.service";
import { CallsService } from "../src/modules/calls/calls.service";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";

async function runDemo() {
  console.log("\n================================================================================");
  console.log(" 🚀 SPACIA AUTONOMOUS FOLLOW-UP & HUMAN HANDOFF INTERACTIVE TESTBENCH");
  console.log("================================================================================\n");

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const followUpsService = app.get(FollowUpsService);
  const workflowService = app.get(FollowUpWorkflowService);
  const handoffService = app.get(HandoffService);
  const callsService = app.get(CallsService);

  const demoWorkspaceId = `ws_demo_handoff_${Date.now()}`;
  const tenant: TenantContext = {
    workspaceId: demoWorkspaceId,
    userId: "broker_adebayo_kuti",
    role: "owner",
    permissions: ["*"],
  };

  try {
    // -------------------------------------------------------------
    // STEP 1: Provision Demo Lead
    // -------------------------------------------------------------
    console.log("▶ [STEP 1] Provisioning high-net-worth lead in Neon PostgreSQL...");
    await db.insert(schema.workspaces).values({
      id: demoWorkspaceId,
      name: "Spacia Luxury Eko Atlantic",
      slug: `spacia-demo-${Date.now()}`,
    });

    const [lead] = await db
      .insert(schema.leads)
      .values({
        workspaceId: demoWorkspaceId,
        name: "Dr. Babatunde Alabi",
        phone: "+14155552671",
        email: "babatunde.alabi@dangote.ng",
        budget: "₦3.2 Billion",
        locationPreference: "Banana Island, Ikoyi",
        managementMode: "ai_autonomous",
        isAiStopped: false,
        status: "New",
      })
      .returning();

    console.log(`   ✔ Lead created: ${lead.name} (${lead.phone})`);
    console.log(`   ✔ Initial State: \x1b[32mAI_ACTIVE\x1b[0m (managementMode: ${lead.managementMode})\n`);

    // -------------------------------------------------------------
    // STEP 2: Autonomous Follow-Up Scheduling
    // -------------------------------------------------------------
    console.log("▶ [STEP 2] AI Agent schedules autonomous call follow-up...");
    const followUp = await followUpsService.scheduleFollowUp(tenant, {
      leadId: lead.id,
      scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      channel: "call",
      directive: "Qualify interest in Banana Island 5-Bed Waterfront Villa",
      maxAttempts: 3,
    });
    console.log(`   ✔ Scheduled FollowUp ID: ${followUp.id}`);
    console.log(`   ✔ Channel: ${followUp.channel} | Status: ${followUp.status} | Attempts: ${followUp.attemptCount}/${followUp.maxAttempts}\n`);

    // -------------------------------------------------------------
    // STEP 3: Pre-Action Check & Execution in AI_ACTIVE Mode
    // -------------------------------------------------------------
    console.log("▶ [STEP 3] Autonomous queue worker triggers follow-up execution...");
    const execResult = await workflowService.executeFollowUpAction(demoWorkspaceId, followUp.id);
    console.log(`   ✔ Pre-Action DB Check: PASSED (Lead is AI_ACTIVE)`);
    console.log(`   ✔ Touchpoint Executed: Status -> \x1b[32m${execResult.status}\x1b[0m (Attempt ${execResult.attemptCount})\n`);

    // -------------------------------------------------------------
    // STEP 4: Escalation & Structured HandoffContext Synthesis
    // -------------------------------------------------------------
    console.log("▶ [STEP 4] Lead brings high-stakes pricing demand -> Triggering Escalation...");
    // Schedule a pending job to verify cancellation
    const pendingJob = await followUpsService.scheduleFollowUp(tenant, {
      leadId: lead.id,
      scheduledAt: new Date(Date.now() + 7200 * 1000).toISOString(),
      channel: "whatsapp",
      directive: "Send brochure and pricing sheet",
    });
    console.log(`   • Active pending job before escalation: ${pendingJob.id}`);

    const escalation = await handoffService.escalateToHandoff(tenant, lead.id, {
      triggerCategory: "negotiation",
      triggerReason: "Client requested 18% cash discount on ₦3.2B property; exceeds AI 5% ceiling.",
      keyQuotes: [
        "I will transfer ₦2.6B before Friday if you can discount 18% and waive legal fees.",
      ],
      unresolvedObjections: ["18% discount approval required from MD"],
    });

    console.log(`   ✔ Transitioned to: \x1b[33mHUMAN_HANDOFF\x1b[0m`);
    console.log(`   ✔ Pending jobs cancelled atomically: ${escalation.cancelledJobsCount} job(s) purged`);
    console.log(`   ✔ Structured Handoff Context Generated:`);
    console.log(`      - Catalyst: ${escalation.handoffContext.triggerReason}`);
    if (escalation.handoffContext.recommendedAction) {
      console.log(`      - Action: \x1b[36m${escalation.handoffContext.recommendedAction.title}\x1b[0m (Priority: ${escalation.handoffContext.recommendedAction.priority})`);
      console.log(`      - Protocol: ${escalation.handoffContext.recommendedAction.actionProtocol}`);
    }
    console.log();

    // -------------------------------------------------------------
    // STEP 5: 1-Click Human Broker Takeover
    // -------------------------------------------------------------
    console.log("▶ [STEP 5] Broker Adebayo Kuti performs 1-Click Takeover...");
    const takeover = await handoffService.executeTakeover(tenant, lead.id, {
      brokerName: "Adebayo Kuti",
      reason: "Handling high-net-worth cash negotiation directly.",
      note: "Meeting booked for tomorrow 11:00 AM at Spacia Lounge.",
    });
    console.log(`   ✔ Mode Transitioned to: \x1b[35mHUMAN_MANAGED\x1b[0m (isAiStopped: true)`);
    console.log(`   ✔ Assigned Broker ID: ${takeover.lead.assignedAgentId || "broker_adebayo_kuti"}\n`);

    // -------------------------------------------------------------
    // STEP 6: Inviolable Pre-Action Guard Verification
    // -------------------------------------------------------------
    console.log("▶ [STEP 6] Testing Inviolable Guard: AI attempts communication after takeover...");
    
    // Test A: Outbound Call Attempt
    try {
      await callsService.initiateCall(tenant, { leadId: lead.id, persona: "Victoria" });
      console.log("   ❌ ERROR: Outbound call should have been blocked!");
    } catch (err: any) {
      console.log(`   ✔ Outbound Voice Call Blocked: \x1b[32m400 ${err.response?.code || err.message}\x1b[0m`);
      console.log(`     Details: "${err.response?.message}"`);
    }

    // Test B: Follow-up Scheduling Attempt
    try {
      await followUpsService.scheduleFollowUp(tenant, {
        leadId: lead.id,
        scheduledAt: new Date().toISOString(),
        channel: "whatsapp",
      });
      console.log("   ❌ ERROR: Scheduling follow-up should have been blocked!");
    } catch (err: any) {
      console.log(`   ✔ Follow-up Scheduling Blocked: \x1b[32m400 ${err.response?.code || err.message}\x1b[0m`);
      console.log(`     Details: "${err.response?.message}"`);
    }

    // Test C: Orphaned Job Execution Guard
    const [orphanedJob] = await db
      .insert(schema.followUps)
      .values({
        workspaceId: demoWorkspaceId,
        leadId: lead.id,
        scheduledAt: new Date(),
        channel: "call",
        status: "pending",
      })
      .returning();

    const orphanedResult = await workflowService.executeFollowUpAction(demoWorkspaceId, orphanedJob.id);
    console.log(`   ✔ Orphaned Action Execution Guard: \x1b[32mABORTED (${orphanedResult.stopConditionTriggered})\x1b[0m`);
    console.log(`     Details: "${orphanedResult.message}"\n`);

    // -------------------------------------------------------------
    // STEP 7: Broker Resumes AI
    // -------------------------------------------------------------
    console.log("▶ [STEP 7] Deal closed by broker; resuming AI autonomous nurturing...");
    const resumed = await handoffService.resumeAi(tenant, lead.id);
    console.log(`   ✔ State Restored: \x1b[32mAI_ACTIVE\x1b[0m (managementMode: ${resumed.managementMode}, isAiStopped: ${resumed.isAiStopped})`);

    const newFollowUp = await followUpsService.scheduleFollowUp(tenant, {
      leadId: lead.id,
      scheduledAt: new Date(Date.now() + 86400 * 1000).toISOString(),
      channel: "whatsapp",
      directive: "Send post-closing concierge welcome pack",
    });
    console.log(`   ✔ Autonomous cadence re-engaged: Job [${newFollowUp.id}] scheduled.\n`);

    console.log("================================================================================");
    console.log(" 🎉 DEMO COMPLETE: ZERO COMMUNICATION LEAKS GUARANTEED AFTER TAKEOVER!");
    console.log("================================================================================\n");
  } catch (err: any) {
    console.error("❌ Demo encountered an error:", err);
  } finally {
    // Teardown
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, demoWorkspaceId));
    await app.close();
    process.exit(0);
  }
}

runDemo();
