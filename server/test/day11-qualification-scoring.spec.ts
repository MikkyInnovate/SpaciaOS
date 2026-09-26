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
import { LeadScoringService } from "../src/modules/leads/services/lead-scoring.service";
import { LeadsService } from "../src/modules/leads/leads.service";
import { AiOrchestratorService } from "../src/modules/ai-agent/services/ai-orchestrator.service";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";

process.env.ALLOW_MOCK_AUTH = "true";
process.env.NODE_ENV = "test";
process.env.AI_PROVIDER = "mock";

config({ path: "./.env" });
neonConfig.webSocketConstructor = ws;

async function runDay11QualificationTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 11: DETERMINISTIC QUALIFICATION & SCORING SUITE");
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
  const scoringService: LeadScoringService = app.get(LeadScoringService);
  const leadsService: LeadsService = app.get(LeadsService);
  const orchestrator: AiOrchestratorService = app.get(AiOrchestratorService);

  const timestamp = Date.now();
  const wsA = `ws_day11_alpha_${timestamp}`;
  const wsB = `ws_day11_beta_${timestamp}`;

  const tenantAlpha: TenantContext = {
    workspaceId: wsA,
    userId: "usr_agent_alpha_11",
    role: "owner",
    permissions: ["*"],
    orgSlug: `alpha-realty-${timestamp}`,
  };

  const tenantBeta: TenantContext = {
    workspaceId: wsB,
    userId: "usr_agent_beta_11",
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
  let leadBetaId: string;
  let propAlphaId: string;

  try {
    // -------------------------------------------------------------
    // SETUP: Provision isolated test workspaces and fixtures
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
        status: "New",
        score: 0,
        scoreCategory: "COLD",
      })
      .returning();
    leadAlphaId = leadA.id;

    const [leadB] = await db
      .insert(schema.leads)
      .values({
        workspaceId: wsB,
        name: "Chief Femi Adeyemi",
        phone: "+2348021112233",
        email: "femi.ade@example.com",
        status: "New",
        score: 0,
        scoreCategory: "COLD",
      })
      .returning();
    leadBetaId = leadB.id;

    console.log("✔ [SETUP COMPLETE] Test fixtures initialized.\n");

    // -------------------------------------------------------------
    // TEST 1: Deliverable Scenario Verification (Exact 92 — HOT)
    // -------------------------------------------------------------
    console.log("▶ [TEST 1] Verifying deliverable scenario (Exact 92 — HOT)...");

    const deliverableDialogue = [
      {
        role: "user",
        content:
          "Hello, I am ready to buy a 4-bedroom terrace duplex in Ikoyi within ₦400,000,000 outright. Can we schedule a viewing this week?",
      },
    ];

    const deliverableTools = [
      {
        toolName: "get_property",
        parameters: { propertyId: propAlphaId },
        success: true,
      },
    ];

    const evalResult = await scoringService.evaluateAndPersist(
      wsA,
      leadAlphaId,
      deliverableDialogue,
      deliverableTools
    );

    // Assert exact 92 score and category
    assert.strictEqual(
      evalResult.score,
      92,
      `Deliverable score must be exactly 92, got: ${evalResult.score}`
    );
    assert.strictEqual(
      evalResult.scoreCategory,
      "HOT",
      `Deliverable category must be HOT, got: ${evalResult.scoreCategory}`
    );

    // Assert exact dimensional breakdown
    assert.strictEqual(evalResult.bantBreakdown.budgetScore, 25, "Budget must be 25 pts");
    assert.strictEqual(evalResult.bantBreakdown.authorityScore, 15, "Authority must be 15 pts");
    assert.strictEqual(evalResult.bantBreakdown.needScore, 17, "Need must be 17 pts");
    assert.strictEqual(evalResult.bantBreakdown.timelineScore, 20, "Timeline must be 20 pts");
    assert.strictEqual(evalResult.bantBreakdown.propertyFitScore, 15, "Property Fit must be 15 pts");

    // Assert all 5 exact factor labels are present
    const positiveLabels = evalResult.factors.positiveFactors.map((f) => f.label);
    assert.ok(positiveLabels.includes("+ Budget confirmed"), "Missing '+ Budget confirmed'");
    assert.ok(positiveLabels.includes("+ Specific property"), "Missing '+ Specific property'");
    assert.ok(positiveLabels.includes("+ Purchase intent"), "Missing '+ Purchase intent'");
    assert.ok(
      positiveLabels.includes("+ Timeline under 30 days"),
      "Missing '+ Timeline under 30 days'"
    );
    assert.ok(positiveLabels.includes("+ Viewing requested"), "Missing '+ Viewing requested'");

    console.log(`   Score: ${evalResult.score} — ${evalResult.scoreCategory}`);
    evalResult.factors.positiveFactors.forEach((f) => console.log(`   • ${f.label} (+${f.impact})`));
    console.log("✔ [TEST 1 PASSED] Exact 92 — HOT deliverable reproduced deterministically.\n");

    // -------------------------------------------------------------
    // TEST 2: Commercial Intent vs AI Confidence Decoupling
    // -------------------------------------------------------------
    console.log("▶ [TEST 2] Verifying separation of commercial intent from AI confidence...");

    // Scenario A: Aspirational intent without budget/timeline or contact credibility
    const aspirationalDialogue = [
      {
        role: "user",
        content: "I want to purchase the biggest luxury mansion in Lagos outright!",
      },
    ];

    const aspirationalResult = await scoringService.evaluateAndPersist(
      wsA,
      undefined, // In-memory evaluation
      aspirationalDialogue,
      []
    );

    // Commercial score should be low/moderate because budget & timeline are completely unconfirmed
    assert.strictEqual(
      aspirationalResult.bantBreakdown.budgetScore,
      0,
      "Unstated budget must yield 0 budget points"
    );
    assert.strictEqual(
      aspirationalResult.bantBreakdown.timelineScore,
      3,
      "Unstated timeline must yield exploratory baseline (3 pts)"
    );
    assert.strictEqual(aspirationalResult.scoreCategory, "COLD", "Aspirational lead without budget must be COLD");

    // AI Confidence must be provisional because core criteria are unconfirmed
    assert.strictEqual(
      aspirationalResult.aiConfidence.confidenceGrade,
      "provisional",
      "AI confidence must be provisional when budget and timeline are missing"
    );
    assert.ok(
      aspirationalResult.aiConfidence.confidenceScore < 60,
      "Confidence score should be low for sparse evidence"
    );

    console.log(
      `   Aspirational Intent -> Score: ${aspirationalResult.score} (${aspirationalResult.scoreCategory}), AI Confidence: ${aspirationalResult.aiConfidence.confidenceScore}% (${aspirationalResult.aiConfidence.confidenceGrade})`
    );
    console.log("✔ [TEST 2 PASSED] Commercial intent decoupled from evidentiary confidence.\n");

    // -------------------------------------------------------------
    // TEST 3: Cumulative Property Fit Scoring Rules
    // -------------------------------------------------------------
    console.log("▶ [TEST 3] Verifying cumulative Property Fit rules and caps...");

    // Case 1: Specific property alone (+7)
    const fit1 = scoringService.calculateBantScore(
      scoringService.extractSignals(
        [{ role: "user", content: "Tell me about duplexes in Ikoyi" }],
        [{ toolName: "get_property", success: true }]
      ),
      [{ toolName: "get_property", success: true }]
    );
    assert.strictEqual(fit1.bantBreakdown.propertyFitScore, 7, "get_property alone must yield 7 pts");

    // Case 2: Specific property (+7) + Availability checked (+4) = 11 pts
    const fit2 = scoringService.calculateBantScore(
      scoringService.extractSignals(
        [{ role: "user", content: "Tell me about duplexes in Ikoyi" }],
        [
          { toolName: "get_property", success: true },
          { toolName: "check_property_availability", success: true },
        ]
      ),
      [
        { toolName: "get_property", success: true },
        { toolName: "check_property_availability", success: true },
      ]
    );
    assert.strictEqual(
      fit2.bantBreakdown.propertyFitScore,
      11,
      "get_property + availability checked must yield 11 pts (7 + 4)"
    );

    // Case 3: Specific property (+7) + Viewing requested (+8) = 15 pts (Max Cap)
    const fit3 = scoringService.calculateBantScore(
      scoringService.extractSignals(
        [{ role: "user", content: "I want to inspect this 4-bedroom duplex in Ikoyi" }],
        [{ toolName: "get_property", success: true }]
      ),
      [{ toolName: "get_property", success: true }]
    );
    assert.strictEqual(
      fit3.bantBreakdown.propertyFitScore,
      15,
      "get_property + viewing requested must yield 15 pts (capped at 15)"
    );

    console.log("✔ [TEST 3 PASSED] Property Fit cumulative rules and caps verified.\n");

    // -------------------------------------------------------------
    // TEST 4: Score History (Append-Only by Application Convention)
    // -------------------------------------------------------------
    console.log("▶ [TEST 4] Verifying append-only score history logging in Neon...");

    // Perform a second evaluation on leadAlpha (e.g. updating timeline)
    const secondTurnDialogue = [
      ...deliverableDialogue,
      {
        role: "user",
        content: "I have transferred my proof of funds and want to close immediately this Thursday.",
      },
    ];

    await scoringService.evaluateAndPersist(wsA, leadAlphaId, secondTurnDialogue, deliverableTools);

    // Query Neon lead_scores table directly
    const scoresInDb = await db
      .select()
      .from(schema.leadScores)
      .where(
        and(eq(schema.leadScores.leadId, leadAlphaId), eq(schema.leadScores.workspaceId, wsA))
      )
      .orderBy(desc(schema.leadScores.calculatedAt));

    assert.ok(
      scoresInDb.length >= 2,
      `Expected at least 2 historical score rows in lead_scores, got: ${scoresInDb.length}`
    );
    assert.strictEqual(scoresInDb[0].score, 92);
    assert.strictEqual(scoresInDb[0].scoreCategory, "HOT");
    assert.ok(scoresInDb[0].factors);

    // Verify GET /api/v1/leads/:id/scores endpoint
    const historyRes = await fetch(`${baseUrl}/leads/${leadAlphaId}/scores`, {
      method: "GET",
      headers: authHeadersAlpha,
    });
    const historyJson = await historyRes.json();
    assert.strictEqual(historyRes.status, 200);
    assert.ok(historyJson.data.history.length >= 2);
    console.log(
      `   Historical score logs recorded: ${historyJson.data.history.length} entries for lead [${leadAlphaId}]`
    );
    console.log("✔ [TEST 4 PASSED] Append-only score history verified.\n");

    // -------------------------------------------------------------
    // TEST 5: Deterministic Recommended Next Action Generation
    // -------------------------------------------------------------
    console.log("▶ [TEST 5] Verifying deterministic recommended next action derivation...");

    // HOT lead with viewing request
    const hotAction = scoringService.generateNextAction(92, "HOT", {
      viewingRequested: true,
    } as any);
    assert.strictEqual(
      hotAction.summary,
      "Schedule in-person property inspection within 24 hours"
    );
    assert.strictEqual(hotAction.directive.priority, "Immediate");
    assert.strictEqual(hotAction.directive.assignedTo, "Senior Sales Broker");

    // WARM lead
    const warmAction = scoringService.generateNextAction(65, "WARM", {
      viewingRequested: false,
    } as any);
    assert.strictEqual(
      warmAction.summary,
      "Send curated property shortlist and follow up in 48 hours"
    );
    assert.strictEqual(warmAction.directive.priority, "Scheduled");

    // COLD lead
    const coldAction = scoringService.generateNextAction(35, "COLD", {
      viewingRequested: false,
    } as any);
    assert.strictEqual(
      coldAction.summary,
      "Enroll prospect in automated luxury email nurture and quarterly market report"
    );
    assert.strictEqual(coldAction.directive.priority, "Routine");

    console.log("✔ [TEST 5 PASSED] Prioritized next action directives verified.\n");

    // -------------------------------------------------------------
    // TEST 6: Multi-Tenant Workspace Isolation
    // -------------------------------------------------------------
    console.log("▶ [TEST 6] Verifying multi-tenant isolation on score lookups...");

    // Workspace Beta tries to get score history of Workspace Alpha's lead
    const crossTenantGet = await fetch(`${baseUrl}/leads/${leadAlphaId}/scores`, {
      method: "GET",
      headers: authHeadersBeta,
    });
    assert.strictEqual(
      crossTenantGet.status,
      404,
      "Cross-workspace score history lookup must return 404"
    );

    // Workspace Beta tries to trigger re-scoring on Workspace Alpha's lead
    const crossTenantScore = await fetch(`${baseUrl}/leads/${leadAlphaId}/score`, {
      method: "POST",
      headers: authHeadersBeta,
      body: JSON.stringify({ dialogue: [] }),
    });
    assert.strictEqual(
      crossTenantScore.status,
      404,
      "Cross-workspace re-scoring trigger must return 404"
    );

    console.log("✔ [TEST 6 PASSED] Multi-tenant isolation verified with zero data disclosure.\n");

    // -------------------------------------------------------------
    // TEST 7: End-to-End Lead UI DTO Hydration
    // -------------------------------------------------------------
    console.log("▶ [TEST 7] Verifying complete LeadDetailDto hydration for frontend UI...");

    const detailRes = await fetch(`${baseUrl}/leads/${leadAlphaId}`, {
      method: "GET",
      headers: authHeadersAlpha,
    });
    const detailJson = await detailRes.json();
    assert.strictEqual(detailRes.status, 200);

    const leadDto = detailJson.data;
    assert.strictEqual(leadDto.score, 92);
    assert.strictEqual(leadDto.scoreCategory, "HOT");
    assert.strictEqual(leadDto.nextAction, "Schedule in-person property inspection within 24 hours");

    // Check BANT breakdown hydration
    assert.ok(leadDto.bantBreakdown);
    assert.strictEqual(leadDto.bantBreakdown.budgetScore, 25);
    assert.strictEqual(leadDto.bantBreakdown.authorityScore, 15);
    assert.strictEqual(leadDto.bantBreakdown.needScore, 17);
    assert.strictEqual(leadDto.bantBreakdown.timelineScore, 20);
    assert.strictEqual(leadDto.bantBreakdown.propertyFitScore, 15);

    // Check positive factors hydration in qualificationProfile.explainableBreakdown
    assert.ok(leadDto.qualificationProfile?.explainableBreakdown?.positiveFactors);
    const hydratedLabels = leadDto.qualificationProfile.explainableBreakdown.positiveFactors.map(
      (f: any) => f.label
    );
    assert.ok(hydratedLabels.includes("+ Budget confirmed"));
    assert.ok(hydratedLabels.includes("+ Specific property"));
    assert.ok(hydratedLabels.includes("+ Purchase intent"));
    assert.ok(hydratedLabels.includes("+ Timeline under 30 days"));
    assert.ok(hydratedLabels.includes("+ Viewing requested"));

    // Check structured nextActionDirective
    assert.ok(leadDto.nextActionDirective);
    assert.strictEqual(leadDto.nextActionDirective.priority, "Immediate");
    assert.strictEqual(leadDto.nextActionDirective.assignedTo, "Senior Sales Broker");

    console.log("✔ [TEST 7 PASSED] LeadDetailDto hydrates all factors, BANT scores, and directives.\n");

    // -------------------------------------------------------------
    // TEST 8: AI Agent Chat Integration End-to-End
    // -------------------------------------------------------------
    console.log("▶ [TEST 8] Verifying AI Agent Chat turn execution updates qualification & scores...");

    const chatRes = await fetch(`${baseUrl}/ai-agent/chat`, {
      method: "POST",
      headers: authHeadersAlpha,
      body: JSON.stringify({
        leadId: leadAlphaId,
        message: "I am ready to buy and want to schedule an in-person viewing of the 4-bedroom terrace duplex in Ikoyi tomorrow.",
      }),
    });

    const chatJson = await chatRes.json();
    assert.ok(chatRes.status === 200 || chatRes.status === 201, `Expected status 200/201, got ${chatRes.status}`);
    assert.ok(chatJson.data.reply);
    assert.ok(chatJson.data.qualification);
    assert.strictEqual(chatJson.data.qualification.decisionReadiness, "immediate_close");

    console.log("✔ [TEST 8 PASSED] AI Agent chat turn seamlessly integrates with scoring engine.\n");

    console.log("=========================================================");
    console.log(" ALL DAY 11 DETERMINISTIC QUALIFICATION TESTS PASSED (8/8 - 100%)");
    console.log("=========================================================\n");
  } finally {
    // -------------------------------------------------------------
    // TEARDOWN: Purge ephemeral test data from Neon PostgreSQL
    // -------------------------------------------------------------
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, wsA));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, wsB));
      await db.delete(schema.leadEvents).where(eq(schema.leadEvents.workspaceId, wsA));
      await db.delete(schema.leadEvents).where(eq(schema.leadEvents.workspaceId, wsB));
      await db.delete(schema.leadScores).where(eq(schema.leadScores.workspaceId, wsA));
      await db.delete(schema.leadScores).where(eq(schema.leadScores.workspaceId, wsB));
      await db.delete(schema.qualificationResults).where(eq(schema.qualificationResults.workspaceId, wsA));
      await db.delete(schema.qualificationResults).where(eq(schema.qualificationResults.workspaceId, wsB));
      await db.delete(schema.messages).where(eq(schema.messages.workspaceId, wsA));
      await db.delete(schema.conversations).where(eq(schema.conversations.workspaceId, wsA));
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

runDay11QualificationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ DAY 11 TEST RUN FAILED:", err);
    process.exit(1);
  });
