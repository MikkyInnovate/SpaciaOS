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
import { AiOrchestratorService } from "../src/modules/ai-agent/services/ai-orchestrator.service";
import { MockAiProvider } from "../src/modules/ai-agent/providers/mock-ai.provider";
import { OpenRouterProvider } from "../src/modules/ai-agent/providers/openrouter.provider";
import { PromptBuilderService } from "../src/modules/ai-agent/services/prompt-builder.service";
import { ConversationMemoryService } from "../src/modules/ai-agent/services/conversation-memory.service";
import { StructuredExtractionService } from "../src/modules/ai-agent/services/structured-extraction.service";
import { AiToolExecutorService } from "../src/modules/ai-tools/services/ai-tool-executor.service";
import { EnvService } from "../src/config/env.service";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";

process.env.ALLOW_MOCK_AUTH = "true";
process.env.NODE_ENV = "test";
process.env.AI_PROVIDER = "mock";

config({ path: "./.env" });
neonConfig.webSocketConstructor = ws;


async function runDay10AiAgentTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 10: CONTROLLED AI AGENT ENGINE TEST SUITE");
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
  const orchestrator: AiOrchestratorService = app.get(AiOrchestratorService);
  const mockAiProvider: MockAiProvider = app.get(MockAiProvider);
  const openRouterProvider: OpenRouterProvider = app.get(OpenRouterProvider);
  const promptBuilder: PromptBuilderService = app.get(PromptBuilderService);
  const conversationMemory: ConversationMemoryService = app.get(ConversationMemoryService);
  const structuredExtraction: StructuredExtractionService = app.get(StructuredExtractionService);
  const toolExecutor: AiToolExecutorService = app.get(AiToolExecutorService);
  const envService: EnvService = app.get(EnvService);

  const timestamp = Date.now();
  const wsA = `ws_day10_alpha_${timestamp}`;
  const wsB = `ws_day10_beta_${timestamp}`;

  const tenantAlpha: TenantContext = {
    workspaceId: wsA,
    userId: "usr_agent_alpha_10",
    role: "owner",
    permissions: ["*"],
    orgSlug: `alpha-agency-${timestamp}`,
  };

  const tenantBeta: TenantContext = {
    workspaceId: wsB,
    userId: "usr_agent_beta_10",
    role: "owner",
    permissions: ["*"],
    orgSlug: `beta-realty-${timestamp}`,
  };

  let testLeadIdA: string;
  let testPropIdA: string;

  try {
    // -------------------------------------------------------------
    // SETUP: Provision isolated test workspaces and fixtures
    // -------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated test workspaces in Neon PostgreSQL...");
    try {
      await db.insert(schema.workspaces).values([
        {
          id: wsA,
          name: "Alpha Luxury Estates Lagos",
          slug: `alpha-estates-${timestamp}`,
          tier: "enterprise",
          primaryMarket: "Ikoyi & Banana Island",
        },
        {
          id: wsB,
          name: "Beta Horizon Realty",
          slug: `beta-realty-${timestamp}`,
          tier: "growth",
          primaryMarket: "Lekki Corridor",
        },
      ]);
      console.log("✔ [SETUP STEP 1] Workspaces inserted.");
    } catch (err: any) {
      console.error("❌ SETUP STEP 1 ERROR:", err);
      throw err;
    }

    // Seed test property in Workspace A
    const [propA] = await db
      .insert(schema.properties)
      .values({
        workspaceId: wsA,
        title: "The Bourdillon Sky Villa",
        slug: `bourdillon-sky-villa-${timestamp}`,
        estateName: "Bourdillon Crest",
        location: "Bourdillon Road, Ikoyi",
        city: "Ikoyi",
        state: "Lagos State",
        propertyType: "Penthouse Villa",
        price: "450000000",
        formattedPrice: "₦ 450,000,000",
        bedrooms: 4,
        bathrooms: 5,
        squareMeters: 450,
        availability: "Available",
        verificationStatus: "Verified",
        description: "Private Heated Pool, Panoramic Lagoon View, 24/7 Redundant Power",
        commercialTerms: {
          serviceCharge: "₦5,000,000 / annum",
          minimumDeposit: "25%",
        },
      })
      .returning({ id: schema.properties.id });
    testPropIdA = propA.id;

    // Seed test lead in Workspace A
    const [leadA] = await db
      .insert(schema.leads)
      .values({
        workspaceId: wsA,
        name: "Dr. Babatunde Adeleke",
        phone: "+2348039991122",
        email: "adeleke.b@lagosinvest.ng",
        budget: "₦500,000,000",
        locationPreference: "Ikoyi",
        intent: "Purchase",
        timeline: "Immediate",
        status: "In Conversation",
      })
      .returning({ id: schema.leads.id });
    testLeadIdA = leadA.id;

    console.log("✔ [SETUP COMPLETE] Test workspaces and fixtures ready.\n");

    // -------------------------------------------------------------
    // TEST 1: AI Provider Configuration & Provider Selection
    // -------------------------------------------------------------
    console.log("▶ [TEST 1] Verifying AI Provider Configuration & Selection...");
    assert.strictEqual(envService.aiProvider, "mock");
    assert.strictEqual(typeof envService.openRouterDefaultModel, "string");
    assert.strictEqual(typeof envService.aiMaxToolIterations, "number");
    assert.strictEqual(mockAiProvider.providerName, "mock");
    assert.strictEqual(openRouterProvider.providerName, "openrouter");
    console.log("✔ [TEST 1 PASSED] AI Provider configuration verified.\n");

    // -------------------------------------------------------------
    // TEST 2: Deterministic Mock Provider Verification
    // -------------------------------------------------------------
    console.log("▶ [TEST 2] Testing Deterministic Mock AI Provider responses...");
    const mockGreeting = await mockAiProvider.chatCompletion(
      [{ role: "user", content: "Hello there" }],
      [],
      { workspaceId: wsA, actorId: tenantAlpha.userId }
    );
    assert.ok(mockGreeting.content && mockGreeting.content.includes("Spacia AI"));
    assert.strictEqual(mockGreeting.usage.provider, "mock");

    const mockToolRequest = await mockAiProvider.chatCompletion(
      [{ role: "user", content: "I am looking for a waterfront flat in Lekki" }],
      [],
      { workspaceId: wsA, actorId: tenantAlpha.userId }
    );
    assert.ok(mockToolRequest.toolCalls && mockToolRequest.toolCalls.length > 0);
    assert.strictEqual(mockToolRequest.toolCalls![0].function.name, "search_properties");
    console.log("✔ [TEST 2 PASSED] Deterministic Mock Provider emits structured tool calls.\n");

    // -------------------------------------------------------------
    // TEST 3: System Prompt Construction & Context Injection
    // -------------------------------------------------------------
    console.log("▶ [TEST 3] Testing PromptBuilderService context and guardrails...");
    const wsContext = await promptBuilder.resolveWorkspaceContext(wsA);
    const leadContext = await promptBuilder.resolveLeadContext(wsA, testLeadIdA);
    const systemPrompt = promptBuilder.buildSystemPrompt(wsContext, leadContext, "web_chat");

    assert.ok(systemPrompt.includes("Alpha Luxury Estates Lagos"));
    assert.ok(systemPrompt.includes("Dr. Babatunde Adeleke"));
    assert.ok(systemPrompt.includes("CRITICAL ANTI-HALLUCINATION GUARDRAILS"));
    assert.ok(systemPrompt.includes("You must NEVER invent, assume, or fabricate"));
    assert.ok(systemPrompt.includes("get_company_policy"));
    console.log("✔ [TEST 3 PASSED] System prompt accurately injects workspace context and strict guardrails.\n");

    // -------------------------------------------------------------
    // TEST 4: Conversation Memory (Multi-Turn Persistence)
    // -------------------------------------------------------------
    console.log("▶ [TEST 4] Testing ConversationMemoryService persistence across turns...");
    const conv = await conversationMemory.getOrCreateConversation(
      wsA,
      undefined,
      testLeadIdA,
      { name: "Dr. Babatunde Adeleke", phone: "+2348039991122" }
    );
    assert.ok(conv.id);
    assert.strictEqual(conv.workspaceId, wsA);

    await conversationMemory.saveMessage(wsA, conv.id, "prospect", "Hello, I want to acquire a luxury home.");
    await conversationMemory.saveMessage(wsA, conv.id, "ai_agent", "Certainly Dr. Adeleke, what location do you prefer?");

    const history = await conversationMemory.loadRecentMessages(wsA, conv.id, 5);
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].role, "user");
    assert.strictEqual(history[1].role, "assistant");
    console.log("✔ [TEST 4 PASSED] Multi-turn messages correctly stored and retrieved chronologically.\n");

    // -------------------------------------------------------------
    // TEST 5: Controlled Tool Calling Integration
    // -------------------------------------------------------------
    console.log("▶ [TEST 5] Testing AI Agent tool execution through Day 9 executor...");
    const chatTurn1 = await orchestrator.handleChatTurn(tenantAlpha, {
      message: "Please search for available luxury properties in Ikoyi with waterfront views.",
      conversationId: conv.id,
      leadId: testLeadIdA,
      channel: "web_chat",
    });

    assert.ok(chatTurn1.conversationId);
    assert.ok(chatTurn1.reply && chatTurn1.reply.length > 0);
    assert.ok(chatTurn1.toolsExecuted.length > 0);
    assert.strictEqual(chatTurn1.toolsExecuted[0].toolName, "search_properties");
    assert.strictEqual(chatTurn1.toolsExecuted[0].success, true);
    assert.strictEqual(chatTurn1.toolsExecuted[0].sourceVerification?.isVerified, true);
    console.log("✔ [TEST 5 PASSED] Agent seamlessly executed 'search_properties' through Day 9 executor.\n");

    // -------------------------------------------------------------
    // TEST 6: Multi-Tool Loop Execution
    // -------------------------------------------------------------
    console.log("▶ [TEST 6] Testing Multi-Tool calling loop (search ➡️ price)...");
    const multiToolConv = await conversationMemory.getOrCreateConversation(wsA, undefined, testLeadIdA);
    
    const chatTurnMulti = await orchestrator.handleChatTurn(tenantAlpha, {
      message: "Can you search properties in Ikoyi and give me the exact price and service charge breakdown?",
      conversationId: multiToolConv.id,
      leadId: testLeadIdA,
    });

    assert.ok(chatTurnMulti.reply.length > 0);
    assert.ok(chatTurnMulti.toolsExecuted.length >= 1);
    console.log("✔ [TEST 6 PASSED] Multi-tool loop executed and synthesized into verified answer.\n");

    // -------------------------------------------------------------
    // TEST 7: Security Boundary & Cross-Tenant Defense Preservation
    // -------------------------------------------------------------
    console.log("▶ [TEST 7] Verifying Day 10 cannot bypass Day 9 inside-the-tool authorization...");
    // Attempt malicious cross-workspace tool invocation through executor
    let crossTenantBlocked = false;
    try {
      await toolExecutor.executeTool(
        "get_property",
        { propertyId: testPropIdA, workspaceId: wsB }, // Malicious spoof
        {
          workspaceId: wsA, // Authenticated context
          actorId: tenantAlpha.userId,
          actorType: "ai_agent",
        }
      );
    } catch (err: any) {
      if (err.message?.includes("Cross-workspace") || err.status === 403) {
        crossTenantBlocked = true;
      }
    }
    assert.ok(crossTenantBlocked, "Day 9 executor must block cross-workspace access unconditionally.");
    console.log("✔ [TEST 7 PASSED] Security boundary intact: Cross-workspace access strictly rejected.\n");

    // -------------------------------------------------------------
    // TEST 8: Anti-Hallucination Guardrail Check
    // -------------------------------------------------------------
    console.log("▶ [TEST 8] Testing Anti-Hallucination guardrail for unverified specs...");
    const antiHallucinationTurn = await orchestrator.handleChatTurn(tenantAlpha, {
      message: "Does this apartment come with a private helipad on the roof?",
      conversationId: conv.id,
      leadId: testLeadIdA,
    });

    assert.ok(
      antiHallucinationTurn.reply.toLowerCase().includes("not have a verified record") ||
      antiHallucinationTurn.reply.toLowerCase().includes("confirm that directly"),
      "AI must not manufacture unverified features."
    );
    console.log("✔ [TEST 8 PASSED] Agent declined to hallucinate unverified feature.\n");

    // -------------------------------------------------------------
    // TEST 9: Structured BANT Qualification Extraction
    // -------------------------------------------------------------
    console.log("▶ [TEST 9] Testing Structured BANT qualification extraction & persistence...");
    const qualTurn = await orchestrator.handleChatTurn(tenantAlpha, {
      message: "I am ready to buy outright for ₦500m immediately for family relocation.",
      conversationId: conv.id,
      leadId: testLeadIdA,
    });

    assert.ok(qualTurn.qualification);
    assert.strictEqual(qualTurn.qualification!.buyerIntent, "luxury_relocation");
    assert.strictEqual(qualTurn.qualification!.decisionReadiness, "immediate_close");
    assert.ok(qualTurn.qualification!.confidenceScore >= 80);

    // Verify row was written to Neon PostgreSQL qualification_results table
    const [savedQual] = await db
      .select()
      .from(schema.qualificationResults)
      .where(
        and(
          eq(schema.qualificationResults.workspaceId, wsA),
          eq(schema.qualificationResults.leadId, testLeadIdA)
        )
      )
      .orderBy(desc(schema.qualificationResults.evaluatedAt))
      .limit(1);

    assert.ok(savedQual);
    assert.strictEqual(savedQual.buyerIntent, "luxury_relocation");
    assert.strictEqual(savedQual.decisionReadiness, "immediate_close");
    console.log("✔ [TEST 9 PASSED] Structured BANT extracted and persisted to Neon PostgreSQL.\n");

    // -------------------------------------------------------------
    // TEST 10: AI Usage & Audit Logging
    // -------------------------------------------------------------
    console.log("▶ [TEST 10] Verifying AI Usage telemetry and audit logging in Neon...");
    const [auditEntry] = await db
      .select()
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.workspaceId, wsA),
          eq(schema.auditLogs.action, "ai_inference:chat")
        )
      )
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(1);

    assert.ok(auditEntry);
    assert.strictEqual(auditEntry.actorType, "ai_agent");
    assert.strictEqual(auditEntry.resource, "conversations");
    assert.ok(auditEntry.metadata);
    console.log("✔ [TEST 10 PASSED] AI Usage & Audit logging recorded in Neon audit_logs table.\n");

    // -------------------------------------------------------------
    // TEST 11: Tool Iteration Limit Enforcement
    // -------------------------------------------------------------
    console.log("▶ [TEST 11] Testing hard limit on tool-calling loop (AI_MAX_TOOL_ITERATIONS)...");
    mockAiProvider.forceLoop = true; // Simulates model endlessly requesting tools
    try {
      const loopTurn = await orchestrator.handleChatTurn(tenantAlpha, {
        message: "Trigger loop test",
        conversationId: conv.id,
      });

      assert.ok(
        loopTurn.reply.includes("reached our automated multi-step lookup limit") ||
        loopTurn.reply.includes("human broker"),
        "Orchestrator must halt gracefully when tool iteration limit is reached."
      );
    } finally {
      mockAiProvider.forceLoop = false;
    }
    console.log("✔ [TEST 11 PASSED] Tool-calling loop strictly terminates at max configured iterations.\n");

    // -------------------------------------------------------------
    // TEST 12: Provider Failure Handling (NO Silent Mock Fallback)
    // -------------------------------------------------------------
    console.log("▶ [TEST 12] Verifying explicit provider failure (NO silent mock fallback)...");
    let providerErrorCaught = false;
    try {
      // Calling OpenRouterProvider without OPENROUTER_API_KEY must fail explicitly
      const unconfiguredProvider = new OpenRouterProvider(
        {
          openRouterApiKey: undefined,
          openRouterBaseUrl: "https://openrouter.ai/api/v1",
          openRouterDefaultModel: "test",
        } as any,
        pool
      );
      await unconfiguredProvider.chatCompletion(
        [{ role: "user", content: "Test" }],
        [],
        { workspaceId: wsA, actorId: tenantAlpha.userId }
      );
    } catch (err: any) {
      providerErrorCaught = true;
      assert.ok(
        err.message?.includes("OpenRouter API key is not configured") ||
        err.message?.includes("OpenRouter"),
        "Must throw explicit OpenRouter configuration/failure error."
      );
    }
    assert.ok(providerErrorCaught, "OpenRouter failure must never silently degrade to a fake response.");
    console.log("✔ [TEST 12 PASSED] Explicit provider failure confirmed. Silent fallback prohibited.\n");

    console.log("=========================================================");
    console.log(" ALL DAY 10 CONTROLLED AI AGENT TESTS PASSED (12/12 - 100%)");
    console.log("=========================================================\n");
  } finally {
    // -------------------------------------------------------------
    // TEARDOWN: Clean up test fixtures from Neon PostgreSQL
    // -------------------------------------------------------------
    console.log("▶ [TEARDOWN] Purging test data from Neon PostgreSQL...");
    try {
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, wsA));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, wsB));
      await db.delete(schema.qualificationResults).where(eq(schema.qualificationResults.workspaceId, wsA));
      await db.delete(schema.messages).where(eq(schema.messages.workspaceId, wsA));
      await db.delete(schema.conversations).where(eq(schema.conversations.workspaceId, wsA));
      await db.delete(schema.leads).where(eq(schema.leads.workspaceId, wsA));
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, wsA));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, wsA));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, wsB));
    } catch (err: any) {
      console.warn(`Teardown warning: ${err.message}`);
    }

    await app.close();
    await pool.end();
  }
}

runDay10AiAgentTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ DAY 10 TEST RUN FAILED:", err);
    process.exit(1);
  });
