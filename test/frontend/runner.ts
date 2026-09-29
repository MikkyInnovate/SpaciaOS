/**
 * PACIA MASTER FRONTEND TEST RUNNER
 * 
 * Orchestrates and executes all 4 frontend test suites:
 * 1. Component Tests
 * 2. User-Flow Tests
 * 3. Browser & Route Tests
 * 4. Responsive Tests
 */

import { runner } from "./setup";
import { runComponentTests } from "./components.spec";
import { runUserFlowTests } from "./user-flows.spec";
import { runBrowserTests } from "./browser.spec";
import { runResponsiveTests } from "./responsive.spec";
import { runStabilizationTests } from "./stabilization.spec";
import { runProductionReadinessTests } from "./production-readiness.spec";
import { seedInMemoryLeads, clearInMemoryLeads } from "@/features/leads/services/leads-service";
import { seedInMemoryProperties, clearInMemoryProperties } from "@/features/properties/services/properties-service";
import { callsService } from "@/features/calls/services/calls-service";
import { notificationsService, INITIAL_TEST_NOTIFICATIONS } from "@/features/notifications/services/notifications-service";
import { appointmentsService, INITIAL_TEST_APPOINTMENTS } from "@/features/appointments/services/appointments-service";
import { MOCK_LEADS } from "@/features/leads/data/mock-leads";
import { MOCK_PROPERTIES } from "@/features/properties/data/mock-properties";
import { MOCK_CALLS } from "@/features/calls/data/mock-calls";

async function main() {
  const args = process.argv.slice(2);
  const suiteArg = args.find((a) => a.startsWith("--suite="))?.split("=")[1];

  console.log("\n=================================================================");
  console.log(" PACIA FRONTEND TEST SUITE: FULL-SPECTRUM VERIFICATION");
  console.log("=================================================================");

  // Enforce isolated offline test execution so tests are independent of live DB state
  process.env.BACKEND_API_URL = "http://offline";

  // Provision isolated in-memory test fixtures for headless test harness execution
  seedInMemoryLeads(MOCK_LEADS);
  seedInMemoryProperties(MOCK_PROPERTIES);
  callsService.seedCalls(MOCK_CALLS);
  notificationsService.seedNotifications(INITIAL_TEST_NOTIFICATIONS);
  appointmentsService.seedAppointments(INITIAL_TEST_APPOINTMENTS);

  const startTime = Date.now();

  try {
    if (!suiteArg || suiteArg === "components") {
      console.log("\n\x1b[1m\x1b[36m▶ EXECUTING: Component Tests\x1b[0m");
      await runComponentTests();
    }

    if (!suiteArg || suiteArg === "flows") {
      console.log("\n\x1b[1m\x1b[36m▶ EXECUTING: User-Flow Tests\x1b[0m");
      await runUserFlowTests();
    }

    if (!suiteArg || suiteArg === "browser") {
      console.log("\n\x1b[1m\x1b[36m▶ EXECUTING: Browser & Route Tests\x1b[0m");
      await runBrowserTests();
    }

    if (!suiteArg || suiteArg === "responsive") {
      console.log("\n\x1b[1m\x1b[36m▶ EXECUTING: Responsive Tests\x1b[0m");
      await runResponsiveTests();
    }

    if (!suiteArg || suiteArg === "stabilization") {
      console.log("\n\x1b[1m\x1b[36m▶ EXECUTING: Stabilization Tests\x1b[0m");
      await runStabilizationTests();
    }

    if (!suiteArg || suiteArg === "production") {
      console.log("\n\x1b[1m\x1b[36m▶ EXECUTING: Production Readiness Tests\x1b[0m");
      await runProductionReadinessTests();
    }

    const totalDuration = Date.now() - startTime;
    const total = runner.results.length;
    const passed = runner.results.filter((r) => r.passed).length;
    const failed = runner.results.filter((r) => !r.passed).length;

    console.log("\n=================================================================");
    console.log(" PACIA FRONTEND TEST SUMMARY");
    console.log("=================================================================");
    console.log(` Total Suites  : ${suiteArg ? 1 : 6}`);
    console.log(` Total Tests   : ${total}`);
    console.log(` Passed        : \x1b[32m${passed}\x1b[0m`);
    console.log(` Failed        : ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);
    console.log(` Total Time    : ${totalDuration}ms`);
    console.log("=================================================================\n");

    clearInMemoryLeads();
    clearInMemoryProperties();
    callsService.clearCalls();
    notificationsService.clearNotifications();
    appointmentsService.clearAppointments();

    if (failed > 0) {
      console.error("\x1b[31mSOME FRONTEND TESTS FAILED!\x1b[0m\n");
      process.exit(1);
    } else {
      console.log("\x1b[32mALL FRONTEND TESTS PASSED (100%)!\x1b[0m\n");
      process.exit(0);
    }
  } catch (err) {
    clearInMemoryLeads();
    clearInMemoryProperties();
    callsService.clearCalls();
    notificationsService.clearNotifications();
    appointmentsService.clearAppointments();
    console.error("\x1b[31mFatal test runner error:\x1b[0m", err);
    process.exit(1);
  }
}

main();
