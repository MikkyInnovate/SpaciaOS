import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as assert from "assert";
import { eq, and, sql } from "drizzle-orm";
import { AppModule } from "../src/app.module";
import { DRIZZLE_DATABASE, NEON_POOL, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { LoggingInterceptor } from "../src/common/interceptors/logging.interceptor";
import { TransformInterceptor } from "../src/common/interceptors/transform.interceptor";
import { HttpVapiTelephonyProvider } from "../src/modules/calls/providers/vapi-telephony.provider";

neonConfig.webSocketConstructor = ws;

async function runDay12VapiTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 12: CONNECT VAPI VOICE TELEPHONY ENGINE SUITE");
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
  const wsA = `ws_day12_alpha_${timestamp}`;
  const wsB = `ws_day12_beta_${timestamp}`;

  const tenantAlpha: TenantContext = {
    workspaceId: wsA,
    userId: `usr_agent_alpha_12_${timestamp}`,
    role: "owner",
    permissions: ["*"],
    orgSlug: `alpha-realty-${timestamp}`,
  };

  const tenantBeta: TenantContext = {
    workspaceId: wsB,
    userId: `usr_agent_beta_12_${timestamp}`,
    role: "owner",
    permissions: ["*"],
    orgSlug: `beta-realty-${timestamp}`,
  };

  const authHeadersAlpha = {
    "content-type": "application/json",
    Authorization: `Bearer mock_token_${tenantAlpha.userId}:${tenantAlpha.workspaceId}:${tenantAlpha.role}:${tenantAlpha.orgSlug}`,
    "x-workspace-id": tenantAlpha.workspaceId,
  };

  const authHeadersBeta = {
    "content-type": "application/json",
    Authorization: `Bearer mock_token_${tenantBeta.userId}:${tenantBeta.workspaceId}:${tenantBeta.role}:${tenantBeta.orgSlug}`,
    "x-workspace-id": tenantBeta.workspaceId,
  };

  let leadAlphaId: string;
  let propAlphaId: string;
  let call1Id: string;
  let call2Id: string;

  try {
    // -------------------------------------------------------------
    // SETUP: Provision isolated test workspaces and fixtures in Neon
    // -------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated test workspaces and fixtures in Neon...");

    await db.insert(schema.workspaces).values([
      { id: wsA, name: "Alpha Luxury Realty", slug: `alpha-${timestamp}` },
      { id: wsB, name: "Beta Estates", slug: `beta-${timestamp}` },
    ]);

    await db.insert(schema.users).values([
      { id: tenantAlpha.userId, email: `alpha_${timestamp}@spacia.local`, firstName: "Tunde", lastName: "Owner" },
      { id: tenantBeta.userId, email: `beta_${timestamp}@spacia.local`, firstName: "Emeka", lastName: "Owner" },
    ]);

    await db.insert(schema.workspaceMembers).values([
      { workspaceId: wsA, userId: tenantAlpha.userId, role: "owner" },
      { workspaceId: wsB, userId: tenantBeta.userId, role: "owner" },
    ]);

    const [prop] = await db
      .insert(schema.properties)
      .values({
        workspaceId: wsA,
        title: "The Grand Waterfront Villa",
        slug: `waterfront-villa-${timestamp}`,
        location: "Ikoyi, Lagos",
        city: "Lagos",
        state: "Lagos",
        propertyType: "Terrace Duplex",
        price: "400000000",
        formattedPrice: "₦400,000,000",
        bedrooms: 4,
        bathrooms: 5,
        availability: "Available",
      })
      .returning();
    propAlphaId = prop.id;

    const [leadA] = await db
      .insert(schema.leads)
      .values({
        workspaceId: wsA,
        name: "Alhaji Ibrahim Danjuma",
        phone: "+2348039887766",
        email: "ibrahim.d@example.com",
        propertyId: propAlphaId,
        budget: "₦400,000,000",
        locationPreference: "Ikoyi, Lagos",
        status: "New",
        score: 0,
        scoreCategory: "COLD",
      })
      .returning();
    leadAlphaId = leadA.id;

    console.log("✔ [SETUP COMPLETE] Test fixtures initialized in Neon.\n");

    // -------------------------------------------------------------
    // TEST 1: Outbound Call Initiation with Unevaluated Initial State
    // -------------------------------------------------------------
    console.log("▶ [TEST 1] Verifying outbound call initiation with unevaluated initial state...");

    const initRes = await fetch(`${baseUrl}/calls`, {
      method: "POST",
      headers: authHeadersAlpha,
      body: JSON.stringify({
        leadId: leadAlphaId,
        propertyId: propAlphaId,
        persona: "Victoria (Senior Luxury Closer)",
      }),
    });

    const initJson = await initRes.json();
    assert.strictEqual(initRes.status, 201, `Expected status 201, got ${initRes.status}`);
    assert.ok(initJson.data.id, "Expected valid call ID");
    call1Id = initJson.data.id;

    // Verify application state in response DTO
    assert.strictEqual(initJson.data.isLive, true);
    assert.strictEqual(initJson.data.recordingState, "processing");
    assert.strictEqual(initJson.data.outcome, null, "Call outcome MUST be null prior to evaluation");
    assert.strictEqual(initJson.data.score, null, "Call score MUST be null prior to evaluation");

    // Authoritative verification against Neon database
    const [dbCall1] = await db
      .select()
      .from(schema.calls)
      .where(eq(schema.calls.id, call1Id))
      .limit(1);

    assert.ok(dbCall1, "Call must exist in Neon PostgreSQL");
    assert.strictEqual(dbCall1.outcome, null, "calls.outcome in DB must strictly be NULL initially");
    assert.strictEqual(dbCall1.callScore, null, "calls.call_score in DB must strictly be NULL initially");
    assert.strictEqual(dbCall1.isLive, true);
    assert.strictEqual(dbCall1.workspaceId, wsA);
    assert.ok(
      (dbCall1.metrics as any)?.vapiCallId,
      "metrics.vapiCallId must be populated with provider call ID"
    );

    // Verify audit log entry
    const [auditLog] = await db
      .select()
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.workspaceId, wsA),
          eq(schema.auditLogs.action, "call.initiated")
        )
      )
      .limit(1);
    assert.ok(auditLog, "Audit log record for call.initiated must be recorded");

    console.log(`   Call initialized: [${call1Id}] -> vapiCallId: ${(dbCall1.metrics as any).vapiCallId}`);
    console.log("✔ [TEST 1 PASSED] Outbound call initiated with strictly unevaluated initial state (outcome = null).\n");

    // -------------------------------------------------------------
    // TEST 2: Legitimate Direct Failure Path Pre-in_progress (Unanswered/Busy)
    // -------------------------------------------------------------
    console.log("▶ [TEST 2] Verifying legitimate direct failure paths pre-in_progress...");

    // Initiate Call 2
    const initRes2 = await fetch(`${baseUrl}/calls`, {
      method: "POST",
      headers: authHeadersAlpha,
      body: JSON.stringify({
        leadId: leadAlphaId,
        persona: "Victoria",
      }),
    });
    const initJson2 = await initRes2.json();
    call2Id = initJson2.data.id;
    const [dbCall2Initial] = await db.select().from(schema.calls).where(eq(schema.calls.id, call2Id)).limit(1);
    const vapiCall2Id = (dbCall2Initial.metrics as any).vapiCallId;

    // Simulate carrier ringing event
    const ringingRes = await fetch(`${baseUrl}/calls/webhook/vapi`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          type: "status-update",
          status: "ringing",
          call: {
            id: vapiCall2Id,
            status: "ringing",
            metadata: { callId: call2Id, workspaceId: wsA },
          },
        },
      }),
    });
    assert.strictEqual(ringingRes.status, 200);

    const [dbCall2Ringing] = await db.select().from(schema.calls).where(eq(schema.calls.id, call2Id)).limit(1);
    assert.strictEqual(dbCall2Ringing.isLive, true);
    assert.strictEqual(dbCall2Ringing.recordingState, "processing");

    // Directly conclude call as unanswered (ringing -> failed, WITHOUT ever entering in_progress)
    const failedEocRes = await fetch(`${baseUrl}/calls/webhook/vapi`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          type: "end-of-call-report",
          endedReason: "customer-did-not-answer",
          durationSeconds: 0,
          call: {
            id: vapiCall2Id,
            status: "ended",
            endedReason: "customer-did-not-answer",
            metadata: { callId: call2Id, workspaceId: wsA },
          },
        },
      }),
    });
    assert.strictEqual(failedEocRes.status, 200);

    const [dbCall2Failed] = await db.select().from(schema.calls).where(eq(schema.calls.id, call2Id)).limit(1);
    assert.strictEqual(dbCall2Failed.isLive, false, "Failed call must have isLive = false");
    assert.strictEqual(dbCall2Failed.outcome, "voicemail", "Unanswered call must map to voicemail outcome");
    assert.strictEqual(dbCall2Failed.recordingState, "no_audio", "Failed/unanswered call must have no_audio recordingState");
    assert.strictEqual(dbCall2Failed.durationSeconds, 0);

    console.log("✔ [TEST 2 PASSED] Legitimate direct failure path (ringing -> failed) verified without entering in_progress.\n");

    // -------------------------------------------------------------
    // TEST 3: Normal Full Lifecycle with Real Conversation & Evidence
    // -------------------------------------------------------------
    console.log("▶ [TEST 3] Verifying normal full lifecycle with conversation turns & evidence...");

    const vapiCall1Id = (dbCall1.metrics as any).vapiCallId;

    // Step A: status-update (ringing)
    await fetch(`${baseUrl}/calls/webhook/vapi`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          type: "status-update",
          status: "ringing",
          call: { id: vapiCall1Id, status: "ringing", metadata: { callId: call1Id, workspaceId: wsA } },
        },
      }),
    });

    // Step B: status-update (in-progress)
    const inProgressRes = await fetch(`${baseUrl}/calls/webhook/vapi`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          type: "status-update",
          status: "in-progress",
          call: { id: vapiCall1Id, status: "in-progress", metadata: { callId: call1Id, workspaceId: wsA } },
        },
      }),
    });
    assert.strictEqual(inProgressRes.status, 200);

    const [dbCall1InProgress] = await db.select().from(schema.calls).where(eq(schema.calls.id, call1Id)).limit(1);
    assert.strictEqual(dbCall1InProgress.isLive, true);
    assert.strictEqual(dbCall1InProgress.recordingState, "live");

    // Step C: end-of-call-report (terminal report with dialogue)
    const eocPayload = {
      message: {
        type: "end-of-call-report",
        endedReason: "customer-ended-call",
        durationSeconds: 165,
        recordingUrl: "https://vapi-recordings.spacia.internal/rec_alpha_1.wav",
        summary: "Alhaji Ibrahim confirmed readiness for outright purchase and booked in-person viewing tomorrow afternoon.",
        call: {
          id: vapiCall1Id,
          status: "ended",
          endedReason: "customer-ended-call",
          cost: 0.42,
          metadata: { callId: call1Id, workspaceId: wsA },
        },
        analysis: {
          structuredData: {
            outcome: "viewing_booked",
            keyTakeaways: ["Outright cash buyer", "Decision maker confirmed", "Viewing booked tomorrow"],
            actionItems: ["Assign luxury broker Marcus Vance for 2PM hosting"],
            suggestedNextStep: "Send calendar invite and property dossier",
          },
        },
        artifact: {
          messages: [
            {
              role: "assistant",
              speaker: "agent",
              message: "Good afternoon Alhaji Ibrahim, I am calling from Spacia regarding the 4-bedroom waterfront terrace duplex in Ikoyi.",
              secondsFromStart: 2,
            },
            {
              role: "user",
              speaker: "prospect",
              message: "Yes Victoria, I am ready to buy outright and want to schedule an in-person viewing of the 4-bedroom terrace duplex in Ikoyi tomorrow. My budget is ₦400,000,000.",
              secondsFromStart: 12,
            },
            {
              role: "assistant",
              speaker: "agent",
              message: "Outstanding. I have confirmed your appointment for tomorrow at 2:00 PM with our senior partner.",
              secondsFromStart: 28,
            },
            {
              role: "user",
              speaker: "prospect",
              message: "Perfect, see you tomorrow.",
              secondsFromStart: 38,
            },
          ],
        },
      },
    };

    const eocRes = await fetch(`${baseUrl}/calls/webhook/vapi`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(eocPayload),
    });
    assert.strictEqual(eocRes.status, 200);

    const [dbCall1Ended] = await db.select().from(schema.calls).where(eq(schema.calls.id, call1Id)).limit(1);
    assert.strictEqual(dbCall1Ended.isLive, false, "Concluded call must have isLive = false");
    assert.strictEqual(dbCall1Ended.durationSeconds, 165);
    assert.strictEqual(dbCall1Ended.outcome, "viewing_booked");
    assert.strictEqual(dbCall1Ended.recordingState, "ready");
    assert.strictEqual(dbCall1Ended.recordingUrl, "https://vapi-recordings.spacia.internal/rec_alpha_1.wav");

    // Verify transcript record in Neon
    const [transcript] = await db
      .select()
      .from(schema.transcripts)
      .where(and(eq(schema.transcripts.callId, call1Id), eq(schema.transcripts.workspaceId, wsA)))
      .limit(1);
    assert.ok(transcript, "Transcript record must be persisted");
    assert.strictEqual((transcript.turns as any[]).length, 4, "Must preserve all 4 dialogue turns");

    // Verify call summary record in Neon
    const [summary] = await db
      .select()
      .from(schema.callSummaries)
      .where(and(eq(schema.callSummaries.callId, call1Id), eq(schema.callSummaries.workspaceId, wsA)))
      .limit(1);
    assert.ok(summary, "Call summary record must be persisted");
    assert.ok((summary.keyTakeaways as string[]).includes("Viewing booked tomorrow"));

    console.log("✔ [TEST 3 PASSED] Normal full lifecycle persisted duration, outcome, recording, transcript, and summary.\n");

    // -------------------------------------------------------------
    // TEST 4: Inviolability of Terminal States (Out-of-Order Webhook Rejection)
    // -------------------------------------------------------------
    console.log("▶ [TEST 4] Verifying inviolability of terminal states (out-of-order rejection)...");

    // Attempt to send a delayed "ringing" status update to call 1 which is already "ended"
    const lateRingingRes = await fetch(`${baseUrl}/calls/webhook/vapi`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          type: "status-update",
          status: "ringing",
          call: { id: vapiCall1Id, status: "ringing", metadata: { callId: call1Id, workspaceId: wsA } },
        },
      }),
    });
    assert.strictEqual(lateRingingRes.status, 200);

    const [dbCall1AfterLate] = await db.select().from(schema.calls).where(eq(schema.calls.id, call1Id)).limit(1);
    assert.strictEqual(dbCall1AfterLate.isLive, false, "Late ringing update MUST NOT revive call to isLive=true");
    assert.strictEqual(dbCall1AfterLate.outcome, "viewing_booked", "Late update MUST NOT alter terminal outcome");

    console.log("✔ [TEST 4 PASSED] Terminal state protected: late out-of-order webhooks safely ignored.\n");

    // -------------------------------------------------------------
    // TEST 5: Deterministic Webhook Idempotency
    // -------------------------------------------------------------
    console.log("▶ [TEST 5] Verifying deterministic webhook idempotency...");

    const replayRes = await fetch(`${baseUrl}/calls/webhook/vapi`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(eocPayload),
    });
    const replayJson = await replayRes.json();
    assert.strictEqual(replayRes.status, 200);
    assert.strictEqual(replayJson.data.isReplay, true, "Replay must be flagged as idempotent");

    // Verify row counts in transcripts and call_summaries: must remain strictly 1
    const transcriptsCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.transcripts)
      .where(eq(schema.transcripts.callId, call1Id));
    assert.strictEqual(transcriptsCount[0].count, 1, "Duplicate webhook must not insert duplicate transcript rows");

    const summariesCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.callSummaries)
      .where(eq(schema.callSummaries.callId, call1Id));
    assert.strictEqual(summariesCount[0].count, 1, "Duplicate webhook must not insert duplicate call summary rows");

    console.log("✔ [TEST 5 PASSED] Deterministic idempotency verified: zero duplicate database rows.\n");

    // -------------------------------------------------------------
    // TEST 6: Lead Lifecycle Non-Interference & Day 11 Qualification Sync
    // -------------------------------------------------------------
    console.log("▶ [TEST 6] Verifying lead lifecycle non-interference & Day 11 qualification sync...");

    const [leadAfterCall] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadAlphaId)).limit(1);

    // 1. Day 11 qualification scoring was executed with callId
    assert.strictEqual(leadAfterCall.score, 92, "Deterministic qualification score must be 92");
    assert.strictEqual(leadAfterCall.scoreCategory, "HOT", "Lead score category must be HOT");

    // 2. Strict non-interference: lead.status is NOT mutated to 'Viewing Scheduled' or 'Engaged'
    assert.strictEqual(
      leadAfterCall.status,
      "New",
      "Lead status MUST NOT be artificially altered by Vapi integration (respects constraint #5)"
    );

    // 3. Lead activity event is recorded
    const [leadEvent] = await db
      .select()
      .from(schema.leadEvents)
      .where(
        and(
          eq(schema.leadEvents.workspaceId, wsA),
          eq(schema.leadEvents.leadId, leadAlphaId),
          eq(schema.leadEvents.type, "ai_voice_call")
        )
      )
      .limit(1);
    assert.ok(leadEvent, "AI voice call event must be recorded in lead_events");

    // 4. Qualification record links callId directly
    const [qualResult] = await db
      .select()
      .from(schema.qualificationResults)
      .where(
        and(
          eq(schema.qualificationResults.workspaceId, wsA),
          eq(schema.qualificationResults.leadId, leadAlphaId),
          eq(schema.qualificationResults.callId, call1Id)
        )
      )
      .limit(1);
    assert.ok(qualResult, "Qualification record must link callId");

    console.log("✔ [TEST 6 PASSED] Day 11 qualification synced, lead event recorded, lead status strictly preserved.\n");

    // -------------------------------------------------------------
    // TEST 7: Provider Failure Without Silent Fallback
    // -------------------------------------------------------------
    console.log("▶ [TEST 7] Verifying provider failure without silent fallback...");

    const failingHttpProvider = new HttpVapiTelephonyProvider({
      vapiApiKey: undefined,
      vapiBaseUrl: "https://api.vapi.ai",
    } as any);

    let providerErrorCaught = false;
    try {
      await failingHttpProvider.createOutboundCall({
        type: "outboundPhoneCall",
        customer: { number: "+2348000000000" },
      });
    } catch (err: any) {
      providerErrorCaught = true;
      assert.ok(
        err.message.includes("Vapi API key is not configured"),
        `Expected explicit unconfigured message, got: ${err.message}`
      );
    }
    assert.ok(providerErrorCaught, "Unconfigured HttpVapiTelephonyProvider must fail explicitly without fallback");

    console.log("✔ [TEST 7 PASSED] Provider failure raises explicit exception with zero silent fallback.\n");

    // -------------------------------------------------------------
    // TEST 8: Multi-Tenant Isolation & Calls UI Detail Cockpit
    // -------------------------------------------------------------
    console.log("▶ [TEST 8] Verifying multi-tenant isolation and Calls UI detail cockpit hydration...");

    // Tenant Beta attempts to initiate call on Tenant Alpha's lead -> 404
    const crossTenantInitRes = await fetch(`${baseUrl}/calls`, {
      method: "POST",
      headers: authHeadersBeta,
      body: JSON.stringify({
        leadId: leadAlphaId, // Belongs to Alpha
      }),
    });
    assert.strictEqual(crossTenantInitRes.status, 404, "Cross-tenant call initiation must return 404");

    // Tenant Beta attempts to read Tenant Alpha's call -> 404
    const crossTenantReadRes = await fetch(`${baseUrl}/calls/${call1Id}`, {
      method: "GET",
      headers: authHeadersBeta,
    });
    assert.strictEqual(crossTenantReadRes.status, 404, "Cross-tenant call query must return 404");

    // Webhook with mismatched workspace metadata -> 403 Forbidden
    const spoofedWebhookRes = await fetch(`${baseUrl}/calls/webhook/vapi`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          type: "status-update",
          status: "ringing",
          call: {
            id: vapiCall1Id,
            metadata: {
              callId: call1Id,
              workspaceId: wsB, // Spoofed workspace
            },
          },
        },
      }),
    });
    assert.strictEqual(spoofedWebhookRes.status, 403, "Workspace mismatch on webhook must be rejected with 403");

    // Tenant Alpha fetches Calls UI cockpit detail
    const cockpitRes = await fetch(`${baseUrl}/calls/${call1Id}`, {
      method: "GET",
      headers: authHeadersAlpha,
    });
    const cockpitJson = await cockpitRes.json();
    assert.strictEqual(cockpitRes.status, 200);

    const callDto = cockpitJson.data;
    assert.strictEqual(callDto.id, call1Id);
    assert.strictEqual(callDto.leadName, "Alhaji Ibrahim Danjuma");
    assert.strictEqual(callDto.outcome, "viewing_booked");
    assert.strictEqual(callDto.recordingState, "ready");
    assert.strictEqual(callDto.audioDurationSeconds, 165);
    assert.strictEqual(callDto.score, 92);
    assert.strictEqual(callDto.scoreCategory, "HOT");
    assert.ok(callDto.summary);
    assert.strictEqual(callDto.transcript.length, 4);

    // Tenant Alpha lists calls
    const listRes = await fetch(`${baseUrl}/calls?limit=10`, {
      method: "GET",
      headers: authHeadersAlpha,
    });
    const listJson = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listJson.data.calls.length, 2);

    console.log("✔ [TEST 8 PASSED] Multi-tenant isolation verified; Calls UI cockpit payload fully hydrated.\n");

    console.log("=========================================================");
    console.log(" ALL DAY 12 VAPI TELEPHONY TESTS PASSED (8/8 - 100%)");
    console.log("=========================================================\n");
  } finally {
    // -------------------------------------------------------------
    // TEARDOWN: Purge ephemeral test data from Neon PostgreSQL
    // -------------------------------------------------------------
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, wsA));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, wsB));
      await db.delete(schema.idempotencyKeys).where(eq(schema.idempotencyKeys.workspaceId, wsA));
      await db.delete(schema.idempotencyKeys).where(eq(schema.idempotencyKeys.workspaceId, wsB));
      await db.delete(schema.leadEvents).where(eq(schema.leadEvents.workspaceId, wsA));
      await db.delete(schema.leadEvents).where(eq(schema.leadEvents.workspaceId, wsB));
      await db.delete(schema.leadScores).where(eq(schema.leadScores.workspaceId, wsA));
      await db.delete(schema.leadScores).where(eq(schema.leadScores.workspaceId, wsB));
      await db.delete(schema.qualificationResults).where(eq(schema.qualificationResults.workspaceId, wsA));
      await db.delete(schema.qualificationResults).where(eq(schema.qualificationResults.workspaceId, wsB));
      await db.delete(schema.messages).where(eq(schema.messages.workspaceId, wsA));
      await db.delete(schema.conversations).where(eq(schema.conversations.workspaceId, wsA));
      await db.delete(schema.transcripts).where(eq(schema.transcripts.workspaceId, wsA));
      await db.delete(schema.callSummaries).where(eq(schema.callSummaries.workspaceId, wsA));
      await db.delete(schema.calls).where(eq(schema.calls.workspaceId, wsA));
      await db.delete(schema.calls).where(eq(schema.calls.workspaceId, wsB));
      await db.delete(schema.leads).where(eq(schema.leads.workspaceId, wsA));
      await db.delete(schema.leads).where(eq(schema.leads.workspaceId, wsB));
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, wsA));
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, wsB));
      await db.delete(schema.workspaceMembers).where(eq(schema.workspaceMembers.workspaceId, wsA));
      await db.delete(schema.workspaceMembers).where(eq(schema.workspaceMembers.workspaceId, wsB));
      await db.delete(schema.users).where(eq(schema.users.id, tenantAlpha.userId));
      await db.delete(schema.users).where(eq(schema.users.id, tenantBeta.userId));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, wsA));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, wsB));
    } catch (err: any) {
      console.warn(`Teardown warning: ${err.message}`);
    }

    await app.close();
    await pool.end();
  }
}

runDay12VapiTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ DAY 12 TEST RUN FAILED:", err);
    process.exit(1);
  });
