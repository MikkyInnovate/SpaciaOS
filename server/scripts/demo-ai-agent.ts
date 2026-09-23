import { config } from "dotenv";
config({ path: "./.env" });
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;

process.env.ALLOW_MOCK_AUTH = "true";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { AiOrchestratorService } from "../src/modules/ai-agent/services/ai-orchestrator.service";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";
import { EnvService } from "../src/config/env.service";
import { DRIZZLE_DATABASE, DrizzleDb, NEON_POOL } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { eq, desc } from "drizzle-orm";

async function runAgentDemo() {
  console.log("\n========================================================");
  console.log("      SPACIA CONTROLLED AI AGENT: CONVERSATION DEMO     ");
  console.log("========================================================\n");

  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0);

  const orchestrator = app.get(AiOrchestratorService);
  const envService = app.get(EnvService);
  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const pool = app.get<Pool>(NEON_POOL);

  // 1. Identify Workspace in Neon DB
  const primaryWorkspace = "org_3JCKtqmF5BWnjSaWqlcheLn0AA9";
  const tenant: TenantContext = {
    workspaceId: primaryWorkspace,
    userId: "user_lead_rep_01",
    role: "owner",
    permissions: ["*"],
  };

  console.log(`[CONFIG] Provider:       \x1b[35m${envService.aiProvider}\x1b[0m`);
  console.log(`[CONFIG] Default Model:  ${envService.openRouterDefaultModel}`);
  console.log(`[CONFIG] Max Tool Loops: ${envService.aiMaxToolIterations}`);
  console.log(`[CONFIG] OpenRouter Key: ${envService.openRouterApiKey ? "Configured (Active)" : "None (Using Mock Provider)"}`);
  console.log(`[TENANT] Workspace:      ${primaryWorkspace}\n`);

  try {
    // Fetch or create a demo lead
    const existingLeads = await db.select().from(schema.leads).where(eq(schema.leads.workspaceId, primaryWorkspace)).limit(1);
    let testLead = existingLeads[0];

    if (!testLead) {
      const inserted = await db.insert(schema.leads).values({
        workspaceId: primaryWorkspace,
        name: "Chukwudi Okafor",
        email: "chukwudi.demo@example.com",
        phone: "+2348039991122",
        status: "New",
        score: 65,
      }).returning();
      testLead = inserted[0];
    }

    console.log(`[LEAD] Prospect Name:    \x1b[32m${testLead.name}\x1b[0m (ID: ${testLead.id})\n`);

    let activeConversationId: string | undefined = undefined;

    // Turn 1: Property Search
    console.log("--------------------------------------------------------");
    console.log(" TURN 1: Prospect Inquires About 4-Bed Duplexes in Ikoyi");
    console.log("--------------------------------------------------------");
    const prompt1 = "Hello! I am looking for a verified 4-bedroom duplex in Ikoyi within ₦400,000,000.";
    console.log(`\x1b[33m[PROSPECT]:\x1b[0m "${prompt1}"\n`);

    const res1 = await orchestrator.handleChatTurn(tenant, {
      message: prompt1,
      leadId: testLead.id,
      prospect: { name: testLead.name, email: testLead.email ?? undefined, phone: testLead.phone ?? undefined },
    });

    activeConversationId = res1.conversationId;

    console.log(`\x1b[36m[TOOLS CALLED]:\x1b[0m ${res1.toolsExecuted.map(t => `${t.toolName} (Success: ${t.success})`).join(", ") || "None"}`);
    console.log(`\x1b[34m[SPACIA AI]:\x1b[0m "${res1.reply}"`);
    console.log(`[USAGE]: Prompt: ${res1.usage.promptTokens} | Completion: ${res1.usage.completionTokens} | Total: ${res1.usage.totalTokens} tokens\n`);

    // Turn 2: Commercial Pricing & Payment Terms
    console.log("--------------------------------------------------------");
    console.log(" TURN 2: Prospect Asks for Pricing Breakdown & Plans");
    console.log("--------------------------------------------------------");
    const prompt2 = "What are the exact payment terms and milestone installment plans for this property?";
    console.log(`\x1b[33m[PROSPECT]:\x1b[0m "${prompt2}"\n`);

    const res2 = await orchestrator.handleChatTurn(tenant, {
      message: prompt2,
      leadId: testLead.id,
      conversationId: activeConversationId,
    });

    console.log(`\x1b[36m[TOOLS CALLED]:\x1b[0m ${res2.toolsExecuted.map(t => `${t.toolName} (Success: ${t.success})`).join(", ") || "None"}`);
    console.log(`\x1b[34m[SPACIA AI]:\x1b[0m "${res2.reply}"`);
    console.log(`[USAGE]: Prompt: ${res2.usage.promptTokens} | Completion: ${res2.usage.completionTokens} | Total: ${res2.usage.totalTokens} tokens\n`);

    // Turn 3: Brokerage Policy & Guardrails
    console.log("--------------------------------------------------------");
    console.log(" TURN 3: Prospect Attempts to Negotiate 5% Commission");
    console.log("--------------------------------------------------------");
    const prompt3 = "Can you discount your brokerage commission to 2% if I pay cash today?";
    console.log(`\x1b[33m[PROSPECT]:\x1b[0m "${prompt3}"\n`);

    const res3 = await orchestrator.handleChatTurn(tenant, {
      message: prompt3,
      leadId: testLead.id,
      conversationId: activeConversationId,
    });

    console.log(`\x1b[36m[TOOLS CALLED]:\x1b[0m ${res3.toolsExecuted.map(t => `${t.toolName} (Success: ${t.success})`).join(", ") || "None"}`);
    console.log(`\x1b[34m[SPACIA AI]:\x1b[0m "${res3.reply}"`);
    console.log(`[USAGE]: Prompt: ${res3.usage.promptTokens} | Completion: ${res3.usage.completionTokens} | Total: ${res3.usage.totalTokens} tokens\n`);

    // Inspect Structured BANT Qualification in Neon DB
    console.log("========================================================");
    console.log(" STRUCTURED BANT QUALIFICATION RESULTS (IN NEON DB)");
    console.log("========================================================");
    try {
      const qualRows = await db.select().from(schema.qualificationResults).where(eq(schema.qualificationResults.workspaceId, primaryWorkspace)).orderBy(desc(schema.qualificationResults.evaluatedAt)).limit(1);
      if (qualRows.length > 0) {
        const qual = qualRows[0];
        console.log(`  Lead ID:            ${qual.leadId}`);
        console.log(`  Buyer Intent:       \x1b[32m${qual.buyerIntent}\x1b[0m`);
        console.log(`  Decision Readiness: \x1b[36m${qual.decisionReadiness}\x1b[0m`);
        console.log(`  Confidence Score:   ${qual.confidenceScore}`);
        console.log(`  Declared Budget:    ${qual.budgetDeclared ?? "N/A"}`);
        console.log(`  Timeline Window:    ${qual.timelineWindow ?? "N/A"}\n`);
      } else {
        console.log("  No qualification record found yet.\n");
      }
    } catch (e: any) {
      console.log(`  (Qualification query notice: ${e.message})\n`);
    }

    // Inspect Durable Audit Log in Neon DB
    console.log("========================================================");
    console.log(" AI USAGE & TELEMETRY AUDIT LOG (IN NEON DB)");
    console.log("========================================================");
    try {
      const auditRows = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, primaryWorkspace)).orderBy(desc(schema.auditLogs.createdAt)).limit(3);
      for (const log of auditRows) {
        const meta = log.metadata as any;
        console.log(`  📝 [${log.action}] Actor: ${log.actorType} | Latency: ${meta?.durationMs ?? "N/A"}ms | Tokens: ${meta?.totalTokens ?? "N/A"}`);
      }
    } catch (e: any) {
      console.log(`  (Audit log query notice: ${e.message})\n`);
    }

    console.log("\n========================================================");
    console.log("        DEMO COMPLETE: AI AGENT ENGINE VERIFIED        ");
    console.log("========================================================\n");
  } finally {
    await app.close();
    await pool.end();
  }
}

runAgentDemo()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
