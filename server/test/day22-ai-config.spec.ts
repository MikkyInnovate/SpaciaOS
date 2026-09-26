/**
 * PACIA DAY 22: MANAGED AI CONFIGURATION TEST SUITE
 * 
 * Verifies end-to-end:
 * 1. AI configuration persistence in Neon PostgreSQL (all 8 parameters)
 * 2. Workspace-scoped configuration & multi-tenant isolation
 * 3. Configuration validation (strict schema rules, DTO boundaries)
 * 4. AI context injection (system prompt generation, runtime persona grounding)
 * 5. Dynamic business hours calculation & human escalation checks
 * 6. Configuration reset to Spacia luxury baseline
 */

const assert = require("assert");
import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { eq } from "drizzle-orm";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { AppModule } from "../src/app.module";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";
import { AiConfigService, DEFAULT_AI_CONFIG } from "../src/modules/ai-agent/services/ai-config.service";
import { PromptBuilderService } from "../src/modules/ai-agent/services/prompt-builder.service";
import { UpdateAiConfigDto } from "../src/modules/ai-agent/dto/ai-config.dto";

neonConfig.webSocketConstructor = ws;

async function runDay22AiConfigTestSuite() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 22: MANAGED AI CONFIGURATION TEST SUITE");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const aiConfigService = app.get<AiConfigService>(AiConfigService);
  const promptBuilder = app.get<PromptBuilderService>(PromptBuilderService);

  const TEST_WS_A = `ws_day22_spacia_a_${Date.now()}`;
  const TEST_WS_B = `ws_day22_spacia_b_${Date.now()}`;

  const tenantA: TenantContext = {
    workspaceId: TEST_WS_A,
    userId: "user_broker_a",
    role: "admin",
    permissions: ["leads:read", "leads:write"],
  };

  const tenantB: TenantContext = {
    workspaceId: TEST_WS_B,
    userId: "user_broker_b",
    role: "admin",
    permissions: ["leads:read", "leads:write"],
  };

  try {
    // -------------------------------------------------------------
    // SETUP: Provision isolated Neon PostgreSQL Workspaces
    // -------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated workspaces in Neon DB...");
    await db.insert(schema.workspaces).values([
      { id: TEST_WS_A, name: "Spacia Prime Victoria Island", slug: `spacia-vi-${Date.now()}` },
      { id: TEST_WS_B, name: "Spacia Banana Island Office", slug: `spacia-bi-${Date.now()}` },
    ]);

    // -------------------------------------------------------------
    // TEST 1: Default Baseline Configuration Provisioning (All 8 Fields)
    // -------------------------------------------------------------
    console.log("▶ [TEST 1] Verifying automatic baseline provisioning of 8 AI parameters...");
    const configA = await aiConfigService.getOrCreateConfig(TEST_WS_A);

    assert.strictEqual(configA.workspaceId, TEST_WS_A, "Config workspace ID must match");
    assert.strictEqual(configA.name, "Amara", "Default AI agent name must be Amara");
    assert.strictEqual(configA.voice, "en-NG-EzinneNeural", "Default voice must be en-NG-EzinneNeural");
    assert.strictEqual(configA.tone, "luxury_professional", "Default tone must be luxury_professional");
    assert.strictEqual(configA.language, "en-NG", "Default language must be en-NG");
    assert.ok(configA.greeting.includes("Spacia"), "Default greeting must mention Spacia");
    
    // Business Hours
    assert.strictEqual(configA.businessHours.enabled, true, "Business hours must be enabled by default");
    assert.strictEqual(configA.businessHours.start, "08:00", "Default start time must be 08:00");
    assert.strictEqual(configA.businessHours.end, "19:00", "Default end time must be 19:00");
    assert.strictEqual(configA.businessHours.timezone, "Africa/Lagos", "Default timezone must be Africa/Lagos");

    // Escalation Rules
    assert.ok(Array.isArray(configA.escalationRules.humanTakeoverKeywords), "Keywords must be an array");
    assert.ok(configA.escalationRules.humanTakeoverKeywords.includes("human"), "Escalation keywords must include 'human'");
    assert.strictEqual(configA.escalationRules.budgetThresholdNaira, 500000000, "Default escalation budget must be ₦500,000,000");

    // Follow-up Rules
    assert.strictEqual(configA.followUpRules.maxAttempts, 3, "Default max follow-up attempts must be 3");
    assert.strictEqual(configA.followUpRules.intervalHours, 24, "Default follow-up interval must be 24h");
    assert.ok(configA.followUpRules.channelOrder.includes("whatsapp"), "Channel order must include whatsapp");

    console.log("  ✔ Default AI configuration successfully persisted in Neon DB with all 8 parameters.");

    // -------------------------------------------------------------
    // TEST 2: Configuration Validation (DTO & Business Constraints)
    // -------------------------------------------------------------
    console.log("▶ [TEST 2] Verifying configuration validation rejecting invalid DTOs...");

    // Test invalid time format
    const invalidTimeDto = plainToInstance(UpdateAiConfigDto, {
      businessHours: {
        enabled: true,
        start: "25:99", // Invalid HH:mm
        end: "19:00",
        timezone: "Africa/Lagos",
        days: ["monday"],
      },
    });
    const timeErrors = await validate(invalidTimeDto);
    assert.ok(timeErrors.length > 0, "Validation must reject invalid time format '25:99'");

    // Test invalid tone
    const invalidToneDto = plainToInstance(UpdateAiConfigDto, {
      tone: "unhinged_aggressive" as any,
    });
    const toneErrors = await validate(invalidToneDto);
    assert.ok(toneErrors.length > 0, "Validation must reject unsupported tone");

    // Test invalid language
    const invalidLangDto = plainToInstance(UpdateAiConfigDto, {
      language: "fr-FR" as any,
    });
    const langErrors = await validate(invalidLangDto);
    assert.ok(langErrors.length > 0, "Validation must reject unsupported language");

    // Test negative budget threshold
    const invalidBudgetDto = plainToInstance(UpdateAiConfigDto, {
      escalationRules: {
        humanTakeoverKeywords: ["broker"],
        budgetThresholdNaira: -5000, // Negative budget
        maxNegativeSentiments: 2,
        requireHumanForContracts: true,
      },
    });
    const budgetErrors = await validate(invalidBudgetDto);
    assert.ok(budgetErrors.length > 0, "Validation must reject negative budget threshold");

    console.log("  ✔ Configuration validation successfully enforces all strict boundaries.");

    // -------------------------------------------------------------
    // TEST 3: Workspace AI Configuration Persistence & Update
    // -------------------------------------------------------------
    console.log("▶ [TEST 3] Updating all 8 configuration parameters for Workspace A...");

    const updatedConfigA = await aiConfigService.updateConfig(TEST_WS_A, {
      name: "Zainab - Senior Acquisition Director",
      voice: "en-NG-AbeoNeural",
      tone: "consultative",
      language: "en-NG",
      greeting: "Welcome to Spacia Private Client Office. I am Zainab, your dedicated acquisition advisor.",
      businessHours: {
        enabled: true,
        start: "09:00",
        end: "18:00",
        timezone: "Africa/Lagos",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      },
      escalationRules: {
        humanTakeoverKeywords: ["lawyer", "scam", "dispute", "litigation", "speak to partner"],
        budgetThresholdNaira: 1000000000, // ₦1 Billion
        maxNegativeSentiments: 1,
        requireHumanForContracts: true,
      },
      followUpRules: {
        maxAttempts: 5,
        intervalHours: 12,
        autoArchiveUnresponsiveDays: 14,
        channelOrder: ["whatsapp", "voice", "sms"],
      },
    });

    assert.strictEqual(updatedConfigA.name, "Zainab - Senior Acquisition Director");
    assert.strictEqual(updatedConfigA.voice, "en-NG-AbeoNeural");
    assert.strictEqual(updatedConfigA.tone, "consultative");
    assert.strictEqual(updatedConfigA.businessHours.start, "09:00");
    assert.strictEqual(updatedConfigA.businessHours.end, "18:00");
    assert.strictEqual(updatedConfigA.escalationRules.budgetThresholdNaira, 1000000000);
    assert.strictEqual(updatedConfigA.followUpRules.maxAttempts, 5);

    // Verify direct database read to ensure persistence
    const [persistedRow] = await db
      .select()
      .from(schema.aiAgentConfigs)
      .where(eq(schema.aiAgentConfigs.workspaceId, TEST_WS_A))
      .limit(1);

    assert.strictEqual(persistedRow.name, "Zainab - Senior Acquisition Director");
    assert.strictEqual(persistedRow.tone, "consultative");
    assert.strictEqual(persistedRow.escalationRules.budgetThresholdNaira, 1000000000);
    console.log("  ✔ All 8 configuration parameters persistently updated in Neon PostgreSQL.");

    // -------------------------------------------------------------
    // TEST 4: Multi-Tenant Workspace Isolation
    // -------------------------------------------------------------
    console.log("▶ [TEST 4] Verifying strict multi-tenant isolation across workspaces...");

    // Workspace B queries config - should still have its independent default baseline
    const configB = await aiConfigService.getOrCreateConfig(TEST_WS_B);
    assert.strictEqual(configB.name, "Amara", "Workspace B agent name must NOT be mutated by Workspace A");
    assert.strictEqual(configB.tone, "luxury_professional", "Workspace B tone must remain default");
    assert.strictEqual(configB.escalationRules.budgetThresholdNaira, 500000000, "Workspace B budget threshold must remain default");

    console.log("  ✔ Multi-tenant isolation verified: Workspace B configuration remains completely distinct.");

    // -------------------------------------------------------------
    // TEST 5: AI Context Injection into Prompt Generation
    // -------------------------------------------------------------
    console.log("▶ [TEST 5] Verifying AI Context Injection into PromptBuilderService...");

    const wsContext = await promptBuilder.resolveWorkspaceContext(TEST_WS_A);
    const resolvedConfig = await promptBuilder.resolveAiConfig(TEST_WS_A);
    assert.ok(resolvedConfig, "Resolved AI config must not be null");

    const systemPrompt = promptBuilder.buildSystemPrompt(
      wsContext,
      {
        fullName: "Chief Aliko Danjuma",
        declaredInterest: "Banana Island Waterfront Villa",
        budgetRange: "₦1,500,000,000",
      },
      "web_chat",
      resolvedConfig
    );

    // Verify context injection of configured name, tone, greeting, and escalation rules
    assert.ok(systemPrompt.includes("Zainab - Senior Acquisition Director"), "Prompt must inject configured agent name");
    assert.ok(systemPrompt.includes("Consultative, advisory, and diagnostic"), "Prompt must inject consultative tone instructions");
    assert.ok(systemPrompt.includes("Welcome to Spacia Private Client Office"), "Prompt must inject opening greeting baseline");
    assert.ok(systemPrompt.includes("09:00 to 18:00"), "Prompt must inject operating hours");
    assert.ok(systemPrompt.includes("speak to partner"), "Prompt must inject custom escalation keywords");
    assert.ok(systemPrompt.includes("1,000,000,000"), "Prompt must inject ₦1B high-value escalation threshold");
    assert.ok(systemPrompt.includes("Max Follow-up Sequences: 5 attempts"), "Prompt must inject follow-up attempts rule");

    console.log("  ✔ AI Context Injection verified: Prompt perfectly grounds agent with workspace-configured parameters.");

    // -------------------------------------------------------------
    // TEST 6: Runtime Escalation & Business Hours Evaluation
    // -------------------------------------------------------------
    console.log("▶ [TEST 6] Testing runtime business hours & escalation rule checks...");

    // Escalation Keyword trigger
    const escResult1 = aiConfigService.checkEscalation(
      updatedConfigA,
      "I need to speak to partner immediately regarding contract disputes."
    );
    assert.strictEqual(escResult1.shouldEscalate, true, "Keyword 'speak to partner' must trigger escalation");

    // High-Budget trigger
    const escResult2 = aiConfigService.checkEscalation(
      updatedConfigA,
      "I am ready to inspect the penthouse today.",
      1500000000 // ₦1.5B >= ₦1B
    );
    assert.strictEqual(escResult2.shouldEscalate, true, "Budget ₦1.5B must trigger high-value escalation");

    // Standard non-escalating turn
    const escResult3 = aiConfigService.checkEscalation(
      updatedConfigA,
      "What are the available 4-bedroom listings in Ikoyi?",
      450000000
    );
    assert.strictEqual(escResult3.shouldEscalate, false, "Standard inquiry must not trigger escalation");

    console.log("  ✔ Escalation checks successfully evaluate keywords and budget thresholds.");

    // -------------------------------------------------------------
    // TEST 7: Reset Configuration to Baseline
    // -------------------------------------------------------------
    console.log("▶ [TEST 7] Resetting Workspace A configuration to Spacia luxury baseline...");

    const resetConfig = await aiConfigService.resetConfig(TEST_WS_A);
    assert.strictEqual(resetConfig.name, "Amara", "Reset config must restore default name Amara");
    assert.strictEqual(resetConfig.tone, "luxury_professional", "Reset config must restore luxury_professional tone");
    assert.strictEqual(resetConfig.escalationRules.budgetThresholdNaira, 500000000, "Reset config must restore ₦500M budget threshold");

    console.log("  ✔ Workspace configuration successfully reset to baseline.");

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("▶ [CLEANUP] Cleaning up test fixtures in Neon DB...");
    await db.delete(schema.aiAgentConfigs).where(eq(schema.aiAgentConfigs.workspaceId, TEST_WS_A));
    await db.delete(schema.aiAgentConfigs).where(eq(schema.aiAgentConfigs.workspaceId, TEST_WS_B));
    await db.delete(schema.aiAgents).where(eq(schema.aiAgents.workspaceId, TEST_WS_A));
    await db.delete(schema.aiAgents).where(eq(schema.aiAgents.workspaceId, TEST_WS_B));
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_A));
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_B));

    console.log("\n=========================================================");
    console.log(" ✅ ALL PACIA DAY 22 AI CONFIGURATION TESTS PASSED!");
    console.log("=========================================================\n");

    await app.close();
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    try {
      await app.close();
    } catch {}
    process.exit(1);
  }
}

runDay22AiConfigTestSuite();
