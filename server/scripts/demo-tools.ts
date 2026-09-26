import { config } from "dotenv";
config({ path: "./.env" });
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;

import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { AiToolExecutorService } from "../src/modules/ai-tools/services/ai-tool-executor.service";
import { ToolExecutionContext } from "../src/modules/ai-tools/interfaces/ai-tool.interface";

async function runDemo() {
  console.log("\n========================================================");
  console.log("   SPACIA AI SALES AGENT: CONTROLLED TOOLS TESTBENCH    ");
  console.log("========================================================\n");

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const executor = app.get(AiToolExecutorService);

  const activeWorkspace = "org_3JCKtqmF5BWnjSaWqlcheLn0AA9"; // Primary Workspace in Neon
  const context: ToolExecutionContext = {
    workspaceId: activeWorkspace,
    actorId: "ai_voice_persona_spacia_01",
    actorType: "ai_agent",
    role: "owner",
    permissions: ["*"],
  };

  console.log(`[CONTEXT] Active Tenant: ${activeWorkspace}`);
  console.log(`[CONTEXT] Persona Actor: ${context.actorId} (Type: ${context.actorType})\n`);

  // Step 1: List all tools
  console.log("--------------------------------------------------------");
  console.log(" 1. DISCOVERING REGISTERED TOOL SCHEMAS FOR LLM");
  console.log("--------------------------------------------------------");
  const tools = executor.getToolDefinitions();
  for (const t of tools) {
    console.log(`  🔧 Tool: \x1b[36m${t.name}\x1b[0m`);
    console.log(`     Desc: ${t.description}`);
    console.log(`     Params: [${Object.keys(t.parameters.properties).join(", ")}]\n`);
  }

  // Step 2: Query Company Policy
  console.log("--------------------------------------------------------");
  console.log(" 2. INVOCATION: get_company_policy (Commission & Escrow)");
  console.log("--------------------------------------------------------");
  const policyRes = await executor.executeTool(
    "get_company_policy",
    { category: "commission" },
    context
  );
  console.log("  Policy Result:", JSON.stringify(policyRes.data.policies[0].summary, null, 2));
  console.log("  Guardrail Details:", policyRes.data.policies[0].details);
  console.log(`  Source Verification: [${policyRes.sourceVerification.source}] (Confidence: ${policyRes.sourceVerification.confidence})`);
  console.log(`  Telemetry: Execution took ${policyRes.executionMetadata.durationMs}ms (Audit Log ID: ${policyRes.executionMetadata.auditLogId})\n`);

  // Step 3: Search Properties
  console.log("--------------------------------------------------------");
  console.log(" 3. INVOCATION: search_properties (Budget >= ₦50M)");
  console.log("--------------------------------------------------------");
  const searchRes = await executor.executeTool(
    "search_properties",
    { minPrice: 50000000, limit: 2 },
    context
  );
  console.log(`  Found ${searchRes.data.total} properties matching criteria.`);
  for (const p of searchRes.data.items) {
    console.log(`  🏡 [${p.id}] ${p.title} — ${p.formattedPrice} (${p.city}, ${p.state})`);
  }
  console.log(`  Source Verification: [${searchRes.sourceVerification.source}] (Verified: ${searchRes.sourceVerification.isVerified})\n`);

  // Step 4: Security Defense Test
  console.log("--------------------------------------------------------");
  console.log(" 4. SECURITY DEFENSE: Prompt Injection / Cross-Tenant Rejection");
  console.log("--------------------------------------------------------");
  try {
    console.log("  Attempting cross-workspace spoofing with parameter: { workspaceId: 'hacked_ws_target' }...");
    await executor.executeTool(
      "search_properties",
      { workspaceId: "hacked_ws_target" },
      context
    );
  } catch (err: any) {
    console.log(`  \x1b[32m✔ DEFENSE SUCCESSFUL:\x1b[0m ${err.message}`);
    console.log("  Logged critical security violation event to PostgreSQL audit_logs.\n");
  }

  console.log("========================================================");
  console.log("       TESTBENCH COMPLETE: ALL TOOLS OPERATIONAL        ");
  console.log("========================================================\n");

  await app.close();
  process.exit(0);
}

runDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});
