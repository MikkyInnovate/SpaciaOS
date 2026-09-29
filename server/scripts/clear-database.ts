import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is missing in environment!");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function clearDatabase() {
  console.log("=================================================================");
  console.log(" SPACIA DATABASE RESET: CLEARING ALL DATA (PRESERVING SCHEMA)");
  console.log("=================================================================");
  console.log("Connecting to Neon PostgreSQL...");

  // Query all existing tables in public schema
  const tableRows = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '__drizzle%'
    ORDER BY table_name;
  `;

  const tableNames = tableRows.map((r: any) => r.table_name);
  console.log(`Found ${tableNames.length} tables to truncate:`);
  console.log(tableNames.join(", "));

  if (tableNames.length === 0) {
    console.log("No tables found to clear.");
    return;
  }

  // Truncate all tables with CASCADE
  console.log("\nExecuting TRUNCATE TABLE ... CASCADE across all tables...");
  const truncateQuery = `TRUNCATE TABLE ${tableNames.map((t) => `"${t}"`).join(", ")} CASCADE;`;
  await sql(truncateQuery);

  console.log("✔ Truncate command completed successfully.\n");

  // Verify all counts are now 0
  console.log("Verifying table row counts:");
  let totalRows = 0;
  for (const table of tableNames) {
    const res = await sql(`SELECT count(*) FROM "${table}"`);
    const count = parseInt(res[0].count, 10);
    totalRows += count;
    console.log(`  • ${table.padEnd(25)}: ${count} rows`);
  }

  console.log("=================================================================");
  if (totalRows === 0) {
    console.log("DATABASE CLEARED CLEANLY! Total rows remaining: 0");
    console.log("All table schemas, constraints, and indexes are preserved.");
    console.log("Ready for clean onboarding from scratch.");
  } else {
    console.warn(`Warning: Some tables still retain ${totalRows} rows.`);
  }
  console.log("=================================================================");
}

clearDatabase().catch((err) => {
  console.error("Fatal error clearing database:", err);
  process.exit(1);
});
