/**
 * PACIA MASTER BACKEND TEST RUNNER
 * 
 * Orchestrates and executes all 10 backend test categories:
 * 1. Unit Tests (Qualification Scoring & Property Adapters)
 * 2. API Tests (Lead Management REST Endpoints)
 * 3. Database Tests (Core Domain Schema & FK Constraints)
 * 4. Workflow Tests (BullMQ Async Queue Lifecycle)
 * 5. Webhook Tests (Lead Ingestion & Deduplication)
 * 6. Authorization Tests (RBAC & Permissions Enforcement)
 * 7. Tenant Isolation Tests (Cross-Workspace Partitioning)
 * 8. AI Tool Tests (Controlled Tool Execution Sandbox)
 * 9. Vapi Tests (Voice Telephony & Webhook Lifecycle)
 * 10. Calendar Tests (Google Calendar & Availability)
 */

import { spawn } from "child_process";
const path = require("path");
const fs = require("fs");

interface TestCategory {
  id: string;
  name: string;
  file: string;
}

const CATEGORIES: TestCategory[] = [
  {
    id: "unit",
    name: "1. Unit Tests (Qualification Scoring & BANT)",
    file: "day11-qualification-scoring.spec.ts",
  },
  {
    id: "api",
    name: "2. API Tests (Leads Management Endpoints)",
    file: "day6-leads-api.spec.ts",
  },
  {
    id: "database",
    name: "3. Database Tests (Domain Schema & FK Lifecycle)",
    file: "day4-domain-schema.spec.ts",
  },
  {
    id: "workflow",
    name: "4. Workflow Tests (BullMQ Async Queue Infrastructure)",
    file: "day8-queue-infrastructure.spec.ts",
  },
  {
    id: "webhook",
    name: "5. Webhook Tests (Lead Ingestion & Deduplication)",
    file: "day5-lead-ingestion.spec.ts",
  },
  {
    id: "authorization",
    name: "6. Authorization Tests (RBAC & Permissions)",
    file: "day3-authorization.spec.ts",
  },
  {
    id: "isolation",
    name: "7. Tenant Isolation Tests (Workspace Boundary)",
    file: "tenant-isolation.spec.ts",
  },
  {
    id: "ai-tools",
    name: "8. AI Tool Tests (Controlled Execution Sandbox)",
    file: "day9-controlled-ai-tools.spec.ts",
  },
  {
    id: "vapi",
    name: "9. Vapi Tests (Voice Telephony & Human Takeover)",
    file: "day12-vapi-telephony.spec.ts",
  },
  {
    id: "calendar",
    name: "10. Calendar Tests (Inspection Booking & Google Sync)",
    file: "day15-calendar-booking.spec.ts",
  },
  {
    id: "stabilization",
    name: "11. Stabilization Tests (Day 28 Concurrency, Resilience & Edge States)",
    file: "day28-stabilization.spec.ts",
  },
  {
    id: "production",
    name: "12. Production Readiness Tests (Day 29 Env, Secrets, Health & Sentry)",
    file: "day29-production-readiness.spec.ts",
  },
  {
    id: "launch",
    name: "13. Production Launch Tests (Day 30 Container, Smoke & Sign-Off)",
    file: "day30-production-launch.spec.ts",
  },
];

interface ExecutionResult {
  category: TestCategory;
  passed: boolean;
  durationMs: number;
  error?: string;
}

async function runCategory(category: TestCategory): Promise<ExecutionResult> {
  const startTime = Date.now();
  const testDir = __dirname;
  const serverDir = path.resolve(testDir, "..");
  const testFilePath = path.join(testDir, category.file);
  const tsNodeBin = path.join(serverDir, "node_modules/.bin/ts-node");
  const tsConfigPath = path.join(serverDir, "tsconfig.json");
  const envPath = path.join(serverDir, ".env");
  const nodeModulesPath = path.join(serverDir, "node_modules");

  return new Promise((resolve) => {
    const child = spawn(
      tsNodeBin,
      [
        "-r",
        "dotenv/config",
        "--transpile-only",
        "--project",
        tsConfigPath,
        testFilePath,
      ],
      {
        cwd: serverDir,
        env: {
          ...process.env,
          NODE_ENV: "test",
          ALLOW_MOCK_AUTH: "true",
          AI_PROVIDER: "mock",
          VAPI_PROVIDER: "mock",
          CALENDAR_PROVIDER: "mock",
          NOTIFICATION_PROVIDER: "mock",
          DOTENV_CONFIG_PATH: envPath,
          NODE_PATH: nodeModulesPath,
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    child.on("close", (code) => {
      const durationMs = Date.now() - startTime;
      const passed = code === 0;

      if (!passed) {
        console.error(`\x1b[31m✕ FAILED:\x1b[0m ${category.name}`);
        if (errorOutput.trim()) {
          console.error(errorOutput.slice(-500));
        } else if (output.trim()) {
          console.error(output.slice(-500));
        }
      } else {
        console.log(`\x1b[32m✔ PASSED:\x1b[0m ${category.name} (${durationMs}ms)`);
      }

      resolve({
        category,
        passed,
        durationMs,
        error: passed ? undefined : (errorOutput || output).slice(-300),
      });
    });

    child.on("error", (err) => {
      const durationMs = Date.now() - startTime;
      console.error(`\x1b[31m✕ ERROR launching ${category.name}:\x1b[0m`, err.message);
      resolve({
        category,
        passed: false,
        durationMs,
        error: err.message,
      });
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const categoryArg = args.find((a) => a.startsWith("--category="))?.split("=")[1];

  let selectedCategories = CATEGORIES;
  if (categoryArg) {
    selectedCategories = CATEGORIES.filter(
      (c) => c.id === categoryArg || c.name.toLowerCase().includes(categoryArg.toLowerCase())
    );
    if (selectedCategories.length === 0) {
      console.error(`\x1b[31mUnknown category: "${categoryArg}".\x1b[0m`);
      console.log(`Available categories: ${CATEGORIES.map((c) => c.id).join(", ")}`);
      process.exit(1);
    }
  }

  console.log("\n=================================================================");
  console.log(" PACIA BACKEND TEST SUITE: FULL-SPECTRUM VERIFICATION");
  console.log("=================================================================");
  console.log(` Categories to run : ${selectedCategories.length}`);
  console.log(` Target Environment: NODE_ENV=test (Neon DB + Mock AI/Vapi/Calendar)`);
  console.log("=================================================================\n");

  const suiteStartTime = Date.now();
  const results: ExecutionResult[] = [];

  for (const cat of selectedCategories) {
    process.stdout.write(`▶ Executing ${cat.name}... `);
    const result = await runCategory(cat);
    results.push(result);
  }

  const totalDuration = Date.now() - suiteStartTime;
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n=================================================================");
  console.log(" PACIA BACKEND TEST SUMMARY");
  console.log("=================================================================");
  for (const r of results) {
    const status = r.passed
      ? `\x1b[32mPASSED\x1b[0m`
      : `\x1b[31mFAILED\x1b[0m`;
    const paddedName = r.category.name.padEnd(52, " ");
    console.log(` ${paddedName} : ${status} (${r.durationMs}ms)`);
  }
  console.log("-----------------------------------------------------------------");
  console.log(` Total Categories : ${total}`);
  console.log(` Passed           : \x1b[32m${passed}\x1b[0m`);
  console.log(` Failed           : ${failed > 0 ? `\x1b[31${failed}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);
  console.log(` Total Time       : ${(totalDuration / 1000).toFixed(2)}s`);
  console.log("=================================================================\n");

  if (failed > 0) {
    console.error("\x1b[31mSOME BACKEND TEST CATEGORIES FAILED!\x1b[0m\n");
    process.exit(1);
  } else {
    console.log("\x1b[32mALL BACKEND TEST CATEGORIES PASSED (100%)!\x1b[0m\n");
    process.exit(0);
  }
}

main();
