import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is missing!");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function simulateFailure() {
  const workspaceId = process.env.ACTIVE_WORKSPACE_ID || "org_3JCKtqmF5BWnjSaWqlcheLn0AA9";

  console.log(`\n=========================================================`);
  console.log(` SIMULATING WORKFLOW FAILURE FOR DAY 25 OPS TEST`);
  console.log(` Target Workspace: ${workspaceId}`);
  console.log(`=========================================================\n`);

  // Find or create a lead in this workspace
  let leads = await sql`SELECT id, name, phone, email FROM leads WHERE workspace_id = ${workspaceId} LIMIT 1`;
  let leadId = leads[0]?.id;
  let leadName = leads[0]?.name || "Day 25 Test Prospect";

  if (!leadId) {
    const [newLead] = await sql`
      INSERT INTO leads (workspace_id, name, phone, email, status, score, budget)
      VALUES (${workspaceId}, 'Day 25 Test Prospect', '+2348099887766', 'ops.test@spacia.io', 'Qualified', 85, '₦850,000,000')
      RETURNING id, name;
    `;
    leadId = newLead.id;
    leadName = newLead.name;
  }

  // Insert a failed workflow event
  const [failedEvent] = await sql`
    INSERT INTO system_events (
      workspace_id, type, status, payload, retries, max_retries, created_at
    ) VALUES (
      ${workspaceId},
      'WorkflowFailed',
      'failed',
      ${JSON.stringify({
        eventType: "lead.ingested.vapi_dispatch",
        leadId,
        leadName,
        phone: "+2348099887766",
        error: "Vapi outbound voice telephony handshake timed out after 30s. Rate limit encountered on carrier SIP trunk.",
        source: "website_inquiry",
      })},
      0,
      3,
      NOW()
    )
    RETURNING id;
  `;

  console.log(`✔ Injected failed workflow event ID: ${failedEvent.id}`);
  console.log(`✔ Associated with Lead: ${leadName} (${leadId})`);
  console.log(`\nNow open your browser and navigate to:`);
  console.log(`👉 http://localhost:3000/ops\n`);
  console.log(`What you will see:`);
  console.log(`1. Top pulse indicator will show [DEGRADED] (Amber pill).`);
  console.log(`2. "Failed Workflows" & "Consolidated Errors" metric counters incremented.`);
  console.log(`3. Under the "Workflows" tab (or "Errors" tab), locate event #${failedEvent.id.slice(0, 8)}.`);
  console.log(`4. Click the "Retry" button to trigger the 1-click recovery!`);
  console.log(`5. The event transitions to "processing", error resolves, and system returns to "ACTIVE".\n`);
}

simulateFailure()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Simulation failed:", err);
    process.exit(1);
  });
